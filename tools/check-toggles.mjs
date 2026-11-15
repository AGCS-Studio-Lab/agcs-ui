#!/usr/bin/env node
// Copia este archivo en cada app. Sin dependencias; rutas relativas al cwd.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";

const defaults = ["**/node_modules/**", "**/agcs-ui/**", "**/*.{test,spec}.{js,jsx,ts,tsx,mjs,cjs,html}",
  "**/{test,tests,__tests__,spec,specs,__mocks__}/**"];
const extensions = /\.(?:js|jsx|ts|tsx|mjs|cjs|html)$/;
const ruleIds = ["aria-expanded", "details-element", "native-select", "radix-toggle-import",
  "shadcn-toggle-import", "cmdk-import", "lucide-chevron"];

/** Glob pequeño: *, **, ?, y alternativas {a,b}; siempre con /. */
function glob(pattern) {
  let source = "";
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === "*" && pattern[i + 1] === "*") {
      i++;
      if (pattern[i + 1] === "/") { i++; source += "(?:.*/)?"; }
      else source += ".*";
    } else if (ch === "*") source += "[^/]*";
    else if (ch === "?") source += "[^/]";
    else if (ch === "{") source += "(?:";
    else if (ch === "}") source += ")";
    else if (ch === ",") source += "|";
    else source += ch.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${source}$`);
}

/** Máscara léxica: conserva posiciones, código y nombres de atributos, no texto.
 * Los literales JS se guardan aparte para reconocer módulos y claves de props.
 * No analiza tipos ni resuelve imports construidos dinámicamente.
 */
function executableSource(source, path) {
  const chars = source.split("");
  const literals = [];
  let i = 0;
  const mask = (start, end) => {
    for (let at = start; at < end; at++) if (!/[\r\n]/.test(chars[at])) chars[at] = " ";
  };
  const comment = (end, width) => {
    const start = i;
    const at = source.indexOf(end, i + width);
    i = at === -1 ? source.length : at + end.length;
    mask(start, i);
  };
  const quoted = (js) => {
    const start = i++;
    const quote = source[start];
    while (i < source.length) {
      // JS escapes quotes; HTML/JSX attribute strings use entities instead.
      if (js && source[i] === "\\") i += 2;
      else if (source[i++] === quote) break;
    }
    if (js) literals.push({ start, end: i, text: source.slice(start + 1, i - 1) });
    mask(start, i);
    // Conserva el límite del token: dos strings no forman un solo import.
    if (js) { chars[start] = quote; chars[i - 1] = quote; }
  };
  const template = () => {
    mask(i, ++i);
    while (i < source.length) {
      if (source[i] === "\\") { mask(i, i + 2); i += 2; }
      else if (source[i] === "`") { mask(i, ++i); return; }
      else if (source.startsWith("${", i)) {
        mask(i, i + 2); i += 2;
        js(true);
      } else { mask(i, i + 1); i++; }
    }
  };
  const tag = () => {
    const match = /^<\/?([\w.-]+)?/.exec(source.slice(i));
    const name = match[1] ?? "";
    const closing = source[i + 1] === "/";
    i += match[0].length;
    while (i < source.length) {
      if (source[i] === '"' || source[i] === "'") quoted(false);
      else if (source[i] === "{") { i++; js(true); }
      else if (source[i] === ">") {
        const selfClosing = source[i - 1] === "/";
        i++;
        return { name, closing, selfClosing };
      } else i++;
    }
    return { name, closing, selfClosing: true };
  };
  const jsx = () => {
    const opened = tag();
    if (opened.selfClosing || opened.closing) return;
    // Un genérico/assertion de TS (<T>, <T,>) no tiene cierre de elemento.
    if (!source.slice(i).includes(`</${opened.name}`)) return;
    while (i < source.length) {
      if (source.startsWith("<!--", i)) comment("-->", 4);
      else if (source.startsWith("</", i)) { tag(); return; }
      else if (source[i] === "<" && /[\w>]/.test(source[i + 1] ?? "")) jsx();
      else if (source[i] === "{") { i++; js(true); }
      else { mask(i, i + 1); i++; }
    }
  };
  const startsExpression = () => {
    // Una comparación o un argumento de tipo (n<limit, fn<T>) no abre JSX.
    const before = chars.slice(0, i).join("").trimEnd();
    return !before || /[=([{,:;!?&|>+*/%~^-]$/.test(before) || /\b(?:return|yield|case)$/.test(before);
  };
  const regexp = () => {
    const start = i++;
    let characterClass = false;
    while (i < source.length) {
      const ch = source[i++];
      if (ch === "\\") i++;
      else if (ch === "[") characterClass = true;
      else if (ch === "]") characterClass = false;
      else if (ch === "/" && !characterClass) break;
    }
    while (/[a-z]/i.test(source[i] ?? "")) i++;
    mask(start, i);
    chars[start] = "0"; // Un literal sigue siendo un token, no espacio vacío.
  };
  function js(braced = false, script = false) {
    let depth = 0;
    while (i < source.length) {
      if (script && source.startsWith("</script", i)) return;
      if (source.startsWith("//", i)) comment("\n", 2);
      else if (source.startsWith("/*", i)) comment("*/", 2);
      else if (source.startsWith("<!--", i)) comment("-->", 4);
      else if (source[i] === "/" && startsExpression()) regexp();
      else if (source[i] === '"' || source[i] === "'") quoted(true);
      else if (source[i] === "`") template();
      else if (source[i] === "<" && /[a-zA-Z>]/.test(source[i + 1] ?? "") && startsExpression()) jsx();
      else if (source[i] === "{") { depth++; i++; }
      else if (source[i] === "}") {
        i++;
        if (braced && depth === 0) return;
        depth--;
      } else i++;
    }
  }
  if (/\.html$/.test(path)) {
    while (i < source.length) {
      if (source.startsWith("<!--", i)) comment("-->", 4);
      else if (source.startsWith("//", i)) comment("\n", 2);
      else if (source.startsWith("/*", i)) comment("*/", 2);
      else if (source[i] === "<" && /[a-zA-Z/!]/.test(source[i + 1] ?? "")) {
        const opened = tag();
        if (opened.name === "script" && !opened.closing) js(false, true);
      } else { mask(i, i + 1); i++; }
    }
  } else js();
  return { code: chars.join(""), literals };
}

export function scan(source, path) {
  const { code, literals } = executableSource(source, path);
  const findings = [];
  const add = (rule, at) => {
    const line = code.slice(0, at).split("\n").length;
    if (!findings.some((row) => row.line === line && row.rule === rule)) findings.push({ path, line, rule });
  };
  for (const [rule, pattern] of [
    ["aria-expanded", /\baria-expanded\s*[:=]/g],
    ["details-element", /<details(?=[\s>])/g],
    ["native-select", /<select(?=[\s>])/g],
  ]) for (const match of code.matchAll(pattern)) add(rule, match.index);
  for (const literal of literals) {
    const after = code.slice(literal.end);
    const before = code.slice(0, literal.start);
    if (literal.text === "aria-expanded" && /[,{]\s*$/.test(before) && /^\s*:/.test(after)) add("aria-expanded", literal.start);
    // Las palabras import/require dentro de texto ya están enmascaradas. Solo
    // un literal en posición de módulo puede producir un hallazgo de import.
    const declaration = /\b(?:import|export)\s+(?:(?:(?!\b(?:import|export)\b)[\w$*,{}\s])*?\bfrom\s*)?$/.exec(before);
    const call = /\b(?:import|require)\s*\(\s*$/.exec(before);
    const match = declaration ?? (/^\s*\)/.test(after) ? call : null);
    if (!match) continue;
    const module = literal.text;
    if (/^@radix-ui\/react-(?:select|popover|dropdown-menu|accordion|collapsible|navigation-menu|menubar|context-menu|hover-card)(?:\/|$)/.test(module)) add("radix-toggle-import", match.index);
    if (/(?:^|\/)components\/ui\/(?:select|popover|dropdown-menu|accordion|collapsible|command|combobox)(?:\.[cm]?[jt]sx?)?$/.test(module)) add("shadcn-toggle-import", match.index);
    if (/^cmdk(?:\/|$)/.test(module)) add("cmdk-import", match.index);
    if (module === "lucide-react" && /\bChevron\w*/.test(match[0])) add("lucide-chevron", match.index);
  }
  return findings;
}

export function run(args = process.argv.slice(2), cwd = process.cwd()) {
  let configPath = "agcs-toggles.json";
  let explicit = false;
  let baseline = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--config" && args[i + 1]) { configPath = args[++i]; explicit = true; }
    else if (args[i] === "--write-baseline") baseline = true;
    else throw new Error(`Argumento desconocido: ${args[i]}`);
  }
  const target = resolve(cwd, configPath);
  if (explicit && !existsSync(target)) throw new Error(`No existe ${configPath}`);
  const config = existsSync(target) ? JSON.parse(readFileSync(target, "utf8")) : {};
  const { roots = ["src"], ignore = [], allow = [] } = config;
  if (!Array.isArray(roots) || !roots.length || !roots.every((p) => typeof p === "string" && p.trim()) ||
      !Array.isArray(ignore) || !ignore.every((p) => typeof p === "string") || !Array.isArray(allow)) throw new Error("Config inválida: revisa roots, ignore y allow");
  for (const entry of allow) {
    if (!entry || typeof entry.path !== "string" || !entry.path.trim() || typeof entry.reason !== "string" || !entry.reason.trim() ||
        (entry.rule !== undefined && !ruleIds.includes(entry.rule))) throw new Error("Cada excepción necesita path, rule válido (opcional) y reason no vacío");
  }
  const ignored = [...defaults, ...ignore].map(glob);
  const seen = new Set();
  const findings = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const file = resolve(dir, entry.name);
      const path = relative(cwd, file).split(sep).join("/");
      if (ignored.some((pattern) => pattern.test(path) || (entry.isDirectory() && pattern.test(`${path}/_`)))) continue;
      if (entry.isDirectory()) walk(file);
      else if (entry.isFile() && extensions.test(path) && !seen.has(path)) {
        seen.add(path);
        findings.push(...scan(readFileSync(file, "utf8"), path));
      }
    }
  }
  for (const root of roots) walk(resolve(cwd, root));
  if (baseline) {
    const unique = new Map(findings.map(({ path, rule }) => [`${path}:${rule}`, { path, rule, reason: "baseline: migrar" }]));
    writeFileSync(target, `${JSON.stringify({ ...config, roots, ignore, allow: [...unique.values()] }, null, 2)}\n`);
    console.log(`${configPath}: ${unique.size} excepciones baseline: migrar`);
    return 0;
  }
  const entries = allow.map((entry) => ({ ...entry, pattern: glob(entry.path), used: false }));
  let failed = false;
  for (const finding of findings) {
    const matches = entries.filter((entry) => entry.pattern.test(finding.path) && (!entry.rule || entry.rule === finding.rule));
    for (const entry of matches) entry.used = true;
    if (matches.length) continue;
    console.error(`${finding.path}:${finding.line} ${finding.rule}: usa Select, Disclosure o Menu de agcs-ui`);
    failed = true;
  }
  for (const entry of entries.filter((entry) => !entry.used)) {
    console.error(`${entry.path}: excepción obsoleta (${entry.rule ?? "todas"}); elimina la entrada de allow`);
    failed = true;
  }
  if (!failed) console.log("Toggles: sin hallazgos pendientes ni excepciones obsoletas");
  return failed ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { process.exitCode = run(); }
  catch (error) { console.error(`check-toggles: ${error.message}`); process.exitCode = 1; }
}
