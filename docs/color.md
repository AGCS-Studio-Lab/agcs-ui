# Color en las apps de AGCS

Versión 0.1 · 24 de septiembre de 2026. Decidido por Max Gallardo sobre la
página de referencia `reference/paleta-dashboards.html`, con las pruebas de
la skill dataviz, las reglas de designparser y el contraste de WCAG 2.2 y
APCA.

La marca vive en `agcs-design-system` y manda sobre este documento. Todo lo
de aquí aplica solo a apps: los decks siguen con las reglas de la marca.

Todas las reglas son piso: cada una nombra algo que hay que hacer, y no
cumplirla es un defecto que se puede verificar.

---

## 1 · Grises

Diez pasos parejos, de `gray-50` a `gray-900`. Incluyen Mist (200), el gris
muted de la marca (600) y Carbon (900). Son los únicos grises de una app: los
de Tailwind (`slate`, `zinc`, `neutral`, `stone`) y los hex sueltos quedan
fuera.

| Rol | Claro | Oscuro |
|---|---|---|
| Fondo | Paper `#FFFFFF` | Obsidian `#000000` |
| Tinta | Carbon `#1A1A1A` | Paper |
| Tinta 2 | `gray-700` | `gray-300` |
| Tinta 3 | `gray-600` | `gray-500` |
| Líneas finas | Mist | `gray-800` |
| Borde de campo de formulario | `gray-600` | `gray-500` |

El borde de un campo de formulario necesita 3:1 contra el fondo. Mist da
1.3:1, así que nunca se usa para bordes de campos.

## 2 · Lime: uno por grupo

- Cada grupo de la pantalla tiene como máximo un elemento en lime. Un grupo es
  una unidad que se lee por separado: el menú, un gráfico, una tabla.
- Una pantalla tiene como máximo tres lime. El del contenido es el foco
  principal y los otros dos son secundarios.
- Toda pantalla tiene al menos uno. Una pantalla sin lime es un defecto.
- Cada lime lleva una marca negra, un borde o una franja. Sobre blanco el
  lime da 1.2:1: en gris, en impresión y con tritanopia casi desaparece, y la
  marca negra es lo que queda.
- El botón principal va en negro. El lime queda para el dato de cada grupo.
- El lime es el mismo `#C8FF29` en modo claro y en modo oscuro.

Base: una pantalla tiene un foco principal y como mucho dos secundarios, y
dentro de un grupo un segundo elemento destacado anula al primero (reglas
`emphasis` y `von-restorff-effect` de designparser).

## 3 · Estados

Tres estados, los mismos que usa `agcs-management-system`. La etiqueta
escrita dice el estado y el color la refuerza.

| Estado | Fondo | Texto encima |
|---|---|---|
| On-track | Sin color, borde de tinta | Tinta |
| En riesgo | Ámbar `#FFB800` | Negro, 12.1:1 |
| Guardrail cruzado | Rojo de fondo `#E31A22` | Blanco, 4.7:1 · APCA 76 |

- **Ámbar.** Reemplaza al amarillo `#FFFF00` de la marca, solo en apps. El
  amarillo y el lime casi no se distinguen (6.9 con visión normal, 1.4 con
  protanopia), y un dato resaltado se confundía con un estado en riesgo.
- **Rojo de fondo.** Es el rojo de marca apenas más oscuro. Con texto blanco
  cumple WCAG 2.2 (4.7:1) y APCA (76). Sobre el rojo de marca, el texto negro
  daba 36 en APCA y el blanco 4.4:1 en WCAG.
- Lo que va bien no lleva color, para que el ámbar y el rojo destaquen.

## 4 · Texto con color

Si un texto no es un error, un enlace o un mensaje del sistema, va en tinta.

