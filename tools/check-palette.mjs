#!/usr/bin/env node
/**
 * Revisa la paleta de AGCS UI con las pruebas de la skill dataviz y de WCAG.
 * Uso: node tools/check-palette.mjs
 * Sale con codigo 1 si algo falla. Correrlo antes de cambiar cualquier color.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { BRAND, GRAYS, BLUE, STATES, SERIES, SURFACES, RESERVED, GRID } from "../src/palette.js";
import { alignedBars } from "../src/grid-chart.js";
import { deltaE, deltaECvd, contrast, apca, oklch } from "../src/color-math.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let failures = 0;
const line = (state, name, detail) => {
  if (state === "FALLA") failures++;
  console.log(`  [${state.padEnd(5)}] ${name.padEnd(52)} ${detail}`);
};
const pass = (ok, name, detail, soft = false) => line(ok ? "PASA" : soft ? "AVISO" : "FALLA", name, detail);

/* 1. colors.css y palette.js dicen lo mismo */
console.log("\nArchivos");
const css = readFileSync(join(root, "tokens/colors.css"), "utf8");
const cssHex = Object.fromEntries([...css.matchAll(/--(agcs-[a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})/g)].map((m) => [m[1], m[2].toUpperCase()]));
const expected = {
  "agcs-obsidian": BRAND.obsidian, "agcs-paper": BRAND.paper, "agcs-lime": BRAND.lime, "agcs-carbon": BRAND.carbon,
  "agcs-mist": BRAND.mist, "agcs-data": BRAND.data, "agcs-risk": BRAND.risk,
  "agcs-amber": STATES.amber, "agcs-red-fill": STATES.redFill, "agcs-red-text": STATES.redText, "agcs-blue-text": STATES.blueText,
  ...Object.fromEntries(Object.entries(GRAYS).map(([k, v]) => [`agcs-gray-${k}`, v])),
  ...Object.fromEntries(Object.entries(BLUE).map(([k, v]) => [`agcs-blue-${k}`, v])),
  ...Object.fromEntries(SERIES.agcs.light.map((v, i) => [`agcs-series-${i + 1}-light`, v])),
  ...Object.fromEntries(SERIES.agcs.dark.map((v, i) => [`agcs-series-${i + 1}-dark`, v])),
  "agcs-series-other-light": SERIES.other.light, "agcs-series-other-dark": SERIES.other.dark,
};
const drift = Object.entries(expected).filter(([k, v]) => cssHex[k] !== v.toUpperCase());
pass(!drift.length, "tokens/colors.css coincide con src/palette.js", drift.length ? JSON.stringify(drift) : `${Object.keys(expected).length} valores`);

/* 2. Series: pares vecinos (lineas, barras) y los tres primeros entre todos (puntos, mapas) */
const BAND = { light: [0.43, 0.77], dark: [0.48, 0.67] };
function checkTheme(label, theme, { band = true } = {}) {
  console.log(`\nSeries · ${label}`);
  for (const mode of ["light", "dark"]) {
    const pal = SERIES[theme][mode], surface = SURFACES[mode];
    const m = mode === "light" ? "claro" : "oscuro";
    const off = pal.filter((c) => { const L = oklch(c)[0]; return L < BAND[mode][0] || L > BAND[mode][1]; });
    if (band) pass(!off.length, `rango de luz (${m})`, off.length ? off.join(" ") : "todos dentro");
    else line(off.length ? "AVISO" : "PASA", `rango de luz (${m})`, off.length ? `fuera a proposito para ganar contraste: ${off.length}` : "todos dentro");
    const lowC = pal.filter((c) => oklch(c)[1] < 0.1);
    pass(!lowC.length, `color suficiente, no se ven grises (${m})`, lowC.length ? lowC.join(" ") : "todos >= 0.10");
    let nv = 99, cv = 99;
    for (let i = 0; i < pal.length - 1; i++) { nv = Math.min(nv, deltaE(pal[i], pal[i + 1])); cv = Math.min(cv, deltaECvd(pal[i], pal[i + 1])); }
    pass(nv >= 15, `vecinos se distinguen, vision normal (${m})`, `${nv.toFixed(1)} (minimo 15)`);
    pass(cv >= 8, `vecinos se distinguen con daltonismo (${m})`, `${cv.toFixed(1)} (minimo 8)`);
    let nv3 = 99, cv3 = 99;
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) { nv3 = Math.min(nv3, deltaE(pal[i], pal[j])); cv3 = Math.min(cv3, deltaECvd(pal[i], pal[j])); }
    pass(nv3 >= 15 && cv3 >= 8, `los tres primeros entre todos (${m})`, `${nv3.toFixed(1)} y ${cv3.toFixed(1)}`);
    const low = pal.filter((c) => contrast(c, surface) < 3);
    pass(!low.length, `se ven sobre el fondo, 3:1 (${m})`, low.length ? `bajo 3:1, llevan valor escrito: ${low.join(" ")}` : "todos >= 3:1", true);
    const near = [];
    for (const c of pal) for (const r of RESERVED) if (deltaE(c, r) < 15) near.push(`${c}~${r}`);
    pass(!near.length, `lejos de lime, ambar y rojos (${m})`, near.length ? near.join(" ") : "todos a 15 o mas");
  }
}
checkTheme("tema AGCS", "agcs");
checkTheme("tema Alto contraste (guardado)", "highContrast", { band: false });

