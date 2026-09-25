/**
 * AGCS UI -- la paleta en JavaScript   v0.1 (2026-09-24)
 *
 * Los mismos valores que tokens/colors.css, para graficos y para la
 * personalizacion de colores. `node tools/check-palette.mjs` revisa que
 * los dos archivos digan lo mismo.
 */

export const BRAND = {
  obsidian: "#000000",
  paper: "#FFFFFF",
  lime: "#C8FF29",
  carbon: "#1A1A1A",
  mist: "#E5E5E5",
  data: "#00A1F1",
  risk: "#ED1C24",
};

export const GRAYS = {
  50: "#FAFAFA", 100: "#F2F2F2", 200: "#E5E5E5", 300: "#D1D1D1", 400: "#B4B4B4",
  500: "#9A9A9A", 600: "#6B6B6B", 700: "#505050", 800: "#353535", 900: "#1A1A1A",
};

export const BLUE = {
  100: "#E1F1FE", 200: "#BAE0FF", 300: "#89CCFF", 400: "#4FB7FE", 500: "#00A1F1",
  600: "#0382C3", 700: "#05699F", 800: "#02527E", 900: "#003C5D",
};

/** Decisiones del 2026-09-24. */
export const STATES = {
  amber: "#FFB800",    // "En riesgo", solo en apps; texto negro encima
  redFill: "#E31A22",  // "Guardrail cruzado" y alertas; texto blanco encima
  redText: "#8E1116",  // texto de error sobre blanco
  blueText: "#05699F", // enlaces y mensajes del sistema sobre blanco
};

export const SURFACES = { light: BRAND.paper, dark: BRAND.obsidian };

/** Colores reservados: nunca aparecen en el selector de series. */
export const RESERVED = [BRAND.lime, STATES.amber, STATES.redFill, STATES.redText, BRAND.risk];

export const SERIES = {
  names: ["Azul datos", "Oliva", "Violeta", "Verde agua", "Ocre", "Rosa", "Azul marino"],
  agcs: {
    light: ["#00A1F1", "#8B9D1E", "#4F39EC", "#04A99B", "#805C03", "#CE84A7", "#4369A2"],
    dark: ["#0495DE", "#859712", "#5341F3", "#07A295", "#B38309", "#BD7598", "#32669A"],
  },
  /** Validado, guardado: no se ofrece a los usuarios por ahora (decision del 2026-09-24). */
  highContrast: {
    light: ["#088BD0", "#637103", "#3F33B9", "#0A978B", "#7D5A03", "#B0698B", "#2D5289"],
    dark: ["#56BBFF", "#9EAE56", "#6767FE", "#59D5C7", "#C08F22", "#AD6689", "#80B6EF"],
  },
  other: { light: "#9A9A9A", dark: "#6B6B6B" },
};