| Color | Cuándo se usa |
|---|---|
| Rojo oscuro `#8E1116` | Texto sobre blanco: el error de un campo, el aviso de que algo no cargó, el nombre de una acción que borra o cierra, una variación que es mala. |
| Rojo de marca `#ED1C24` | Una barra o un punto de gráfico cuando el dato es un riesgo. Texto de error sobre negro. |
| Rojo de fondo `#E31A22` | Fondo de "Guardrail cruzado" y de las alertas, siempre con texto blanco. |
| Azul oscuro `#05699F` | Texto sobre blanco: enlaces, siempre subrayados, y mensajes del sistema. |
| Azul de marca `#00A1F1` | Serie 1 de los gráficos y escala de los mapas de calor. Enlaces y mensajes del sistema sobre negro. |

## 5 · Gráficos

**Por defecto, énfasis.** Todo en gris (`--chart-rest`) y un dato en lime
con borde negro. Casi todo gráfico existe para mostrar una sola cosa.

**Para comparar series, siete colores en orden fijo.** Solo cuando un gráfico
tiene varias series, como países o áreas. Lo que pase de siete va en "Otros",
gris.

| # | Color | Claro | Oscuro |
|---|---|---|---|
| 1 | Azul datos | `#00A1F1` | `#0495DE` |
| 2 | Oliva | `#8B9D1E` | `#859712` |
| 3 | Violeta | `#4F39EC` | `#5341F3` |
| 4 | Verde agua | `#04A99B` | `#07A295` |
| 5 | Ocre | `#805C03` | `#B38309` |
| 6 | Rosa | `#CE84A7` | `#BD7598` |
| 7 | Azul marino | `#4369A2` | `#32669A` |
| | Otros | `#9A9A9A` | `#6B6B6B` |

- Vienen de la marca (azul datos), de *The Designer's Dictionary of Color*
  de Sean Adams, capítulo Chartreuse (oliva, verde agua, ocre, rosa, azul
  marino) y de la paleta de DRIS del 25 de mayo (violeta). Cada uno se ajustó
  hasta pasar las pruebas.
- En modo claro, azul, verde agua y rosa quedan bajo 3:1 sobre blanco. Por eso
  cada serie lleva su valor escrito o el gráfico tiene su tabla.
- Un gráfico de series nunca lleva colores de estado. Con protanopia, el ocre
  y el rojo se ven iguales (1.9).
- Mapas de calor y magnitudes: la escala azul, un solo tono de claro a oscuro.
- Barras con esquinas rectas: la marca no usa radio.

## 6 · Personalización

- El usuario solo puede cambiar el color de **países y áreas**
  (`CUSTOMIZABLE_KINDS` en `src/series.js`).
- Elige entre los siete colores de series. Lime, ámbar y rojo no se ofrecen,
  porque ya significan otra cosa.
- El color sigue a la entidad: México conserva su color en todos los
  gráficos, aunque un filtro cambie cuántas series se ven.
- Antes de guardar, `checkChoice()` revisa la elección. Si dos colores vecinos
  se confunden o se repiten, la app lo dice y pide cambiar uno.
- El tema es fijo en AGCS. El tema Alto contraste (`SERIES.highContrast`)
  está validado y guardado para cuando un cliente lo pida para proyector o
  impresión. No se ofrece por ahora.

## 7 · Cómo se prueba

```bash
node tools/check-palette.mjs
```

Revisa que `tokens/colors.css` y `src/palette.js` digan lo mismo, y corre las
pruebas de series, texto y estados. Sale con error si algo falla. Ningún color
cambia sin que pase.

| Prueba | Mínimo |
|---|---|
| Series vecinas, visión normal | 15 |
| Series vecinas, protanopia y deuteranopia | 8 |
| Tres primeras series entre todas | 15 y 8 |
| Texto | 4.5:1 |
| Bordes de campos y marcas de gráfico | 3:1 |
| Texto blanco sobre rojo, APCA | 60 |
| Series lejos de lime, ámbar y rojos | 15 |

Las distancias son en OKLab ×100, con la simulación de daltonismo de Machado,
Oliveira y Fernandes (2009), las mismas de la skill dataviz.
