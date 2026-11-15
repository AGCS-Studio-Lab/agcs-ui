import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { scan } from "../tools/check-toggles.mjs";
const script = fileURLToPath(new URL("../tools/check-toggles.mjs", import.meta.url));
function fixture(files, config) {
  const dir = mkdtempSync(join(tmpdir(), "agcs-toggles-"));
  mkdirSync(join(dir, "src"));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(join(dir, path, ".."), { recursive: true }); writeFileSync(join(dir, path), text);
  }
  if (config) writeFileSync(join(dir, "agcs-toggles.json"), JSON.stringify(config));
  return { dir, run: (...args) => spawnSync(process.execPath, [script, ...args], { cwd: dir, encoding: "utf8" }),
    close: () => rmSync(dir, { recursive: true, force: true }) };
}
describe("check-toggles", () => {
  it("reports every rule with the source line and Spanish fix hint", () => {
    const f = fixture({ "src/a.tsx": `import { ChevronDown as Down } from "lucide-react";
import {
 Popover
} from "@radix-ui/react-popover";
import { Select } from "@/components/ui/select";
import { Command } from 'cmdk';
const x = <details><select aria-expanded={true} /></details>;` });
    try {
      const result = f.run(); assert.equal(result.status, 1);
      for (const rule of ["lucide-chevron", "radix-toggle-import", "shadcn-toggle-import", "cmdk-import", "details-element", "native-select", "aria-expanded"])
        assert.match(result.stderr, new RegExp(`src/a.tsx:\\d+ ${rule}: usa Select, Disclosure o Menu de agcs-ui`));
      assert.match(result.stderr, /src\/a.tsx:7 native-select/);
    } finally { f.close(); }
  });
  it("recognizes every Radix/shadcn toggle, export, dynamic import and side effect import", () => {
    for (const name of ["select", "popover", "dropdown-menu", "accordion", "collapsible", "navigation-menu", "menubar", "context-menu", "hover-card"])
      assert.equal(scan(`import('@radix-ui/react-${name}')`, "a.js")[0].rule, "radix-toggle-import");
    for (const name of ["select", "popover", "dropdown-menu", "accordion", "collapsible", "command", "combobox"])
      assert.equal(scan(`export { X } from '../components/ui/${name}.tsx'`, "a.ts")[0].rule, "shadcn-toggle-import");
    assert.equal(scan(`require("cmdk")`, "a.mjs")[0].rule, "cmdk-import");
    assert.equal(scan(`import "cmdk"`, "a.js")[0].rule, "cmdk-import");
    assert.equal(scan(`const props = { "aria-expanded": open }`, "a.jsx")[0].rule, "aria-expanded");
    assert.deepEqual(scan(`// <select>\n/* aria-expanded=true */\n<!-- <details> -->\nimport { Check } from 'lucide-react';`, "a.html"), []);
  });
  it("ignores vendor, dependencies, tests, specs and configured globs across extensions", () => {
    const files = Object.fromEntries(["src/node_modules/x/a.js", "src/agcs-ui/select.jsx", "src/a.test.tsx", "src/a.spec.mjs", "src/tests/a.html", "src/__tests__/a.ts", "src/legacy/a.jsx"].map((path) => [path, "<select>"]));
    const f = fixture(files, { ignore: ["src/legacy/**"] });
    try { assert.equal(f.run().status, 0); } finally { f.close(); }
  });
  it("walks production cjs and excludes cjs tests, specs and mocks", () => {
    const f = fixture({
      "src/production.cjs": 'const command = require("cmdk");',
      "src/skip.test.cjs": 'require("cmdk")',
      "src/skip.spec.cjs": 'require("cmdk")',
      "src/__mocks__/skip.cjs": 'require("cmdk")',
    });
    try {
      const result = f.run();
      assert.equal(result.status, 1);
      assert.match(result.stderr, /src\/production.cjs:1 cmdk-import/);
      assert.equal(result.stderr.trim().split("\n").length, 1);
    } finally { f.close(); }
  });
  it("ignores string and template text while scanning executable interpolations at exact lines", () => {
    const source = [
      `const example = "<select> aria-expanded=true <details> import 'cmdk'";`,
      `const escaped = 'can\\'t <select> require("cmdk")';`,
      'const template = `<select> aria-expanded=true <details>',
      'import "cmdk"; ${(() => {',
      '  require("cmdk");',
      '  const props = { "aria-expanded": true };',
      '  const nested = `ignored <select> ${<select aria-expanded="true" />}`;',
      '})()} more <details>`;',
      '// <select> require("cmdk")',
      '/* aria-expanded=true */',
      'import { ChevronDown as Down } from "lucide-react";',
      'export { Select } from "@/components/ui/select";',
      `const real = <details title="<select> aria-expanded=true import 'cmdk'">`,
      '  <select aria-expanded="false" data-note="<details>" />',
      '</details>;',
    ].join("\n");
    assert.deepEqual(scan(source, "a.jsx").map(({ line, rule }) => [line, rule]).sort(), [
      [5, "cmdk-import"], [6, "aria-expanded"], [7, "native-select"], [7, "aria-expanded"],
      [11, "lucide-chevron"], [12, "shadcn-toggle-import"], [13, "details-element"],
      [14, "native-select"], [14, "aria-expanded"],
    ].sort());
  });
  it("preserves module specifiers and quoted attribute/property names without scanning their content", () => {
    const source = [
      `import "cmdk";`,
      `const x = import(/* note */ "@radix-ui/react-select");`,
      `import { ChevronUp as Up } from 'lucide-react';`,
      `const props = { 'aria-expanded': true, text: "<select>" };`,
      `const view = <Widget {...{ "aria-expanded": true }} title={'<details>'} />;`,
      `const text = "import \\"cmdk\\"";`,
      `const paths = ['cmdk', '@radix-ui/react-select'];`,
    ].join("\n");
    assert.deepEqual(scan(source, "a.tsx").map(({ line, rule }) => [line, rule]).sort(), [
      [1, "cmdk-import"], [2, "radix-toggle-import"], [3, "lucide-chevron"],
      [4, "aria-expanded"], [5, "aria-expanded"],
    ].sort());
  });
  it("scans real HTML tags and attributes but ignores quoted attribute contents and comments", () => {
    const source = [
      '<!-- <select aria-expanded="true"> -->',
      `<div title="<select> aria-expanded=true import 'cmdk'">`,
      '<details data-note="<select>">',
      '<select aria-expanded="false"></select>',
      '</details></div>',
    ].join("\n");
    assert.deepEqual(scan(source, "a.html").map(({ line, rule }) => [line, rule]).sort(), [
      [3, "details-element"], [4, "native-select"], [4, "aria-expanded"],
    ].sort());
  });
  it("keeps adjacent string tokens separate and scans nested expressions in HTML scripts", () => {
    assert.deepEqual(scan(`import "safe-package"\n"cmdk";`, "a.js"), []);
    assert.deepEqual(scan(`const ok = n<limit; const typed = fn<T>(); const identity = <T,>(x: T) => x;\nimport "cmdk";`, "a.ts"),
      [{ path: "a.ts", line: 2, rule: "cmdk-import" }]);
    const source = [
      '<script type="module">',
      'const text = `<select> \\` ignored ${(() => {',
      '  /* <select> */ return { children: <select title="<details>" /> };',
      '})()}`;',
      'import "cmdk";',
      '</script>',
      '<details aria-expanded="false">Texto</details>',
    ].join("\n");
    assert.deepEqual(scan(source, "a.html").map(({ line, rule }) => [line, rule]).sort(), [
      [3, "native-select"], [5, "cmdk-import"], [7, "details-element"], [7, "aria-expanded"],
    ].sort());
  });
  it("keeps regex bodies and ternary strings out of findings without hiding later imports", () => {
    const source = [
      'const pattern = /["\\\'`{}] <select> aria-expanded=true/g;',
      'const label = condition ? "aria-expanded" : "<details>";',
      'const ratio = total / count;',
      'import "cmdk";',
      'const props = { "aria-expanded": true };',
    ].join("\n");
    assert.deepEqual(scan(source, "a.js").map(({ line, rule }) => [line, rule]).sort(), [
      [4, "cmdk-import"], [5, "aria-expanded"],
    ].sort());
  });
  it("attributes semicolon-free imports to the actual declaration line", () => {
    const source = `export const unrelated = true
import {
  ChevronDown,
} from "lucide-react"
export { Command } from "cmdk"`;
    assert.deepEqual(scan(source, "a.ts").map(({ line, rule }) => [line, rule]),
      [[2, "lucide-chevron"], [5, "cmdk-import"]]);
  });
  for (const expression of ["counter++", "counter--", "counter++ /* comment */", "(counter)", "getValue()", "object.if(ready)", "items[0]", '"text"', "`text`", "<Widget />", "<Widget>text</Widget>"]) {
    it(`preserves division after ${expression} and reports the next import`, () => {
      assert.deepEqual(scan(`${expression} / divisor;\nimport "cmdk";`, "a.jsx"),
        [{ path: "a.jsx", line: 2, rule: "cmdk-import" }]);
    });
  }
  it("keeps regex literals masked after operators and control parentheses", () => {
    for (const prefix of ["const pattern =", "counter++ +", "counter+++", "counter-- -", "if (ready)", "if (check(ready))", "while (ready)", "for (; ready;)"]) {
      const source = `${prefix} /["'\x60{}] <select> aria-expanded=true/.test(text);\nimport "cmdk";`;
      assert.deepEqual(scan(source, "a.js"), [{ path: "a.js", line: 2, rule: "cmdk-import" }], prefix);
    }
  });
  it("preserves regex literals after TypeScript assertions without treating them as JSX values", () => {
    const source = `const pattern = <RegExp>/["'\x60{}] <select> aria-expanded=true/;\nimport "cmdk";`;
    assert.deepEqual(scan(source, "a.ts"), [{ path: "a.ts", line: 2, rule: "cmdk-import" }]);
  });
  for (const [open, close] of [["SCRIPT", "SCRIPT"], ["sCrIpT", "ScRiPt"], ["script", "SCRIPT"], ["SCRIPT", "script"]]) {
    it(`scans HTML ${open}/${close} scripts and real elements after the closing tag`, () => {
      assert.deepEqual(scan(`<${open}>import "cmdk";</${close}>`, "a.html"),
        [{ path: "a.html", line: 1, rule: "cmdk-import" }]);
      const source = [
        `<${open} type="module">`,
        `const text = "<select> aria-expanded=true import 'cmdk' </${close}>";`,
        'const template = `<details> import "cmdk";`;',
        'import "cmdk";',
        `</${close}>`,
        'import "cmdk";', // Texto HTML, fuera del script.
        '<details aria-expanded="false">import "cmdk";</details>',
        '<select></select>',
      ].join("\n");
      assert.deepEqual(scan(source, "a.html").map(({ line, rule }) => [line, rule]).sort(), [
        [4, "cmdk-import"], [7, "details-element"], [7, "aria-expanded"], [8, "native-select"],
      ].sort());
    });
  }
  it("keeps JSX Script components as markup and scans their executable children", () => {
    assert.deepEqual(scan('const view = <Script>import "cmdk"; {require("cmdk")}</Script>;\nimport "cmdk";', "a.jsx"), [
      { path: "a.jsx", line: 1, rule: "cmdk-import" },
      { path: "a.jsx", line: 2, rule: "cmdk-import" },
    ]);
  });
  it("requires reasons, honors rule-specific allows and rejects stale entries", () => {
    const f = fixture({ "src/a.jsx": "<select aria-expanded={true}>" });
    const config = (allow) => writeFileSync(join(f.dir, "agcs-toggles.json"), JSON.stringify({ allow }));
    try {
      config([{ path: "src/a.jsx" }]); assert.match(f.run().stderr, /reason/);
      config([{ path: "src/a.jsx", reason: " " }]); assert.equal(f.run().status, 1);
      config([{ path: "src/a.jsx", rule: "native-select", reason: "migrar" }]);
      assert.match(f.run().stderr, /aria-expanded/);
      config([{ path: "src/a.jsx", reason: "migrar" }]); assert.equal(f.run().status, 0);
      writeFileSync(join(f.dir, "src/a.jsx"), "const done = true");
      assert.match(f.run().stderr, /excepción obsoleta/); assert.equal(f.run().status, 1);
    } finally { f.close(); }
  });
  it("writes a baseline to the requested config and detects when migration removes a finding", () => {
    const f = fixture({ "src/a.html": "<select>\n<select>\n<details>", "lib/b.mjs": "import 'cmdk'" });
    writeFileSync(join(f.dir, "custom.json"), JSON.stringify({ roots: ["src", "lib"] }));
    try {
      assert.equal(f.run("--config", "custom.json", "--write-baseline").status, 0);
      const config = JSON.parse(readFileSync(join(f.dir, "custom.json"), "utf8"));
      assert.equal(config.allow.length, 3);
      assert.ok(config.allow.every((entry) => entry.reason === "baseline: migrar"));
      assert.equal(f.run("--config", "custom.json").status, 0);
      writeFileSync(join(f.dir, "src/a.html"), "<select>");
      assert.equal(f.run("--config", "custom.json").status, 1);
    } finally { f.close(); }
  });
  it("fails on missing configs, roots, bad JSON and unknown flags", () => {
    const f = fixture({});
    try {
      assert.equal(f.run("--config", "missing.json").status, 1);
      assert.equal(f.run("--unknown").status, 1);
      writeFileSync(join(f.dir, "agcs-toggles.json"), "{"); assert.equal(f.run().status, 1);
      writeFileSync(join(f.dir, "agcs-toggles.json"), '{"roots":["missing"]}'); assert.equal(f.run().status, 1);
    } finally { f.close(); }
  });
});
