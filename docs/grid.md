# Grid en las apps de AGCS

Versión 0.2 · 24 de septiembre de 2026. Decidido por Max Gallardo sobre
`reference/grid-apps.html`, validado con designparser, la skill dataviz y las
reglas de la marca.

El grid de construcción es la firma de los decks. En una app va solo donde
las cosas pueden caer sobre sus líneas. Esta regla es piso: un grid en un
lugar que no está en la lista es un defecto.

---

## 1 · Valores

| Token | Claro | Oscuro |
|---|---|---|
| `--grid-step` | 16px | 16px |
| `--grid-line-w` | 1px | 1px |
| `--grid-line` | `rgba(0,0,0,.06)` | `rgba(255,255,255,.08)` |

- **16px.** Las apps espacian en múltiplos de 8. Con 16 caen sobre líneas
  los espacios de 16, 32, 48 y 64; con 24 solo 24 y 48; con 32, solo 32 y 64.
  Es el mismo formato que el grid de los decks: desde agcs-design-system
  v5.6 (25 de septiembre) los decks usan 48px a 4K, que en una pantalla de
  1280 se ven como 16px.
- **1px y la misma transparencia de los decks: 6% sobre blanco y 8% sobre
  negro** (v5.6, 25 de septiembre; antes 9% y 11%, a pedido de Max para que
  el grid se vea más claro). La línea mide 1.14:1 contra el fondo en los dos
  modos. Es más suave que la línea de escala que pide la skill dataviz (1.24
  a 1.29) y sigue sirviendo de escala: el cero va en tinta y las etiquetas
  marcan cada dos a cuatro líneas.
- La clase es `.agcs-grid` (`tokens/grid.css`). Las líneas quedan en
  `k × paso − 1`, así que un bloque que mide pasos enteros tiene sus bordes
  sobre líneas.

## 2 · Dónde va

1. **Entrada de módulo.** El encabezado de cada módulo, el equivalente del
   divider de un deck. Mide pasos enteros de alto y su línea inferior cae
   sobre una línea del grid. Lo que está debajo (indicadores, tablas) va
   plano.
2. **Estado vacío.** Una vista sin datos todavía. El grid le da textura al
   vacío. El botón de la acción es el lime de ese grupo, con borde negro.
3. **Lienzo de diagrama.** Vistas de nodos y mapas del sistema. Cada nodo
   empieza y termina sobre líneas y tiene fondo sólido, para que el grid no
   pase por encima del texto.
4. **Gráfico de barras alineado.** Solo si el grid es su escala: las
   condiciones de la sección 3.

**Dónde no va:** tablas, texto, formularios y el resto de los gráficos
(líneas, puntos, mapas de calor), hasta probarlos. Van planos, como las
slides de solo texto.

## 3 · Condiciones para un gráfico sobre el grid

1. El área del gráfico empieza y termina sobre líneas del grid.
2. Cada línea horizontal es un valor redondo de la escala: 1, 2, 5 o 10
   unidades por línea (`unitPerLine()` en `src/grid-chart.js`).
3. El cero está sobre una línea y se dibuja en tinta. El eje empieza
   siempre en cero.
4. Las etiquetas de la escala van cada dos a cuatro líneas, nunca en todas.
5. Cada barra empieza y termina sobre líneas verticales: ancho y separación
   en pasos enteros.
6. El gráfico no dibuja líneas de escala propias: el grid es su escala.
7. **El dato no se redondea.** Con conteos (bets, check-ins) la barra cae
   exacto en una línea. Con montos, termina donde está el valor, aunque sea
   entre dos líneas. En los decks las alturas se redondean a pasos enteros;
   en una app el dato es real y no se toca.
8. El ancho del gráfico es un número entero de pasos. Lo que sobra de la
   pantalla queda como margen, y el SVG nunca se escala.

`alignedBars(values)` en `src/grid-chart.js` devuelve la geometría que cumple
las ocho: tamaño en px, línea del cero, marcas de la escala y cada barra.

## 4 · Validación

| Regla | Fuente | Resultado |
|---|---|---|
| Espaciado en múltiplos de 8 | designparser · `8pt-grid` | 16px es la densidad que más espacios deja sobre líneas. |
| Retícula modular | designparser · `modular-grid` | Los nodos son módulos de 192 × 96 px sobre la retícula. |
| Primero en gris | designparser · `greyscale` | El grid es gris y ordena sin depender del color. |
| Líneas de escala finas, sólidas y discretas | dataviz · marks-and-anatomy | Desde el 25 de septiembre el grid mide 1.14:1, más suave que las líneas de escala de la skill (1.24 a 1.29). El cero en tinta sostiene la lectura. |
| Una sola escala por gráfico | dataviz | Detrás de un gráfico, el grid tiene que ser esa escala. |
| Etiquetas selectivas | dataviz · anti-patterns | Etiquetas cada dos a cuatro líneas. |
| Grid honesto: sin barras sueltas sobre el grid | marca · SKILL.md regla 7 | Es la condición de la sección 3. |
