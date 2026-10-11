// Reglas duras de la marca en ui/disclosure.css: radio 0, sombra 0, 44 px,
// colores solo por rol y movimiento reducido.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const css = readFileSync(new URL("../ui/disclosure.css", import.meta.url), "utf8");
const code = css.replace(/\/\*[\s\S]*?\*\//g, "");

function block(selector) {
  const at = code.indexOf(`${selector} {`);
  assert.notEqual(at, -1, `falta la regla ${selector}`);
  return code.slice(at, code.indexOf("}", at));
}

describe("ui/disclosure.css", () => {
  it("never rounds a corner", () => {
    for (const [, value] of code.matchAll(/border-radius:\s*([^;]+);/g)) assert.equal(value.trim(), "0");
  });

  it("never casts a shadow", () => {
    for (const [, value] of code.matchAll(/box-shadow:\s*([^;]+);/g)) assert.equal(value.trim(), "none");
  });

  it("gives buttons and items a 44 px touch target", () => {
    assert.match(block(".agcs-toggle"), /min-height:\s*44px/);
    assert.match(block(".agcs-menu__item"), /min-height:\s*44px/);
    assert.match(block('.agcs-toggle[data-variant="icon"]'), /width:\s*44px/);
  });

  it("keeps the chevron off the edge", () => {
    assert.match(block(".agcs-toggle"), /padding:\s*0 16px/);
    assert.match(block(".agcs-toggle"), /gap:\s*12px/);
  });

  it("shows focus with a solid ink outline", () => {
    assert.match(block(".agcs-toggle:focus-visible"), /outline:\s*2px solid var\(--ink\)/);
    assert.match(block(".agcs-menu__item:focus-visible"), /outline:\s*2px solid var\(--ink\)/);
  });

  it("uses color roles, never raw colors", () => {
    assert.doesNotMatch(code, /#[0-9a-f]{3,8}\b/i);
    assert.doesNotMatch(code, /rgba?\(/i);
    assert.doesNotMatch(code, /--agcs-/);
  });

  it("turns the chevron from the button's own aria-expanded, wherever the button sits", () => {
    assert.match(block('.agcs-toggle[aria-expanded="true"] > .agcs-toggle__icon'), /transform:\s*rotate\(180deg\)/);
    assert.doesNotMatch(code, /\[data-state="open"\]\s*>\s*\.agcs-toggle/);
  });

  it("lines a row's text up with the menu items: no side borders on a row", () => {
    assert.match(block(".agcs-toggle"), /border:\s*0;/);
    assert.match(block('.agcs-toggle[data-variant="row"]'), /border-bottom:\s*1px solid var\(--rule\)/);
  });

  it("stops the chevron turning under prefers-reduced-motion", () => {
    const at = code.indexOf("@media (prefers-reduced-motion: reduce)");
    assert.notEqual(at, -1);
    assert.match(code.slice(at), /transition:\s*none/);
  });
});
