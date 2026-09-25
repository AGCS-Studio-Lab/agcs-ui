---
name: agcs-ui
description: Use this skill to build product app UI for AGCS | Studio + Lab (agcs-management-system, agcs-dris-system and later apps) -- dashboards, tables, forms, empty states and charts. Contains the app color system, the grid rules for screens, the UX rules and the vendored brand primitives. For decks, handbooks and documents use the AGCS brand design system (agcs-design-system) instead.
user-invocable: true
---

Read `README.md`, then `docs/color.md`, `docs/grid.md` and `ux-rules.md`. This system is for screens. The brand lives in `agcs-design-system` (Claude Design: "AGCS · Decks y documentos") and still governs voice, the mark, the icon library and the fonts; this one adds what an app needs and a deck does not.

**Before writing any copy**, read `writing.md` in agcs-design-system: it is the single voice standard for everything AGCS ships, apps included.

**Before changing any color or grid value**, run `node tools/check-palette.mjs`. If it fails, the change does not go in.

## Hard rules (do not violate)

1. **Colors come from `tokens/colors.css` roles**, never raw hex in components: `--surface`, `--ink`, `--ink-2`, `--ink-3`, `--rule`, `--highlight`, `--state-*`, `--text-*`, `--series-*`. Grays are the ten `gray-*` steps; Tailwind's slate, zinc, neutral and stone are out.
2. **Lime: one per group, three per screen at most.** A group reads on its own: the menu, a chart, a table. The content's lime is the main focus; the menu's active item and the current selection are secondary. Every screen has at least one. **Every lime carries a black mark** (edge or stripe): on white the lime is 1.2:1 and disappears in grayscale, print and tritanopia. The primary button is black.
3. **States are label-driven.** On-track: no color, ink outline. En riesgo: amber `#FFB800` with black text. Guardrail cruzado: red fill `#E31A22` with **white** text (4.7:1, APCA 76). Amber replaces the brand's `#FFFF00` in apps only, because the yellow and the lime look alike.
4. **Colored text is only for errors, links and system messages.** On white: red `#8E1116`, blue `#05699F` (links always underlined). On black: the brand red `#ED1C24` and blue `#00A1F1`. Everything else is ink.
5. **Charts default to emphasis:** everything gray (`--chart-rest`), one datum in lime with a black edge. To compare series (countries, areas), use the seven series colors in fixed order; past seven, "Otros" in gray. A chart of series never carries state colors. Axis from zero, no pie or donut.
6. **Users may recolor only countries and areas**, and only with the seven series colors (`src/series.js`: `CUSTOMIZABLE_KINDS`, `checkChoice()`). The color follows the entity across every chart. Lime, amber and red are never offered. The theme is fixed to AGCS; High contrast is validated and kept, not offered.
7. **The construction grid** (`.agcs-grid`, 16px, 1px) goes on four places only: module entry headers, empty states, diagram canvases, and bar charts where the grid **is** the scale (`alignedBars()` in `src/grid-chart.js`). Tables, text, forms and other charts are flat. **Data is never rounded** to land on a line.
8. **Zero radius, zero shadow.** Hierarchy from space, ground inversion and hairlines. Hover is opacity 0.7 or ground inversion.
9. **Icons:** the AGCS library for concepts; Lucide at 1.5px in ink for functional icons the library does not draw (Max, 2026-09-09). No emoji anywhere.

## Key files

- `tokens/colors.css`, `tokens/shadcn.css`, `tokens/tailwind-v4.css`, `tokens/tailwind-v3.cjs`, `tokens/grid.css`, `tokens/fonts.css`
- `src/palette.js`, `src/series.js`, `src/grid-chart.js`, `src/color-math.js`
- `tools/check-palette.mjs` -- the tests every change passes
- `docs/color.md`, `docs/grid.md`, `ux-rules.md`
- `ui/` -- brand primitives apps copy into `src/components/brand/`
- `preview/` -- the Design System cards
- `reference/paleta-dashboards.html`, `reference/grid-apps.html` -- the pages the decisions were made on
