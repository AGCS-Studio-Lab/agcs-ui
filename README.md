# AGCS · Apps

Repo `agcs-ui` · en Claude Design: **AGCS · Apps**.


La capa de interfaz de las apps de AGCS | Studio + Lab |: los tokens, las
reglas y los primitivos de marca que usan `agcs-management-system`,
`agcs-dris-system` y las apps que vengan.

La marca vive en [`agcs-design-system`](https://github.com/AGCS-Studio-Lab/agcs-design-system)
(en Claude Design: **AGCS · Decks y documentos**) y manda sobre este repo. Ese repo está hecho para decks y documentos, con
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
| `tokens/fonts.css` | Carga las caras de la marca desde `fonts/` (N27, IBM Plex Mono, Crimson Pro SemiBold Italic). Sin CDN. |
| `tokens/grid.css` | El grid de construcción para apps: 16px, 1px, clase `.agcs-grid`. |
| `src/palette.js` | La misma paleta en JavaScript, para gráficos. |
| `src/series.js` | Colores de series, asignación por entidad y revisión de lo que elige el usuario. |
| `src/grid-chart.js` | Geometría de un gráfico de barras alineado con el grid. |
| `src/color-math.js` | Distancia entre colores, simulación de daltonismo, contraste WCAG y APCA. |
| `tools/check-palette.mjs` | Prueba toda la paleta. Ningún color cambia sin pasarla. |
| `tests/` | Pruebas del menú y el disclosure con React 18 y 19, y de las reglas de `ui/disclosure.css` y `ui/link.css` (`npm test`). |
| `.github/workflows/pruebas.yml` | Corre `npm test` y `npm run check` en cada PR a `main` y en cada push a `main`. |
| `docs/color.md` | Las reglas de color y las decisiones del 24 de septiembre de 2026. |
| `docs/grid.md` | Dónde va el grid en una app y las condiciones para ponerlo detrás de un gráfico. |
| `ux-rules.md` | Reglas de UX y accesibilidad para apps. |
| `SKILL.md` | Instrucciones para agentes: reglas duras y archivos clave. |
| `preview/` | Tarjetas del panel del design system en Claude Design. |
| `fonts/` | Las cinco caras que usan las apps, copiadas de agcs-design-system. |
| `ui/` | Primitivos de marca para copiar en cada app: chevron, footer, stamp de Lab, ícono, el menú y disclosure (`disclosure.jsx` con `disclosure.css`) y los enlaces (`link.css`). |
| `reference/paleta-dashboards.html` | La página con la que se decidió la paleta: dashboard de muestra, simulación de daltonismo y pruebas. Se abre en el navegador. |
| `reference/grid-apps.html` | La página con la que se decidió el grid: los cuatro lugares, tres densidades y el gráfico alineado. |
| `reference/menu-disclosure.html` | La página con la que se decidió el menú y el disclosure: cuándo es cada uno, sus estados y el móvil. |
| `reference/links.html` | La página con la que se decidieron los enlaces en tinta: cómo eran, sus estados en claro y oscuro, el contraste y la regla del lime. |
| `docs/capturas/` | Capturas del menú y el disclosure con React 19 y 18, y de los enlaces antes del cambio (`links/antes/`). |

## Cómo se usa

En una app con Next y Tailwind v4 (management), en el CSS global:

```css
@import "tailwindcss";
@import "../agcs-ui/tokens/colors.css";
@import "../agcs-ui/tokens/shadcn.css";
@import "../agcs-ui/tokens/tailwind-v4.css";
@import "../agcs-ui/tokens/grid.css";
```

En una app con Tailwind v3 (DRIS), en `tailwind.config.js`:

```js
presets: [require("./agcs-ui/tokens/tailwind-v3.cjs")],
```

y `tokens/colors.css`, `tokens/shadcn.css` y `tokens/grid.css` en el CSS de entrada.

Por ahora cada app copia los archivos que necesita, como ya hacían con `ui/`.
Cuando haya una tercera app se revisa si conviene publicarlo como paquete.

## Menú y disclosure

`ui/disclosure.jsx` es el único toggle de las apps. Cada app lo copia con
`ui/disclosure.css`, sin editarlo, y no arma toggles propios. Es React sin
dependencias y sirve en React 18 (DRIS) y 19 (management). Los tipos van en
JSDoc: management los lee con `allowJs` y DRIS revisa el archivo con `checkJs`.
El CSS es plano y usa los roles de `tokens/colors.css`, así que no depende de
la versión de Tailwind ni de que Tailwind escanee `agcs-ui/`.

### Cuándo es cada uno

- **Menú anclado** (`Menu`). Se abre sobre la pantalla, pegado a su botón.
  Lleva solo enlaces y acciones de cuenta: el menú de cuenta y workspace del
  lateral y el menú de la barra en móvil. Nunca lleva contenido, formularios,
  ayuda ni el detalle de un registro, porque management no permite popups para
  contenido (AGENTS.md, 11 de septiembre de 2026).
- **Disclosure** (`Disclosure`). Se abre dentro de la página y empuja hacia
  abajo lo que sigue. Sirve para todo lo demás: los grupos del menú lateral,
  las secciones de una página, el detalle de un registro y los filtros. Una
  lista dentro de un menú, como «Cambiar workspace», también es un disclosure.

### Comportamiento

| | Menú | Disclosure |
|---|---|---|
| Cierra | Su botón, clic afuera, Escape, salir con Tab o elegir una opción | Solo su botón |
| Foco | Con Escape o al elegir una opción, vuelve al botón | Se queda en el botón |
| Accesibilidad | `aria-expanded` y `aria-controls` en el botón; las opciones se recorren con Tab | `aria-expanded` y `aria-controls`; el panel cerrado lleva `hidden` |

Los dos miden 44 px de alto y llevan el chevron a 16 px del borde y a 12 px del
texto. Radio 0 y sombra 0. El foco es un contorno de 2 px en tinta. El chevron
gira en 160 ms y, con `prefers-reduced-motion`, cambia sin girar. El componente
no usa lime: el lime del grupo lo pone la app.

El disclosure no se cierra con clic afuera ni con Escape: es contenido de la
página y cerrarlo solo haría perder lo que la persona leía o escribía.

### Variantes del botón

| `variant` | Qué es | Dónde |
|---|---|---|
| `row` | Ancho completo, con una línea fina abajo. Es la del disclosure. | Secciones de una página, listas dentro de un menú |
| `field` | Ancho completo, con borde. Es la del menú. | Menú de cuenta y workspace |
| `inline` | Texto y chevron, del ancho del texto | Botón «Menú» de la barra móvil |
| `icon` | Solo el chevron, 44 × 44. Necesita `aria-label`. | Grupos del lateral donde el título es un enlace |

### Cómo se usa

En el CSS global, después de los tokens:

```css
@import "../agcs-ui/ui/disclosure.css";
```

```jsx
import {
  Disclosure, DisclosureTrigger, DisclosurePanel,
  Menu, MenuTrigger, MenuPanel, MenuItem, MenuLabel, MenuSeparator,
} from "@/agcs-ui/ui/disclosure"; // en DRIS: "@agcs-ui/ui/disclosure"

// Menú de cuenta al pie del lateral: abre hacia arriba, del ancho del botón.
<Menu placement="top" align="stretch">
  <MenuTrigger>{workspaceName}</MenuTrigger>
  <MenuPanel aria-label="Cuenta">
    <Disclosure>
      <DisclosureTrigger>Cambiar workspace</DisclosureTrigger>
      <DisclosurePanel>
        {clients.map((c) => (
          <MenuItem key={c.id} aria-current={c.id === activeId ? "true" : undefined} onSelect={() => switchTo(c.id)}>
            {c.nombre}
          </MenuItem>
        ))}
      </DisclosurePanel>
    </Disclosure>
    <MenuSeparator />
    <MenuItem as={Link} href="/legal/terminos">Términos</MenuItem>
    <MenuItem onSelect={signOut}>Cerrar sesión</MenuItem>
  </MenuPanel>
</Menu>

// Menú de la barra móvil: el panel toma el ancho de la barra, que va con position: relative.
<Menu anchor="parent">
  <MenuTrigger variant="inline">Menú</MenuTrigger>
  <MenuPanel aria-label="Navegación principal móvil">
    <MenuLabel>Forward System</MenuLabel>
    <MenuItem as={Link} href="/monitor">Monitor</MenuItem>
  </MenuPanel>
</Menu>

// Sección en el flujo de la página.
<Disclosure>
  <DisclosureTrigger>Añadir persona</DisclosureTrigger>
  <DisclosurePanel>{/* campos */}</DisclosurePanel>
</Disclosure>
```

- `Menu` y `Disclosure` aceptan `open` y `onOpenChange` para controlarlos
  desde afuera, o `defaultOpen`. Para cerrar el menú al cambiar de ruta,
  contrólalo o dale a `Menu` un `key` con la ruta.
- `Menu`: `placement` es `bottom` (por defecto) o `top`; `align` es `start`,
  `end` o `stretch`; `anchor="parent"` posiciona el panel contra el elemento
  posicionado más cercano de la app.
- `MenuItem` es un botón; con `as` puede ser un enlace o el `Link` de Next o
  de react-router. Al elegirlo cierra el menú, salvo que `onSelect` llame a
  `event.preventDefault()`. Con `aria-current` lleva una franja de tinta.

### Antes de cambiarlo

```bash
npm install
npm test
```

Las pruebas corren cada caso con React 19 y con React 18, y revisan las reglas
duras en el CSS: radio 0, sombra 0, 44 px, colores por rol y movimiento
reducido.

## Enlaces

Un enlace va en tinta y siempre subrayado. En hover y con el foco usa el lime
de AGCS: en modo claro, una banda lime detrás de la línea del texto con el
texto en negro; en modo oscuro, el texto y el subrayado en lime. El foco suma
el outline de 2 px. Nunca es azul. Las reglas y el contraste están en
`docs/color.md` §4.

Cada app copia `ui/link.css` sin editarlo y lo importa en el CSS global,
después de los tokens:

```css
@import "../agcs-ui/ui/link.css";
```

La clase `agcs-link` va en el `<a>`, en el `Link` de Next o de react-router, o
en un botón que se ve como enlace. Reemplaza a `text-link underline` y a
`hover:opacity-70`: no se combina con ellos ni con utilidades de color. El
tamaño, el peso y el espaciado sí van con las utilidades de la app: `link.css`
no los toca.

```jsx
<Link href="/login" className="agcs-link">Iniciar sesión</Link>
<a className="agcs-link inline-flex min-h-11 items-center" href={url}>Abrir fuente</a>
<button type="button" className="agcs-link min-h-11" onClick={retry}>Reintentar</button>
```

- La banda pinta la línea del texto, no la caja: un enlace de 44 px de alto
  no se vuelve un bloque, y un enlace que corta línea lleva una banda por línea.
  Eso vale para un enlace en línea o `inline-flex`. En un elemento de bloque o
  `flex` la banda cruza todo su ancho: el diseño de bloque va en un contenedor
  y el enlace adentro.
- El hover solo aparece con mouse o trackpad (`hover: hover`); en pantallas
  táctiles no se queda pegado después del toque.
- El rol `--text-link` (la clase `text-link` de los presets de Tailwind) ya es
  tinta, así que un enlace que todavía no usa `agcs-link` no sale azul, pero
  tampoco tiene el hover lime.

## Antes de cambiar un color

```bash
node tools/check-palette.mjs
```

Revisa también el grid. Si algo falla, el cambio no entra.

## Estado

- **v0.1 (24 sep 2026):** color. Grises, lime uno por grupo, estados con ámbar
  y rojo de fondo, texto con color, siete series, personalización de países y
  áreas, tema Alto contraste guardado.
- **v0.2 (24 sep 2026):** grid. 16px y 1px con la transparencia de la marca,
  en la entrada de módulo, los estados vacíos, los diagramas y los gráficos de
  barras que lo usan como escala. En una app el dato no se redondea.
- **v0.4 (11 oct 2026):** menú y disclosure en `ui/disclosure.jsx`, el
  toggle común de management y DRIS (U2.1 del plan del 10 de octubre).
- **v0.5 (15 oct 2026):** enlaces en tinta con el lime en hover y foco,
  `ui/link.css` (U7.3 del plan del 15 de octubre). `--text-link` deja de ser
  azul.
- **Pendiente:** tipografía de pantalla, espaciado, el resto de los componentes
  y pantallas base.
