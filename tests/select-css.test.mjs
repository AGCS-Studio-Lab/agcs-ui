// Reglas duras del campo, la lista y el chevron compartido.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
const css = readFileSync(new URL("../ui/select.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
function block(selector) {
  const start = css.indexOf(`${selector} {`);
  assert.notEqual(start, -1, selector);
  return css.slice(start, css.indexOf("}", start));
}
describe("ui/select.css", () => {
  it("keeps 44 px targets, square corners and no shadow", () => {
    assert.match(block(".agcs-select__field"), /min-height: 44px/);
    assert.match(block(".agcs-select__option,\n.agcs-select__empty"), /min-height: 44px/);
    for (const [, value] of css.matchAll(/border-radius:\s*([^;]+);/g)) assert.equal(value, "0");
    for (const [, value] of css.matchAll(/box-shadow:\s*([^;]+);/g)) assert.equal(value, "none");
  });
  it("keeps the chevron 16 px from the edge, 12 px from text and fully in ink", () => {
    assert.match(block(".agcs-select__field"), /padding: 0 16px/);
    assert.match(block(".agcs-select__field"), /gap: 12px/);
    assert.match(block(".agcs-select__chevron > .agcs-toggle__icon"), /color: var\(--ink\)/);
    assert.match(block(".agcs-select__chevron > .agcs-toggle__icon"), /opacity: 1/);
  });
  it("rotates 180 degrees in 160ms with reduced motion support", () => {
    assert.match(css, /transform: rotate\(180deg\)/);
    assert.match(css, /transition: transform 160ms cubic-bezier\(0\.2, 0, 0, 1\)/);
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*transition: none/);
  });
  it("uses roles for focus, invalid, placeholder and the selected stripe", () => {
    const focus = block(".agcs-select__field:has(.agcs-select__input:focus-visible)");
    assert.match(focus, /outline: 2px solid var\(--ink\)/);
    assert.match(focus, /outline-offset: 2px/);
    assert.match(block(".agcs-select__input:focus-visible"), /outline: none/);
    assert.match(css, /border: 1px solid var\(--rule\)/);
    assert.match(block('.agcs-select__field:has([aria-invalid="true"])'), /border-color: var\(--text-error\)/);
    assert.doesNotMatch(focus, /border-color:/);
    assert.match(block(".agcs-select__input::placeholder"), /color: var\(--ink-3\)/);
    assert.match(block('.agcs-select__option[aria-selected="true"]::before'), /width: 4px/);
    assert.doesNotMatch(css, /#[\da-f]{3,8}\b|rgba?\(|--agcs-|--highlight/i);
  });
  it("resets the popover, clips scrolling content and supplies an absolute fallback", () => {
    assert.match(block(".agcs-select__panel"), /position: absolute/);
    assert.match(block(".agcs-select__panel"), /z-index: 50/);
    assert.match(block(".agcs-select__panel"), /overflow-y: auto/);
    assert.match(block(".agcs-select__panel[popover]"), /inset: auto/);
    assert.match(block(".agcs-select__panel"), /padding: 4px 0/);
    assert.match(block(".agcs-select__panel"), /border: 1px solid var\(--ink\)/);
  });
});
