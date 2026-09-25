/**
 * AGCS UI -- colores de series y personalizacion   v0.1 (2026-09-24)
 *
 * Reglas (docs/color.md):
 * - Siete colores en orden fijo. Lo que pase de siete va en "Otros", gris.
 * - El usuario solo personaliza el color de paises y areas, y solo con
 *   estos siete. Lime, ambar y rojo no se ofrecen: ya significan otra cosa.
 * - El color sigue a la entidad: Mexico tiene su color en todos los graficos,
 *   aunque un filtro cambie cuantas series se ven.
 * - El tema es fijo en AGCS. Alto contraste esta validado pero no se ofrece.
 */
import { SERIES } from "./palette.js";
import { deltaE, deltaECvd } from "./color-math.js";

/** Los unicos tipos de entidad cuyo color puede cambiar el usuario. */
export const CUSTOMIZABLE_KINDS = ["country", "area"];

export const SLOT_COUNT = SERIES.names.length;
export const OTHER = "other";

/** Color de un lugar de la paleta (0-6, u "other") en el modo dado. */
export function seriesColor(slot, mode = "light", theme = "agcs") {
  if (slot === OTHER) return SERIES.other[mode];
  return SERIES[theme][mode][slot];
}

/**
 * Asignacion de fabrica: los primeros siete en orden, el resto a "Otros".
 * `saved` es lo que el usuario eligio antes ({ id: slot }) y siempre gana.
 */
export function assignColors(entities, saved = {}) {
  const used = new Set(Object.values(saved));
  let next = 0;
  const out = {};
  for (const e of entities) {
    if (e.id in saved) { out[e.id] = saved[e.id]; continue; }
    while (next < SLOT_COUNT && used.has(next)) next++;
    out[e.id] = next < SLOT_COUNT ? next++ : OTHER;
  }
  return out;
}

/** Solo paises y areas aceptan un color elegido por el usuario. */
export function canCustomize(entity) {
  return CUSTOMIZABLE_KINDS.includes(entity.kind);
}

/**
 * Revisa una eleccion antes de guardarla. `slots` va en el orden en que se
 * dibujan las series. Para lineas, barras y apilados se revisan los pares
 * vecinos, como pide la skill dataviz; para puntos y mapas, todos los pares.
 * Devuelve la lista de problemas; vacia significa que se puede guardar.
 */
export function checkChoice(slots, { mode = "light", pairs = "neighbors", theme = "agcs" } = {}) {
  const problems = [];
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      if (slots[i] === slots[j] && slots[i] !== OTHER) { problems.push({ i, j, kind: "same" }); continue; }
      if (pairs === "neighbors" && j !== i + 1) continue;
      const a = seriesColor(slots[i], mode, theme), b = seriesColor(slots[j], mode, theme);
      const normal = deltaE(a, b), cvd = deltaECvd(a, b);
      if (normal < 15) problems.push({ i, j, kind: "similar", value: +normal.toFixed(1), min: 15 });
      else if (cvd < 8) problems.push({ i, j, kind: "cvd", value: +cvd.toFixed(1), min: 8 });
    }
  }
  return problems;
}
