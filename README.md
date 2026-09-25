# AGCS UI

La capa de interfaz de las apps de AGCS | Studio + Lab |: los tokens, las
reglas y los primitivos de marca que usan `agcs-management-system`,
`agcs-dris-system` y las apps que vengan.

La marca vive en [`agcs-design-system`](https://github.com/maxgallard0/agcs-design-system)
y manda sobre este repo. Ese repo está hecho para decks y documentos, con
tokens a 4K y herramientas de export. Este agrega lo que una pantalla necesita
y un deck no: grises, estados con su texto, colores de series, personalización
y reglas de UX. Donde algo de aquí choque con la marca, se corrige aquí.

## Qué hay

| Ruta | Qué es |
|---|---|
| `tokens/colors.css` | Los colores: primitivos `--agcs-*` y roles (`--surface`, `--ink`, `--state-*`, `--series-*`) para modo claro y oscuro. |
| `tokens/shadcn.css` | Lleva los roles de shadcn/ui a los de AGCS. Radio 0, botón principal en negro. |
| `tokens/tailwind-v4.css` | `@theme` para Tailwind v4 (management). |
| `tokens/tailwind-v3.cjs` | Preset para Tailwind v3 (DRIS). |
| `src/palette.js` | La misma paleta en JavaScript, para gráficos. |
| `src/series.js` | Colores de series, asignación por entidad y revisión de lo que elige el usuario. |
| `src/color-math.js` | Distancia entre colores, simulación de daltonismo, contraste WCAG y APCA. |
| `tools/check-palette.mjs` | Prueba toda la paleta. Ningún color cambia sin pasarla. |
| `docs/color.md` | Las reglas de color y las decisiones del 24 de septiembre de 2026. |
| `ux-rules.md` | Reglas de UX y accesibilidad para apps. |
| `ui/` | Primitivos de marca para copiar en cada app: chevron, footer, stamp de Lab, ícono. |
| `reference/paleta-dashboards.html` | La página con la que se decidió la paleta: dashboard de muestra, simulación de daltonismo y pruebas. Se abre en el navegador. |

## Cómo se usa

En una app con Next y Tailwind v4 (management), en el CSS global:

```css
@import "tailwindcss";
@import "../agcs-ui/tokens/colors.css";
@import "../agcs-ui/tokens/shadcn.css";
@import "../agcs-ui/tokens/tailwind-v4.css";
```

En una app con Tailwind v3 (DRIS), en `tailwind.config.js`:

```js
presets: [require("./agcs-ui/tokens/tailwind-v3.cjs")],
```

y `tokens/colors.css` y `tokens/shadcn.css` en el CSS de entrada.

Por ahora cada app copia los archivos que necesita, como ya hacían con `ui/`.
Cuando haya una tercera app se revisa si conviene publicarlo como paquete.

## Antes de cambiar un color

```bash
node tools/check-palette.mjs
```

Si algo falla, el color no entra.

## Estado

- **v0.1 (24 sep 2026):** color. Grises, lime uno por grupo, estados con ámbar
  y rojo de fondo, texto con color, siete series, personalización de países y
  áreas, tema Alto contraste guardado.
- **Pendiente:** fondos (dónde va el grid de construcción en una app),
  tipografía de pantalla, espaciado, componentes y pantallas base.