/* 3. Texto y estados */
console.log("\nTexto y estados");
const text = [
  ["tinta sobre blanco", BRAND.carbon, BRAND.paper, 4.5],
  ["tinta 2 sobre blanco", GRAYS[700], BRAND.paper, 4.5],
  ["tinta 3 sobre blanco", GRAYS[600], BRAND.paper, 4.5],
  ["tinta 2 sobre negro", GRAYS[300], BRAND.obsidian, 4.5],
  ["tinta 3 sobre negro", GRAYS[500], BRAND.obsidian, 4.5],
  ["error sobre blanco", STATES.redText, BRAND.paper, 4.5],
  ["error sobre negro", BRAND.risk, BRAND.obsidian, 4.5],
  ["enlace sobre blanco", STATES.blueText, BRAND.paper, 4.5],
  ["enlace sobre negro", BRAND.data, BRAND.obsidian, 4.5],
  ["texto negro sobre ambar", BRAND.obsidian, STATES.amber, 4.5],
  ["texto blanco sobre rojo de fondo", BRAND.paper, STATES.redFill, 4.5],
  ["texto negro sobre lime", BRAND.obsidian, BRAND.lime, 4.5],
  ["borde de campo sobre blanco", GRAYS[600], BRAND.paper, 3],
  ["borde de campo sobre negro", GRAYS[500], BRAND.obsidian, 3],
];
for (const [n, fg, bg, min] of text) pass(contrast(fg, bg) >= min, n, `${contrast(fg, bg).toFixed(2)}:1 (minimo ${min})`);
const lc = apca(BRAND.paper, STATES.redFill);
pass(lc >= 60, "texto blanco sobre rojo de fondo, APCA", `${lc.toFixed(1)} (minimo 60)`);
const la = deltaE(BRAND.lime, STATES.amber), lac = deltaECvd(BRAND.lime, STATES.amber);
pass(la >= 15 && lac >= 8, "lime y ambar se distinguen", `${la.toFixed(1)} normal · ${lac.toFixed(1)} daltonismo`);

/* 4. Grid */
console.log("\nGrid");
const gcss = readFileSync(join(root, "tokens/grid.css"), "utf8");
pass(gcss.includes(`--grid-step: ${GRID.step}px`) && gcss.includes("rgba(0, 0, 0, 0.06)") && gcss.includes("rgba(255, 255, 255, 0.08)"),
  "tokens/grid.css coincide con src/palette.js", `${GRID.step}px · 6% · 8%`);
pass(GRID.step % 8 === 0, "el paso es multiplo de 8", `${GRID.step}px`);
for (const mode of ["light", "dark"]) {
  const { rgb, alpha } = GRID.line[mode], bg = mode === "light" ? 255 : 0;
  const v = rgb.map((c) => Math.round(bg * (1 - alpha) + c * alpha));
  const hex = "#" + v.map((c) => c.toString(16).padStart(2, "0")).join("").toUpperCase();
  const cr = contrast(hex, SURFACES[mode]);
  // Max pidio el grid mas claro (2026-09-25): queda mas suave que la linea de escala
  // de dataviz (1.24 a 1.29). El piso es 1.10, la linea mas suave que se sigue viendo.
  pass(cr >= 1.10 && cr <= 1.35, `se ve, sin competir (${mode === "light" ? "claro" : "oscuro"})`, `${hex} · ${cr.toFixed(2)}:1 (piso 1.10; dataviz pide 1.24 a 1.29)`);
}
const g = alignedBars([5, 6, 9, 3, 1, 2]);
const snapped = g.width % g.step === 0 && g.height % g.step === 0 && (g.baseline + 1) % g.step === 0 && g.bars.every((b) => (b.x + 1) % g.step === 0 && b.width % g.step === 0);
pass(snapped, "grafico alineado: todo en pasos enteros", `${g.width}x${g.height}px · 1 linea = ${g.unit}`);
const money = alignedBars([4.4, 7.25]);
pass(money.bars[0].height === (4.4 / money.unit) * money.step, "grafico alineado: el dato no se redondea", `4.4 -> ${money.bars[0].height.toFixed(1)}px`);

console.log(failures ? `\n${failures} prueba(s) fallan. No cambies la paleta hasta que pasen.\n` : "\nTodo pasa.\n");
process.exit(failures ? 1 : 0);
