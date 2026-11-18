/* ============================================================
   AGCS UI -- tema BPMN para bpmn-js (Modeler y Viewer)
   Probado con bpmn-js 18.31.1. Va con ui/bpmn/agcs-bpmn.css.
   ============================================================
   Que hace:
     - agcsBpmnConfig(el): la configuracion de colores y letra para
       `new BpmnJS({ ...agcsBpmnConfig(el) })`, leida de los roles de
       tokens/colors.css en tiempo de ejecucion.
     - agcsBpmnModule: un modulo adicional que dibuja con los roles,
       deja las esquinas rectas y el trazo en 1,5 px, y pinta el unico
       lime del diagrama en el elemento marcado con `agcs-highlight`.
     - setHighlight, setError, clearError y refreshAgcsBpmn: lo que una
       app llama para marcar el lime, un error o cambiar de modo.

   Los colores que el .bpmn trae en su DI (bioc:fill, color:background-color)
   se conservan en el XML pero no se pintan: en pantalla mandan los roles.
   Sin imports: funciona igual con el bundle UMD (window.BpmnJS) y con
   `import BpmnModeler from "bpmn-js/lib/Modeler"`.
   ============================================================ */

export const HIGHLIGHT = "agcs-highlight";
export const ERROR = "agcs-error";

/* Va sobre el renderer de bpmn-js (1000). Un renderer propio de la app
   que tenga que ganarle a este tema necesita una prioridad mayor. */
export const PRIORITY = 1500;

const ROLES = {
  surface: "--surface",
  ink: "--ink",
  highlight: "--highlight",
  highlightInk: "--highlight-ink",
  highlightEdge: "--highlight-edge",
  error: "--text-error",
  font: "--font-title",
};

const SVG_NS = "http://www.w3.org/2000/svg";
const STROKE = "1.5px";
const MARKER_PROPS = ["marker-start", "marker-mid", "marker-end"];

/* Lee los roles ya resueltos en `el` (el contenedor del diagrama, que puede
   estar dentro de un bloque en modo oscuro). Si el rol no existe, por
   ejemplo porque falta tokens/colors.css, deja `var(--rol)`. */
export function readRoles(el = globalThis.document?.documentElement) {
  const style = el && typeof globalThis.getComputedStyle === "function" ? globalThis.getComputedStyle(el) : null;
  const roles = {};
  for (const [key, name] of Object.entries(ROLES)) {
    const value = style ? style.getPropertyValue(name).trim() : "";
    roles[key] = value || `var(${name})`;
  }
  return roles;
}

/* Configuracion para el constructor de bpmn-js. `el` es el contenedor. */
export function agcsBpmnConfig(el) {
  const roles = readRoles(el);
  return {
    bpmnRenderer: {
      defaultFillColor: roles.surface,
      defaultStrokeColor: roles.ink,
      defaultLabelColor: roles.ink,
    },
    textRenderer: { defaultStyle: { fontFamily: roles.font } },
  };
}

function is(element, type) {
  const bo = element && element.businessObject;
  return Boolean(bo && typeof bo.$instanceOf === "function" && bo.$instanceOf(type));
}

/* Estado visual de un elemento. El error gana al lime; el lime solo va en
   tareas, eventos y compuertas (bpmn:FlowNode), nunca en una etiqueta ni
   en una conexion. */
export function stateOf(element, canvas) {
  if (element.labelTarget) return "normal";
  if (canvas.hasMarker(element, ERROR)) return "error";
  if (!element.waypoints && is(element, "bpmn:FlowNode") && canvas.hasMarker(element, HIGHLIGHT)) return "highlight";
  return "normal";
}

/* Colores que se pasan a bpmn-js. La etiqueta interna toma el color del
   trazo: tinta en reposo, --highlight-ink sobre el lime, --text-error en error. */
export function paintFor(state, attrs, roles) {
  const base = attrs || {};
  if (state === "error") return { fill: roles.surface, ...base, stroke: roles.error };
  if (state === "highlight") return { ...base, fill: roles.highlight, stroke: roles.highlightInk };
  return { fill: roles.surface, stroke: roles.ink, ...base };
}

