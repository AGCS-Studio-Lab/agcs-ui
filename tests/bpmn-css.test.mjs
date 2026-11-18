// Reglas duras del tema BPMN (agcs-ui#10): solo roles, radio 0, sin sombra,
// foco de tinta, hover con opacidad, el logo de bpmn.io visible y el lime
// fuera del CSS (lo pinta agcs-bpmn.js solo en el elemento marcado).
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const raw = readFileSync(new URL("../ui/bpmn/agcs-bpmn.css", import.meta.url), "utf8");
const css = raw.replace(/\/\*[\s\S]*?\*\//g, "");
const rules = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(([, selector, body]) => ({ selector: selector.trim(), body }));

function block(selector) {
  const rule = rules.find((item) => item.selector === selector);
  assert.ok(rule, `falta la regla ${selector}`);
  return rule.body;
}

const value = (text) => text.replace(/!important/, "").trim();

describe("ui/bpmn/agcs-bpmn.css", () => {
  it("colors only by role", () => {
    assert.doesNotMatch(css, /#[\da-f]{3,8}\b/i);
    assert.doesNotMatch(css, /rgba?\(|hsla?\(|oklch\(|color-mix\(/i);
    assert.doesNotMatch(css, /--agcs-/);
    // Toda declaracion de color usa un rol, `transparent` o `currentColor`.
    for (const [, prop, val] of css.matchAll(/(?:^|[\s;{])((?:background(?:-color)?|color|border(?:-[a-z]+)?-color|fill|stroke|outline|border(?:-bottom)?)):\s*([^;]+);/g)) {
      if (/^(0|none)$/.test(value(val))) continue;
      assert.match(val, /var\(--[a-z0-9-]+\)|transparent|currentColor/, `${prop}: ${val}`);
    }
  });

  it("keeps every radius at 0 and every shadow off", () => {
    const radii = [...css.matchAll(/(?:border-radius|--[a-z-]*radius[a-z-]*):\s*([^;]+);/g)];
    assert.ok(radii.length > 5);
    for (const [, val] of radii) assert.equal(value(val), "0");
    for (const [, val] of css.matchAll(/box-shadow:\s*([^;]+);/g)) assert.equal(value(val), "none");
    for (const [, val] of css.matchAll(/--bio-shadow[a-z-]*:\s*([^;]+);/g)) assert.equal(value(val), "transparent");
    for (const [, val] of css.matchAll(/(?:^|\s)r[xy]:\s*([^;]+);/g)) assert.equal(value(val), "0");
  });

  it("covers the palette, context pad, popup and search with radius 0 and no shadow", () => {
    const flat = rules.find((item) => /border-radius:\s*0;/.test(item.body) && /box-shadow:\s*none;/.test(item.body));
    assert.ok(flat);
    for (const selector of [".djs-palette", ".djs-context-pad .entry", ".djs-popup", ".djs-popup-body .entry", ".djs-search-container", ".djs-hover-tooltip"]) {
      assert.ok(flat.selector.includes(`.agcs-bpmn ${selector}`), selector);
    }
  });

  it("keeps the bpmn.io logo visible", () => {
    const logo = block(".agcs-bpmn .bjs-powered-by");
    assert.match(logo, /color:\s*var\(--ink-2\)/);
    assert.doesNotMatch(logo, /display|visibility|opacity|transform|clip|width|height|position|z-index|font-size/);
    // Ninguna otra regla puede tocar el logo, salvo su foco.
    for (const rule of rules.filter((item) => item.selector.includes("powered-by"))) {
      if (rule.selector === ".agcs-bpmn .bjs-powered-by") continue;
      for (const part of rule.selector.split(",").filter((item) => item.includes("powered-by"))) {
        assert.match(part.trim(), /:focus-visible$/, `regla sobre el logo: ${part}`);
      }
    }
    assert.doesNotMatch(css, /display:\s*none|visibility:\s*hidden/);
  });

  it("leaves lime out of the CSS: only the highlight marker paints it", () => {
    assert.doesNotMatch(css, /--highlight|--chart-focus|--link-hover-bg|lime/i);
  });

  it("shows focus with a solid ink outline", () => {
    const focus = rules.filter((item) => item.selector.includes(":focus-visible"));
    assert.ok(focus.length);
    for (const rule of focus) {
      assert.match(rule.body, /outline:\s*2px solid var\(--ink\)/);
      assert.match(rule.body, /outline-offset:\s*2px/);
    }
    assert.doesNotMatch(css, /outline:\s*(none|0)\b/);
  });

  it("hovers diagram elements with opacity .7 and inverts menu entries", () => {
    assert.match(block(".agcs-bpmn .djs-shape.hover > .djs-visual:not(.agcs-bpmn-pool),\n.agcs-bpmn .djs-connection.hover > .djs-visual"), /opacity:\s*0\.7/);
    const palette = block(".agcs-bpmn .djs-palette .entry:hover,\n.agcs-bpmn .djs-palette .djs-palette-toggle:hover,\n.agcs-bpmn .djs-palette .highlighted-entry");
    assert.match(palette, /background:\s*var\(--ink\)/);
    assert.match(palette, /color:\s*var\(--surface\)/);
    const pad = block(".agcs-bpmn .djs-context-pad .entry:hover");
    assert.match(pad, /background:\s*var\(--ink\)/);
    assert.match(pad, /color:\s*var\(--surface\)/);
  });

  it("writes the error label with the risk state roles", () => {
    const badge = block(".agcs-bpmn .agcs-bpmn-error");
    assert.match(badge, /background:\s*var\(--state-risk-bg\)/);
    assert.match(badge, /color:\s*var\(--state-risk-ink\)/);
  });

  it("scopes every rule under .agcs-bpmn", () => {
    for (const rule of rules) {
      for (const part of rule.selector.split(",")) assert.match(part.trim(), /^\.agcs-bpmn\b/, part);
    }
  });
});
