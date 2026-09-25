/**
 * AGCS UI -- geometria de un grafico de barras sobre el grid   v0.2 (2026-09-24)
 *
 * El grid va detras de un grafico solo si es su escala (docs/grid.md).
 * Esta funcion calcula la geometria para que eso se cumpla: el area del
 * grafico en pasos enteros, cada linea horizontal un valor redondo, el cero
 * sobre una linea y cada barra entre dos lineas verticales.
 *
 * El dato no se redondea: con conteos la barra cae exacto en una linea; con
 * montos termina donde esta el valor.
 *
 * Las coordenadas son en px desde la esquina del contenedor que lleva
 * `.agcs-grid`. El SVG va en (0, 0) de ese contenedor y sin escalar.
 */

export const GRID_STEP = 16;

const NICE = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];

/** Valor por linea: el mas chico de 1, 2, 5, 10... que deja el maximo en `maxRows` lineas o menos. */
export function unitPerLine(maxValue, maxRows = 12) {
  for (const u of NICE) if (Math.ceil(maxValue / u) <= maxRows) return u;
  const mag = 10 ** Math.ceil(Math.log10(maxValue / maxRows));
  return mag;
}

/**
 * @param {number[]} values          valores de las barras, en orden
 * @param {object}   [o]
 * @param {number}   [o.step=16]     paso del grid en px
 * @param {number}   [o.maxRows=12]  maximo de lineas para la escala
 * @param {number}   [o.barSteps=3]  ancho de cada barra, en pasos
 * @param {number}   [o.gapSteps=2]  separacion entre barras, en pasos
 * @param {number}   [o.leftSteps=3] espacio para las etiquetas de la escala
 * @param {number}   [o.topSteps=1]  aire arriba de la escala
 * @param {number}   [o.bottomSteps=3] espacio para las etiquetas de categoria
 * @param {number}   [o.labelEvery=2] etiqueta la escala cada N lineas (2 a 4)
 */
export function alignedBars(values, o = {}) {
  const step = o.step ?? GRID_STEP;
  const barSteps = o.barSteps ?? 3, gapSteps = o.gapSteps ?? 2;
  const leftSteps = o.leftSteps ?? 3, topSteps = o.topSteps ?? 1, bottomSteps = o.bottomSteps ?? 3;
  const labelEvery = Math.min(4, Math.max(2, o.labelEvery ?? 2));
  if (values.some((v) => v < 0)) throw new Error("alignedBars: solo valores >= 0; el eje empieza en cero");

  const unit = unitPerLine(Math.max(...values, 1), o.maxRows ?? 12);
  // El techo de la escala es una linea con etiqueta: se redondea hacia arriba al siguiente multiplo de labelEvery.
  const rows = Math.ceil(Math.ceil(Math.max(...values, 1) / unit) / labelEvery) * labelEvery;
  const cols = leftSteps + gapSteps + values.length * (barSteps + gapSteps);

  const width = cols * step;
  const height = (topSteps + rows + bottomSteps) * step;
  const baseline = (topSteps + rows) * step - 1;          // fila de pixeles de la linea del cero
  const plotLeft = leftSteps * step - 1;
  const yOf = (v) => baseline - (v / unit) * step;         // sin redondear

  const ticks = [];
  for (let r = 0; r <= rows; r += labelEvery) ticks.push({ value: r * unit, y: baseline - r * step });

  const bars = values.map((v, i) => {
    const x = (leftSteps + gapSteps + i * (barSteps + gapSteps)) * step - 1;
    const top = yOf(v);
    return { value: v, x, width: barSteps * step, y: top + 1, height: baseline - top, onLine: Number.isInteger(v / unit) };
  });

  // Para dibujar el cero con un trazo de 1px en SVG: y = zeroLineY.
  const zeroLineY = baseline + 0.5;
  return { step, unit, rows, cols, width, height, baseline, zeroLineY, plotLeft, ticks, bars };
}