function markerId(value) {
  const match = /url\(\s*["']?#([^"')\s]+)["']?\s*\)/.exec(value || "");
  return match ? match[1] : null;
}

/* Ajustes despues de que bpmn-js dibuja: esquinas rectas, trazo de 2 px a
   1,5 px y puntas de flecha compensadas para que no se achiquen. Los
   trazos con otro ancho (fin 4 px, call activity 5 px) son semantica BPMN
   y no se tocan. */
export function tidyVisual(gfx) {
  const scaled = new Set();
  for (const node of gfx.querySelectorAll("*")) {
    if (node.localName === "rect") {
      node.setAttribute("rx", "0");
      node.setAttribute("ry", "0");
    }
    const style = node.style;
    const inline = style ? style.strokeWidth : "";
    if (parseFloat(inline || node.getAttribute("stroke-width")) !== 2) continue;
    if (inline) style.strokeWidth = STROKE;
    else node.setAttribute("stroke-width", STROKE);
    for (const prop of MARKER_PROPS) {
      const id = markerId((style && style.getPropertyValue(prop)) || node.getAttribute(prop));
      if (!id || scaled.has(id)) continue;
      const marker = [...gfx.querySelectorAll("marker")].find((item) => item.getAttribute("id") === id);
      if (!marker) continue;
      scaled.add(id);
      for (const size of ["markerWidth", "markerHeight"]) {
        const value = parseFloat(marker.getAttribute(size));
        if (Number.isFinite(value)) marker.setAttribute(size, String((value * 4) / 3));
      }
    }
  }
}

export function AgcsBpmnRenderer(eventBus, bpmnRenderer, canvas, elementRegistry, graphicsFactory) {
  let roles = null;
  const getRoles = () => roles || (roles = readRoles(canvas.getContainer()));

  const redraw = (element) => {
    const gfx = elementRegistry.getGraphics(element);
    if (!gfx || !element.parent) return;
    graphicsFactory.update(element.waypoints ? "connection" : "shape", element, gfx);
  };

  eventBus.on(["render.shape", "render.connection"], PRIORITY, (event, context) => {
    const { element, gfx } = context;
    if (!is(element, "bpmn:BaseElement")) return;
    const current = getRoles();
    const state = stateOf(element, canvas);
    const attrs = paintFor(state, context.attrs, current);
    const drawn = event.type === "render.connection"
      ? bpmnRenderer.drawConnection(gfx, element, attrs)
      : bpmnRenderer.drawShape(gfx, element, attrs);
    tidyVisual(gfx);
    /* La marca del lime: negra en modo claro, lime sobre negro en oscuro. */
    if (state === "highlight" && gfx.firstElementChild) {
      gfx.firstElementChild.style.stroke = current.highlightEdge;
    }
    if (!element.labelTarget && (is(element, "bpmn:Participant") || is(element, "bpmn:Lane"))) {
      gfx.classList.add("agcs-bpmn-pool");
    }
    return drawn;
  });

  /* Las conexiones se recortan contra este contorno: sin esquinas redondas. */
  eventBus.on("render.getShapePath", PRIORITY, (event, element) => {
    if (element.labelTarget || !is(element, "bpmn:Activity")) return;
    const { x, y, width: w, height: h } = element;
    return `M${x},${y}l${w},0l0,${h}l${-w},0z`;
  });

  /* Un solo lime por diagrama: marcar uno quita el anterior. */
  eventBus.on("element.marker.update", (event) => {
    const { element, marker, add } = event;
    if (marker !== HIGHLIGHT && marker !== ERROR) return;
    if (marker === HIGHLIGHT && add) {
      const others = elementRegistry.filter((item) => item !== element && canvas.hasMarker(item, HIGHLIGHT));
      for (const other of others) canvas.removeMarker(other, HIGHLIGHT);
    }
    redraw(element);
  });

  /* Vuelve a leer los roles y redibuja: despues de cambiar de modo. */
  this.refresh = () => {
    roles = null;
    elementRegistry.forEach((element) => redraw(element));
  };
}
AgcsBpmnRenderer.$inject = ["eventBus", "bpmnRenderer", "canvas", "elementRegistry", "graphicsFactory"];

