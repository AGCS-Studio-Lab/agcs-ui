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
