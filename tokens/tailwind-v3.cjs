/**
 * AGCS UI -- preset para Tailwind v3   v0.1 (2026-09-24)
 *
 * Para agcs-dris-system (Vite + Tailwind v3). En tailwind.config.js:
 *   presets: [require("./agcs-ui/tokens/tailwind-v3.cjs")]
 * y cargar tokens/colors.css en el CSS de entrada.
 *
 * Los colores apuntan a los roles de tokens/colors.css, asi que cambian
 * solos entre modo claro y oscuro. Reemplaza los grises de Tailwind.
 */
const v = (name) => `var(--${name})`;

const scale = (prefix, steps) =>
  Object.fromEntries(steps.map((s) => [s, v(`${prefix}-${s}`)]));

module.exports = {
  theme: {
    extend: {
      colors: {
        obsidian: v("agcs-obsidian"),
        paper: v("agcs-paper"),
        lime: v("agcs-lime"),
        carbon: v("agcs-carbon"),
        mist: v("agcs-mist"),
        gray: scale("agcs-gray", [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
        data: { DEFAULT: v("agcs-data"), ...scale("agcs-blue", [100, 200, 300, 400, 500, 600, 700, 800, 900]) },

        surface: { DEFAULT: v("surface"), 2: v("surface-2") },
        ink: { DEFAULT: v("ink"), 2: v("ink-2"), 3: v("ink-3") },
        rule: v("rule"),
        highlight: { DEFAULT: v("highlight"), edge: v("highlight-edge") },

        warn: { DEFAULT: v("state-warn-bg"), ink: v("state-warn-ink") },
        risk: { DEFAULT: v("state-risk-bg"), ink: v("state-risk-ink") },
        "chart-risk": v("chart-risk"),

        error: v("text-error"),
        link: v("text-link"),
        info: v("text-info"),

        series: {
          1: v("series-1"), 2: v("series-2"), 3: v("series-3"), 4: v("series-4"),
          5: v("series-5"), 6: v("series-6"), 7: v("series-7"), other: v("series-other"),
        },
      },
      borderRadius: { none: "0", DEFAULT: "0" },
    },
  },
};
