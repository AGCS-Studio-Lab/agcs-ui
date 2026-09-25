# UX & Accesibilidad — capa de producto AGCS (v4)

Reglas de UX para construir **cualquier app de producto AGCS** (management
system, DRIs platform, futuras). **Subordinadas a las reglas duras de marca**
(`agcs-design-system`: `SKILL.md` / `colors_and_type.css`): donde una regla UX
genérica choque con la marca, **manda la marca**. Este doc ya tiene esas
adaptaciones hechas. El color de las apps está en `docs/color.md` (v0.1,
2026-09-24) y manda sobre lo que este doc diga de color.

Movido de `agcs-design-system/ux-rules.md` a este repo el 2026-09-24. La v4
actualiza el lime (uno por grupo), los estados (ámbar y rojo de fondo) y el
color en gráficos.

Origen: `agcs-management-system/docs/ux-rules.md` (destilado de Nielsen,
Norman, Krug, Few, Tufte, Knaflic, Dreyfuss, Rams + Google UX Certificate +
designparser), generalizado y reconciliado con la **paleta funcional v3**
(2026-07-20): data `#00A1F1` · warn `#FFFF00` · risk `#ED1C24`, siempre
role-bound y con label.

---

## 1. Accesibilidad — no-negociable

- **Contraste WCAG AA**: ≥ **4.5:1** texto normal, ≥ **3:1** texto grande y componentes/bordes.
  - ⚠️ **Lime (`#C8FF29`) sobre fondo claro = 1.2:1 — prohibido para texto o datos finos.** Lime solo como **relleno** con texto oscuro (Obsidian/ink) encima, o como marca de 1 dato, siempre con borde o franja negra.
  - ⚠️ Lo mismo aplica al **ámbar `#FFB800`** (1.7:1 sobre blanco): nunca texto ámbar sobre claro; solo relleno con texto negro.
  - Muted (`gray-600` #6B6B6B sobre claro = 5.3:1) ok para secundario; no para texto crítico chico sobre superficies grises.
  - Texto sobre colores saturados: además de WCAG 2.2, medir con APCA. Sobre el rojo, WCAG prefería texto negro y el ojo lee mejor el blanco (ver `docs/color.md` §3).
- **Nunca solo el color** comunica estado → estados **label-driven** siempre (el label carga el significado; el color funcional lo refuerza).
- **Touch/click targets** ≥ **44×44px** (mín. 24px), separación ≥ 8px. El área clickeable puede exceder el glifo visible vía padding.
- **Foco visible**: outline sólido 1-2px (tinta sobre claro / mist sobre oscuro), nunca removido, nunca glow.
- **Teclado**: todo lo accionable navegable y operable por teclado; orden de tabulación lógico.
- **Alt text** en imágenes/íconos informativos; decorativos con alt vacío. El chevron `>>` y glifos decorativos: `aria-hidden`.
- **Movimiento**: respeta `prefers-reduced-motion`. Motion sharp, exit-fast, **sin bounce** (`cubic-bezier(0.2,0,0,1)`, 160-300ms). Nada que parpadee >3×/seg.

## 2. Jerarquía sin elevación (radius 0 · shadow 0)

La marca prohíbe sombra y radio: la jerarquía se construye **solo con espacio, color y tipografía** — nunca con elevación. La regla vive en la capa base (`!important`) **y** en el markup de los componentes: no dejes `rounded-*`/`shadow-*` muertos.

- **Un lime por grupo, máximo tres por pantalla** (menú / dato del contenido / selección). El dato del contenido es el foco principal. Es un mínimo antes que un máximo: **una pantalla sin lime es un defecto**, igual que dos lime en el mismo grupo. Cada lime lleva una marca negra (borde o franja). El botón principal va en negro. Detalle en `docs/color.md` §2.
- **Separación por espacio y hairline** (border 1px Mist o gris del sistema), no por cards con sombra. Agrupa por proximidad; grid de 8pt.
- **3 niveles de texto** por peso y color, no por tamaño solo. Diseña legible en gris primero.
- **Tipografía v5:** título N27 (`.agcs-display` / `font-title`) · subtítulo **Crimson Pro SemiBold Italic** (`.agcs-subtitle` / `font-subtitle`; v3 lo tenía en IBM Plex Sans, retirado el 2026-09-02) · texto IBM Plex Mono (`font-body`, ~14-16px). Mono-dominante.
- **Header de página (patrón fijo):** eyebrow mono `<Chevron /> SECCIÓN · contexto` (`.agcs-label`) + título display.

## 3. Dashboards / dataviz (Recharts)

- **Lo esencial primero**; ≤ **4-5 KPIs** por vista, el detalle a drill-down.
- **Ningún número solo**: agrega comparación (meta / período previo / delta) + estado label-driven.
- **El gráfico correcto**: barras para comparar (**eje SIEMPRE desde cero**), líneas para tendencia, tabla cuando importa el valor exacto. **Sin pie/donut** — barras horizontales ordenadas.
- **Maximiza data-ink** (Tufte): sin 3D, gridlines hairline si acaso, sin relleno decorativo. Redondea y abrevia ($3.8M).
- **Color en gráficos**: por defecto todo en gris y **lime para UN dato**. Para comparar series (países, áreas), los **siete colores de series** en orden fijo (`docs/color.md` §5); el usuario puede reasignar solo países y áreas, dentro de esos siete. Los colores de estado solo cuando el dato ES ese estado, y nunca en el mismo gráfico que las series. Nunca paletas categóricas arbitrarias.
- Etiqueta directo sobre la barra/línea; evita leyendas de ida y vuelta.

## 4. Estados (diseña todos, no solo el happy path)

- **Loading**: skeleton en grises del sistema, **sin shimmer con bounce** ni spinners giratorios como default. Feedback < 0.1s.
- **Empty state**: nunca pantalla en blanco — explica por qué está vacío y da **una acción** (CTA = el elemento lime de esa vista). Nunca renderizar el chart "fantasma" como pie/donut.
- **Error**: di **qué pasó, por qué y cómo resolverlo**, en español, conclusión primero, sin códigos ni stack. El peso lo da el copy: texto de error en rojo oscuro `#8E1116` sobre blanco, alertas con rojo de fondo `#E31A22` y texto blanco, siempre con label. Jamás pantallas teñidas de rojo.
- **Graceful degradation**: cada sección (KPI, gráfico, tabla) maneja su propia carga/error; si una falla, el resto sigue funcional. Error boundary global además del manejo por sección.

## 5. Formularios y gates

- Validación **inline** (copy + posición, no solo color).
- No escondas límites/condiciones; si el submit está deshabilitado, deja claro qué falta.
- **Gates como invariantes, no solo UI**: estados bloqueados (`frozen`, `data_locked`, cierres de cadencia) van **read-only de verdad** (la BD lo fuerza) y la UI lo comunica con label + estado.
- Acciones irreversibles: confirmación explícita que enuncia la consecuencia antes de ejecutar.

## 6. Interacción y craft

- **Sigue convenciones** (Ley de Jakob): nav, acciones y selectores donde se esperan.
- **Todos los estados** de cada control: default / hover / focus / active / disabled / loading. Hover de marca = **opacidad 0.7** (`.agcs-hover`) o inversión de fondo — nunca tinte, nunca elevación (`hover:shadow-*` prohibido).
- **Microinteracciones** cortas (~160-300ms), solo si comunican. Sin decoración.
- **Sin dark patterns**.
- **Voz**: declarativa, conclusión primero, tercera persona, sentence case; ALL CAPS solo en labels mono cortos. Sin emoji en UI.
- **Iconografía**: sin icon set en material de marca (slides). En producto, Lucide a 1.5px en color tinta es la sustitución aceptada — documentada, nunca de color de acento.

## 7. Carga cognitiva

- Memoria de trabajo ≈ **4±1** (Cowan). Agrupa KPIs y opciones en bloques de ≤4-5; navegación top-level ≤ 5 items.
- Reconocer > recordar: filtros activos como chips removibles (cuadrados).
- "Menos, pero mejor": cada elemento se gana su lugar; en la duda, quita.

---

## Flujo al construir UI (para Claude Code)

1. Antes de diseñar: `suggest_rules_for_context` (MCP designparser) con la tarea; cruza con la marca y este doc.
2. Construye respetando primero las reglas de marca, luego estas.
3. Antes de cerrar: `evaluate_design` (o secciones 1-4 como checklist). Verifica contraste real (lime y ámbar), foco por teclado y los tres estados. El build de la app debe pasar.
4. Si tocaste un color: `node tools/check-palette.mjs` en este repo tiene que pasar.