function squareRect(node) {
  if (node && node.localName === "rect") {
    node.setAttribute("rx", "0");
    node.setAttribute("ry", "0");
  }
  return node;
}

/* Contorno de seleccion recto. Usa el contorno de bpmn-js (circulos para
   eventos, rombos para compuertas) y deja en 0 las esquinas de los
   rectangulos, tambien el de las conexiones. */
export function AgcsBpmnOutline(injector) {
  const outline = injector.get("outline", false);
  const base = injector.get("outlineProvider", false);
  this.getOutline = (element) => {
    const shape = base && typeof base.getOutline === "function" ? base.getOutline(element) : undefined;
    if (shape) return squareRect(shape);
    const doc = globalThis.document;
    if (!doc) return undefined;
    const rect = doc.createElementNS(SVG_NS, "rect");
    for (const [name, value] of Object.entries({ class: "djs-outline", x: 0, y: 0, rx: 0, ry: 0, width: 100, height: 100 })) {
      rect.setAttribute(name, String(value));
    }
    rect.style.fill = "none";
    return rect;
  };
  this.updateOutline = (element, shape) => {
    squareRect(shape);
    return false;
  };
  if (outline && typeof outline.registerProvider === "function") outline.registerProvider(PRIORITY, this);
}
AgcsBpmnOutline.$inject = ["injector"];

export const agcsBpmnModule = {
  __init__: ["agcsBpmn", "agcsBpmnOutline"],
  agcsBpmn: ["type", AgcsBpmnRenderer],
  agcsBpmnOutline: ["type", AgcsBpmnOutline],
};

function find(diagram, id) {
  const element = diagram.get("elementRegistry").get(typeof id === "string" ? id : id && id.id);
  if (!element) throw new Error(`agcs-bpmn: no existe el elemento ${id}`);
  return element;
}

/* Marca el unico lime del diagrama. `null` lo quita. */
export function setHighlight(diagram, id) {
  const canvas = diagram.get("canvas");
  const marked = diagram.get("elementRegistry").filter((item) => canvas.hasMarker(item, HIGHLIGHT));
  for (const item of marked) canvas.removeMarker(item, HIGHLIGHT);
  if (id != null) canvas.addMarker(find(diagram, id), HIGHLIGHT);
}

/* Trazo en --text-error y una etiqueta escrita: el color nunca va solo.
   `position` mueve la etiqueta (por defecto, sobre la esquina superior
   izquierda); sirve para conexiones, donde arriba suele haber otra cosa. */
export function setError(diagram, id, text = "Error", position = { top: -22, left: 0 }) {
  const element = find(diagram, id);
  diagram.get("canvas").addMarker(element, ERROR);
  const overlays = diagram.get("overlays", false);
  const doc = globalThis.document;
  if (!overlays || !doc) return;
  overlays.remove({ element, type: ERROR });
  const badge = doc.createElement("span");
  badge.className = "agcs-bpmn-error";
  badge.textContent = text;
  overlays.add(element, ERROR, { position, html: badge });
}

export function clearError(diagram, id) {
  const element = find(diagram, id);
  diagram.get("canvas").removeMarker(element, ERROR);
  const overlays = diagram.get("overlays", false);
  if (overlays) overlays.remove({ element, type: ERROR });
}

export function refreshAgcsBpmn(diagram) {
  diagram.get("agcsBpmn").refresh();
}

/* Encaja solo cuando el lienzo tiene un tamaño utilizable. */
export function fitAgcsBpmn(diagram) {
  const canvas = diagram.get("canvas");
  const { clientWidth: width, clientHeight: height } = canvas.getContainer();
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return false;
  canvas.zoom("fit-viewport", "auto");
  return true;
}
