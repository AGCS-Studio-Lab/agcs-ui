// Reglas de los enlaces (D14, 15.10.2026): en tinta y subrayados, nunca
// azules; en hover y foco, el lime. Revisa ui/link.css y sus roles en
// tokens/colors.css.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const strip = (text) => text.replace(/\/\*[\s\S]*?\*\//g, "");
const css = strip(readFileSync(new URL("../ui/link.css", import.meta.url), "utf8"));
const colors = strip(readFileSync(new URL("../tokens/colors.css", import.meta.url), "utf8"));

function block(source, selector) {
  const at = source.indexOf(`${selector} {`);
  assert.notEqual(at, -1, `falta la regla ${selector}`);
  return source.slice(at, source.indexOf("}", at));
}

// Los roles de modo claro van en el :root que define --surface; los de
// modo oscuro, en el bloque de .dark y [data-mode="dark"].
const blocks = [...colors.matchAll(/([^{}]+)\{([^}]*)\}/g)].map(([, selector, body]) => [selector.trim(), body]);
const light = blocks.find(([selector, body]) => selector === ":root" && body.includes("--surface:"))[1];
const dark = blocks.find(([selector]) => selector.includes('[data-mode="dark"]'))[1];

function role(mode, name) {
  const match = (mode === "light" ? light : dark).match(new RegExp(`--${name}:\\s*([^;]+);`));
  assert.ok(match, `falta --${name} en modo ${mode}`);
  return match[1].trim();
}

describe("roles de enlace en tokens/colors.css", () => {
  it("puts links in ink, never blue", () => {
    assert.equal(role("light", "text-link"), "var(--agcs-carbon)");
    assert.equal(role("dark", "text-link"), "var(--agcs-paper)");
    for (const [, value] of colors.matchAll(/--text-link:\s*([^;]+);/g)) {
      assert.doesNotMatch(value, /blue|data|#/, `--text-link no puede ser azul: ${value}`);
    }
  });

  it("uses a lime band with ink text on light", () => {
    assert.equal(role("light", "link-hover-bg"), "var(--agcs-lime)");
    assert.equal(role("light", "link-hover-ink"), "var(--agcs-obsidian)");
  });

  it("turns the text lime on dark, without a band", () => {
    assert.equal(role("dark", "link-hover-bg"), "transparent");
    assert.equal(role("dark", "link-hover-ink"), "var(--agcs-lime)");
  });
});

describe("ui/link.css", () => {
  it("colors only by role", () => {
    assert.doesNotMatch(css, /#[0-9a-f]{3,8}\b/i);
    assert.doesNotMatch(css, /rgb|hsl|oklch/i);
  });

  it("keeps the underline at rest", () => {
    assert.match(block(css, ".agcs-link"), /color:\s*var\(--text-link\)/);
    assert.match(block(css, ".agcs-link"), /text-decoration-line:\s*underline/);
    assert.doesNotMatch(css, /text-decoration(-line)?:\s*none/);
  });

  it("hides the band at rest and shows it on hover and focus", () => {
    assert.match(block(css, ".agcs-link"), /background-size:\s*0 1lh/);
    for (const selector of [".agcs-link:hover", ".agcs-link:focus-visible"]) {
      assert.match(block(css, selector), /background-size:\s*100% 1lh/);
      assert.match(block(css, selector), /color:\s*var\(--link-hover-ink\)/);
    }
  });

  it("only hovers with a fine pointer", () => {
    const media = css.indexOf("@media (hover: hover) and (pointer: fine)");
    assert.notEqual(media, -1);
    assert.ok(css.indexOf(".agcs-link:hover") > media);
  });

  it("shows focus with a solid ink outline", () => {
    assert.match(block(css, ".agcs-link:focus-visible"), /outline:\s*2px solid var\(--ink\)/);
    assert.match(block(css, ".agcs-link:focus-visible"), /outline-offset:\s*2px/);
  });

  it("leaves typography and spacing to the app", () => {
    // Una regla de tipografia o de padding aqui gana sobre las utilidades de
    // Tailwind de las apps (en v4 por capas, en v3 por especificidad).
    assert.doesNotMatch(css, /(^|[\s{;])(font|font-size|font-weight|font-family|line-height|padding|margin|text-align)\s*:/m);
  });

  it("never rounds, shadows or fades on hover", () => {
    assert.doesNotMatch(css, /border-radius|box-shadow|transition/);
    assert.doesNotMatch(block(css, ".agcs-link:hover"), /opacity/);
  });
});
