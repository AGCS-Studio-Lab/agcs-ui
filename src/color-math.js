/**
 * AGCS UI -- las mismas cuentas que usa la skill dataviz para validar color.
 *
 * - Distancia entre colores: distancia euclidiana en OKLab x100.
 * - Daltonismo: simulacion de Machado, Oliveira y Fernandes (2009),
 *   severidad 1.0, aplicada en RGB lineal.
 * - Contraste: WCAG 2.2 y APCA (W3 0.1.9), este ultimo para texto sobre
 *   colores saturados, donde WCAG 2.2 se equivoca.
 */

const MACHADO = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

export function hexToLinear(hex) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => toLinear(parseInt(h.slice(i, i + 2), 16) / 255));
}

function simulate(rgb, kind) {
  const M = MACHADO[kind];
  return M.map((r) => Math.max(0, Math.min(1, r[0] * rgb[0] + r[1] * rgb[1] + r[2] * rgb[2])));
}

export function oklab(rgb) {
  const l = Math.cbrt(0.4122214708 * rgb[0] + 0.5363325363 * rgb[1] + 0.0514459929 * rgb[2]);
  const m = Math.cbrt(0.2119034982 * rgb[0] + 0.6806995451 * rgb[1] + 0.1073969566 * rgb[2]);
  const s = Math.cbrt(0.0883024619 * rgb[0] + 0.2817188376 * rgb[1] + 0.6299787005 * rgb[2]);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklch(hex) {
  const [L, a, b] = oklab(hexToLinear(hex));
  return [L, Math.hypot(a, b)];
}

/** Distancia entre dos colores (OKLab x100). `kind`: undefined, "protan", "deutan" o "tritan". */
export function deltaE(a, b, kind) {
  let A = hexToLinear(a), B = hexToLinear(b);
  if (kind) { A = simulate(A, kind); B = simulate(B, kind); }
  const x = oklab(A), y = oklab(B);
  return 100 * Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

/** La peor distancia entre protanopia y deuteranopia, los dos tipos comunes. */
export const deltaECvd = (a, b) => Math.min(deltaE(a, b, "protan"), deltaE(a, b, "deutan"));

export function contrast(a, b) {
  const lum = (h) => { const [r, g, bl] = hexToLinear(h); return 0.2126 * r + 0.7152 * g + 0.0722 * bl; };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** APCA Lc (valor absoluto). 60 o mas para texto chico. */
export function apca(text, bg) {
  const Y = (h) => {
    const c = [0, 2, 4].map((i) => parseInt(h.replace("#", "").slice(i, i + 2), 16) / 255);
    let y = 0.2126729 * c[0] ** 2.4 + 0.7151522 * c[1] ** 2.4 + 0.072175 * c[2] ** 2.4;
    if (y < 0.022) y += (0.022 - y) ** 1.414;
    return y;
  };
  const yt = Y(text), yb = Y(bg);
  if (Math.abs(yb - yt) < 0.0005) return 0;
  if (yb > yt) { const s = (yb ** 0.56 - yt ** 0.57) * 1.14; return s < 0.1 ? 0 : (s - 0.027) * 100; }
  const s = (yb ** 0.65 - yt ** 0.62) * 1.14;
  return s > -0.1 ? 0 : Math.abs((s + 0.027) * 100);
}
