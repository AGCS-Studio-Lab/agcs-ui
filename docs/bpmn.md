# Tema BPMN

Tema de AGCS para bpmn-js, el editor y visor de BPMN de bpmn.io. Viste los
elementos, la paleta, el context pad y el menú emergente con los roles de
`tokens/colors.css`, radio 0, sombra 0, trazo de 1,5 px y letra N27. Sirve
para el Modeler (editar) y para el Viewer (solo mirar). La página de
referencia es `reference/bpmn.html` (issue agcs-ui#10).

## Versión probada

**bpmn-js 18.31.1**, confirmada en el registro de npm: publicada el 21 de
octubre de 2026, depende de diagram-js `^15.28.0`. Instálala exacta:

```sh
npm install --save-exact bpmn-js@18.31.1
```

Otra versión puede cambiar las clases o los eventos que el tema usa. Antes de
subir de versión, abre `reference/bpmn.html` con la nueva y revisa los cuatro
estados en claro y oscuro.

## Archivos

| Archivo | Qué es |
|---|---|
| `ui/bpmn/agcs-bpmn.css` | Sobrescribe las clases de bpmn-js y diagram-js: lienzo, paleta, context pad, menú emergente, búsqueda, edición de texto, contornos de selección, foco y la etiqueta de error. Todo cuelga de la clase `agcs-bpmn`. |
| `ui/bpmn/agcs-bpmn.js` | Módulo sin dependencias. Entrega la configuración de colores y letra (`agcsBpmnConfig`), un módulo adicional (`agcsBpmnModule`) que dibuja con los roles, deja las esquinas rectas y pinta el lime, y las funciones `setHighlight`, `setError`, `clearError` y `refreshAgcsBpmn`. |
| `reference/bpmn.html` | Todos los elementos en estado normal, seleccionado y error, y el proceso inventado «Apertura de cuenta digital», en claro y oscuro. |
| `tests/bpmn.test.mjs`, `tests/bpmn-css.test.mjs` | Pruebas del módulo y de las reglas del CSS (`npm test`). |

Elementos cubiertos: eventos de inicio, intermedio y fin; tarea, tarea de
usuario y tarea de servicio; compuertas exclusiva y paralela; flujos de
secuencia y de mensaje; pool y lane; objeto de datos; anotación de texto.

## Copiar a una app

1. Copia `ui/bpmn/agcs-bpmn.css` y `ui/bpmn/agcs-bpmn.js` a
   `src/components/brand/bpmn/`, sin cambios.
2. La app ya carga `tokens/colors.css` y `tokens/fonts.css`. Después de ellos,
   importa los estilos en este orden:

   ```js
   import "bpmn-js/dist/assets/diagram-js.css";
   import "bpmn-js/dist/assets/bpmn-js.css";
   import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
   import "./components/brand/bpmn/agcs-bpmn.css";
   ```

3. Pon la clase `agcs-bpmn` en el contenedor y crea el diagrama cuando el
   contenedor ya esté en la página. El tema lee los roles de ese contenedor,
   así que toma los del modo en que está.

   ```js
   import BpmnModeler from "bpmn-js/lib/Modeler";
   import { agcsBpmnConfig, agcsBpmnModule } from "./components/brand/bpmn/agcs-bpmn.js";

   const container = document.getElementById("diagrama");
   container.classList.add("agcs-bpmn");

   const modeler = new BpmnModeler({
     container,
     ...agcsBpmnConfig(container),
     additionalModules: [agcsBpmnModule],
   });

   await modeler.importXML(xml);
   ```

   Para solo mirar, usa `bpmn-js/lib/Viewer` o `bpmn-js/lib/NavigatedViewer`
   con la misma configuración.

4. Sin bundler, carga los mismos archivos desde unpkg con la versión exacta,
   como hace `reference/bpmn.html`:

   ```html
   <link rel="stylesheet" href="https://unpkg.com/bpmn-js@18.31.1/dist/assets/diagram-js.css">
   <link rel="stylesheet" href="https://unpkg.com/bpmn-js@18.31.1/dist/assets/bpmn-js.css">
   <link rel="stylesheet" href="https://unpkg.com/bpmn-js@18.31.1/dist/assets/bpmn-font/css/bpmn.css">
   <script src="https://unpkg.com/bpmn-js@18.31.1/dist/bpmn-modeler.development.js"></script>
   ```

   El bundle define `window.BpmnJS`. `agcs-bpmn.js` se importa como módulo
   (`<script type="module">`), así que la página se sirve por HTTP.

### Qué entrega `agcsBpmnConfig(container)`

```js
{
  bpmnRenderer: {
    defaultFillColor: "<--surface>",
    defaultStrokeColor: "<--ink>",
    defaultLabelColor: "<--ink>",
  },
  textRenderer: { defaultStyle: { fontFamily: "<--font-title>" } },
}
```

Los valores salen de los roles ya resueltos en el contenedor. Si falta
`tokens/colors.css`, queda `var(--rol)` y el diagrama se ve sin color.

## Marcar el lime

Un diagrama lleva un solo lime, con su marca negra (`--highlight-edge`). Va en
el elemento que la pantalla quiere que se mire primero: el paso que fija el
plazo, el cuello de botella, el que se está discutiendo.

```js
import { setHighlight } from "./components/brand/bpmn/agcs-bpmn.js";

setHighlight(modeler, "Task_Revisar");   // marca este y quita el anterior
setHighlight(modeler, null);             // quita el lime
```

También sirve la marca de diagram-js, con el mismo efecto:

```js
modeler.get("canvas").addMarker("Task_Revisar", "agcs-highlight");
```

Reglas:

- Marcar un elemento quita el lime del que lo tenía.
- Solo toman lime las tareas, los eventos y las compuertas (`bpmn:FlowNode`).
  En un pool, un lane, una conexión o una etiqueta, la marca no pinta nada.
- La regla de tres lime por pantalla sigue valiendo: si la pantalla muestra
  dos diagramas, cuentan los dos.
- En modo oscuro la marca es lime sobre negro, como dice `tokens/colors.css`.

## Marcar un error

```js
import { setError, clearError } from "./components/brand/bpmn/agcs-bpmn.js";

setError(modeler, "Task_Crear", "Sin responsable");
setError(modeler, "Flow_8", "Sin condición", { top: 6, left: 4 });
clearError(modeler, "Task_Crear");
```

El elemento pasa a `--text-error` y lleva una etiqueta escrita con los roles
de riesgo (`--state-risk-bg`, `--state-risk-ink`). El color nunca va solo:
escribe siempre qué falla. El cuarto argumento mueve la etiqueta; por defecto
va sobre la esquina superior izquierda. En una conexión conviene ponerla
debajo de la línea. Si un elemento tiene error y lime, se ve el error.

## Cambio de modo

El tema lee los roles una vez. Después de cambiar `.dark` o `data-mode` en la
página, redibuja:

```js
import { refreshAgcsBpmn } from "./components/brand/bpmn/agcs-bpmn.js";

refreshAgcsBpmn(modeler);
```

Sin esta llamada, las figuras quedan con los colores del modo anterior.

## Qué no se cambia

- **El logo de bpmn.io.** La licencia de bpmn-js pide que se vea siempre, abajo
  a la derecha de cada diagrama. El tema solo le da el color `--ink-2` para que
  se lea en oscuro. No lo ocultes, no lo muevas, no pongas nada encima.
- **El radio.** Cero en figuras, contornos, paleta, context pad, menú y campos.
  Las esquinas rectas son la decisión de Max («Rectas (AGCS)»).
- **Los colores por rol.** Nada de hex sueltos ni colores de bpmn.io. Los
  colores que traiga un archivo .bpmn en su DI (`bioc:fill`,
  `color:background-color`) se guardan en el XML y no se pintan.
- **El trazo.** 1,5 px en tinta. El evento de fin (4 px) y la call activity
  (5 px) conservan su grosor: es semántica BPMN. Las puntas de flecha se
  agrandan en la misma proporción para que no se achiquen.
- **La sombra.** Ninguna.
- **El foco.** Contorno de 2 px en tinta con 2 px de separación. No se quita.

Un renderer propio de la app que tenga que dibujar encima del tema necesita una
prioridad mayor que 1500 (`PRIORITY` en `agcs-bpmn.js`).

## Límites conocidos

- El lienzo no lleva grid. `docs/grid.md` lo permite en lienzos de diagrama;
  queda para cuando DRIs lo pida.
- N27 solo tiene pesos 500 y 700. El texto del diagrama usa 500.
- La etiqueta interna de un elemento con error también pasa a `--text-error`.
- Con varios elementos seleccionados, el contorno pasa a `--ink-3`. El panel
  «Seleccionado» de la página de referencia muestra el contorno de un solo
  elemento en todos a la vez; en la app se selecciona uno.
- El contorno recto de selección, del redimensionador y de los puntos de
  arrastre usa `rx` y `ry` en CSS. Safari no está verificado.

## Pruebas

`npm test` corre, entre otras, estas dos:

- `tests/bpmn-css.test.mjs`: solo roles, radio 0, sin sombra, foco en tinta,
  hover con opacidad 0,7, el logo visible y sin reglas que lo oculten, y el
  lime fuera del CSS.
- `tests/bpmn.test.mjs`: lectura de los roles, colores por estado, esquinas
  rectas, trazo de 1,5 px, un solo lime y solo por la marca, el error con
  etiqueta escrita y el cambio de modo. Usa un diagrama simulado: bpmn-js no
  está en `package.json`. La revisión visual se hace en `reference/bpmn.html`.
