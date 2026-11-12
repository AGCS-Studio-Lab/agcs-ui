#!/usr/bin/env node
// Copia este archivo en cada app. Sin dependencias; rutas relativas al cwd.
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";

const defaults = ["**/node_modules/**", "**/agcs-ui/**", "**/*.{test,spec}.{js,jsx,ts,tsx,mjs,html}",
  "**/{test,tests,__tests__,spec,specs,__mocks__}/**"];
const extensions = /\.(?:js|jsx|ts|tsx|mjs|html)$/;
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

/** Conserva líneas y literales, borra comentarios JS, JSX y HTML. */
function withoutComments(source) {
  return source.replace(/(["'`])(?:\\[\s\S]|(?!\1)[^\\])*?\1|\/\*[\s\S]*?\*\/|\/\/[^\n]*|<!--[\s\S]*?-->/g,
    (match) => /^(?:\/\*|\/\/|<!--)/.test(match) ? match.replace(/[^\n]/g, " ") : match);
}

export function scan(source, path) {
  const code = withoutComments(source);
  const findings = [];
  const add = (rule, at) => {
    const line = code.slice(0, at).split("\n").length;
    if (!findings.some((row) => row.line === line && row.rule === rule)) findings.push({ path, line, rule });
  };
  for (const [rule, pattern] of [
    ["aria-expanded", /\baria-expanded["']?\s*[:=]/g],
    ["details-element", /<details(?=[\s>])/g],
    ["native-select", /<select(?=[\s>])/g],
  ]) for (const match of code.matchAll(pattern)) add(rule, match.index);
  // Incluye import/export estáticos, import() y require(). Conserva el bloque
  // completo para identificar ChevronDown, ChevronUp y sus alias.
  const imports = /\b(?:import|export)\s+(?:[^;'"`]*?\s+from\s*)?["']([^"']+)["']|\b(?:import|require)\s*\(\s*["']([^"']+)["']\s*\)/g;
  for (const match of code.matchAll(imports)) {
    const module = match[1] ?? match[2];
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
