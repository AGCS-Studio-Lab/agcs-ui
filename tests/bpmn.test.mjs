// Comportamiento de ui/bpmn/agcs-bpmn.js sin cargar bpmn-js: jsdom para el
// SVG y dobles minimos del eventBus, el canvas, el registro y el renderer de
// bpmn-js. Revisa los roles, el unico lime, el error, el trazo de 1,5 px y
// las esquinas rectas.
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { describe, it } from "node:test";

const dom = new JSDOM("<!doctype html><html><body></body></html>", { pretendToBeVisual: true });
globalThis.document = dom.window.document;
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);

const {
  HIGHLIGHT, ERROR, PRIORITY, readRoles, agcsBpmnConfig, stateOf, paintFor, tidyVisual,
  AgcsBpmnRenderer, AgcsBpmnOutline, agcsBpmnModule, setHighlight, setError, clearError, refreshAgcsBpmn,
} = await import("../ui/bpmn/agcs-bpmn.js");

const SVG = "http://www.w3.org/2000/svg";
const ROLE_VALUES = {
  "--surface": "#FFFFFF", "--ink": "#1A1A1A", "--highlight": "#C8FF29", "--highlight-ink": "#000000",
  "--highlight-edge": "#000000", "--text-error": "#8E1116", "--font-title": "N27",
};

// Herencia de tipos BPMN suficiente para las pruebas.
const PARENTS = {
  "bpmn:Task": ["bpmn:Activity"], "bpmn:UserTask": ["bpmn:Task"], "bpmn:Activity": ["bpmn:FlowNode"],
  "bpmn:StartEvent": ["bpmn:FlowNode"], "bpmn:ExclusiveGateway": ["bpmn:FlowNode"],
  "bpmn:FlowNode": ["bpmn:BaseElement"], "bpmn:SequenceFlow": ["bpmn:BaseElement"],
  "bpmn:Participant": ["bpmn:BaseElement"], "bpmn:Lane": ["bpmn:BaseElement"],
  "bpmn:DataObjectReference": ["bpmn:BaseElement"], "bpmn:Process": ["bpmn:BaseElement"],
};
function instanceOf(type, wanted) {
  return type === wanted || (PARENTS[type] || []).some((parent) => instanceOf(parent, wanted));
}
function element(id, type, extra = {}) {
  return { id, x: 10, y: 20, width: 100, height: 80, businessObject: { $type: type, $instanceOf: (wanted) => instanceOf(type, wanted) }, ...extra };
}

/* Un diagrama de mentira con el mismo contrato que diagram-js. */
function fakeDiagram(elements) {
  const listeners = {};
  const eventBus = {
    on(types, priority, fn) {
      if (typeof priority === "function") [fn, priority] = [priority, 1000];
      for (const type of [].concat(types)) (listeners[type] ||= []).push({ priority, fn });
      for (const type of [].concat(types)) listeners[type].sort((a, b) => b.priority - a.priority);
    },
    fire(type, data) {
      const event = { type, ...data };
      for (const { fn } of listeners[type] || []) {
        const result = fn(event, data);
        if (result !== undefined) return result;
      }
      return undefined;
    },
  };
  // Dentro del documento: jsdom no recalcula el estilo de un nodo suelto.
  const container = document.body.appendChild(document.createElement("div"));
  for (const [name, value] of Object.entries(ROLE_VALUES)) container.style.setProperty(name, value);
  const graphics = new Map();
  const markers = new Map();
  const root = { id: "root" };
  for (const item of elements) {
    item.parent = root;
    const gfx = document.createElementNS(SVG, "g");
    gfx.setAttribute("class", "djs-visual");
    graphics.set(item.id, gfx);
  }
  const canvas = {
    getContainer: () => container,
    hasMarker: (item, name) => Boolean(markers.get(item.id)?.has(name)),
    addMarker(item, name) {
      (markers.get(item.id) || markers.set(item.id, new Set()).get(item.id)).add(name);
      eventBus.fire("element.marker.update", { element: item, gfx: graphics.get(item.id), marker: name, add: true });
    },
    removeMarker(item, name) {
      markers.get(item.id)?.delete(name);
      eventBus.fire("element.marker.update", { element: item, gfx: graphics.get(item.id), marker: name, add: false });
    },
  };
  const elementRegistry = {
    get: (id) => elements.find((item) => item.id === id),
    getGraphics: (item) => graphics.get(item.id),
    filter: (fn) => elements.filter(fn),
    forEach: (fn) => elements.forEach(fn),
  };
  const drawn = [];
  // Dibuja como bpmn-js: trazo de 2 px en linea, rect con esquina redonda
  // y una flecha de 10 x 10 en las conexiones.
  const bpmnRenderer = {
    drawShape(gfx, item, attrs) {
      drawn.push({ id: item.id, attrs });
      const rect = document.createElementNS(SVG, "rect");
      rect.setAttribute("rx", "10");
      rect.style.stroke = attrs.stroke;
      rect.style.fill = attrs.fill;
      rect.style.strokeWidth = "2px";
      gfx.appendChild(rect);
      return rect;
    },
    drawConnection(gfx, item, attrs) {
      drawn.push({ id: item.id, attrs });
      const defs = document.createElementNS(SVG, "defs");
      const marker = document.createElementNS(SVG, "marker");
      marker.setAttribute("id", `marker-${item.id}`);
      marker.setAttribute("markerWidth", "10");
      marker.setAttribute("markerHeight", "10");
      defs.appendChild(marker);
      gfx.appendChild(defs);
      const path = document.createElementNS(SVG, "path");
      path.style.stroke = attrs.stroke;
      path.style.strokeWidth = "2px";
      path.style.setProperty("marker-end", `url(#marker-${item.id})`);
      gfx.appendChild(path);
      return path;
    },
  };
  const graphicsFactory = {
    update(kind, item, gfx) {
      gfx.replaceChildren();
      eventBus.fire(`render.${kind}`, { gfx, element: item });
    },
  };
  const theme = new AgcsBpmnRenderer(eventBus, bpmnRenderer, canvas, elementRegistry, graphicsFactory);
  const services = { canvas, elementRegistry, eventBus, agcsBpmn: theme };
  const diagram = { get: (name, strict) => (name in services ? services[name] : strict === false ? null : undefined) };
  const render = (item) => {
    const gfx = graphics.get(item.id);
    graphicsFactory.update(item.waypoints ? "connection" : "shape", item, gfx);
    return gfx;
  };
  return { diagram, canvas, eventBus, graphics, drawn, render, services };
}

describe("roles and config", () => {
  it("reads the roles from the container", () => {
    const el = document.createElement("div");
    for (const [name, value] of Object.entries(ROLE_VALUES)) el.style.setProperty(name, value);
    const roles = readRoles(el);
    assert.equal(roles.surface, "#FFFFFF");
    assert.equal(roles.highlightEdge, "#000000");
    assert.equal(roles.error, "#8E1116");
  });

  it("falls back to var(--role) when tokens are missing", () => {
    const roles = readRoles(document.createElement("div"));
    assert.equal(roles.surface, "var(--surface)");
    assert.equal(roles.ink, "var(--ink)");
  });

  it("builds the bpmnRenderer and textRenderer config from roles", () => {
    const el = document.createElement("div");
    for (const [name, value] of Object.entries(ROLE_VALUES)) el.style.setProperty(name, value);
    assert.deepEqual(agcsBpmnConfig(el), {
      bpmnRenderer: { defaultFillColor: "#FFFFFF", defaultStrokeColor: "#1A1A1A", defaultLabelColor: "#1A1A1A" },
      textRenderer: { defaultStyle: { fontFamily: "N27" } },
    });
  });
});

describe("states", () => {
  const roles = readRoles(Object.assign(document.createElement("div")));
  const marked = (names) => ({ hasMarker: (item, name) => names.includes(name) });

  it("paints lime only on a flow node with the highlight marker", () => {
    assert.equal(stateOf(element("t", "bpmn:Task"), marked([])), "normal");
    assert.equal(stateOf(element("t", "bpmn:Task"), marked([HIGHLIGHT])), "highlight");
    assert.equal(stateOf(element("p", "bpmn:Participant"), marked([HIGHLIGHT])), "normal");
    assert.equal(stateOf(element("f", "bpmn:SequenceFlow", { waypoints: [] }), marked([HIGHLIGHT])), "normal");
    assert.equal(stateOf(element("l", "bpmn:Task", { labelTarget: {} }), marked([HIGHLIGHT])), "normal");
  });

  it("lets error win over lime", () => {
    assert.equal(stateOf(element("t", "bpmn:Task"), marked([HIGHLIGHT, ERROR])), "error");
  });

  it("maps each state to roles", () => {
    assert.deepEqual(paintFor("normal", undefined, roles), { fill: "var(--surface)", stroke: "var(--ink)" });
    assert.deepEqual(paintFor("highlight", {}, roles), { fill: "var(--highlight)", stroke: "var(--highlight-ink)" });
    assert.deepEqual(paintFor("error", {}, roles), { fill: "var(--surface)", stroke: "var(--text-error)" });
    // Un trazo que pide bpmn-js (por ejemplo, al arrastrar) se respeta en reposo,
    // pero no puede tapar el error ni el lime.
    assert.equal(paintFor("normal", { stroke: "x" }, roles).stroke, "x");
    assert.equal(paintFor("error", { stroke: "x" }, roles).stroke, "var(--text-error)");
    assert.equal(paintFor("highlight", { fill: "x" }, roles).fill, "var(--highlight)");
  });
});

describe("tidyVisual", () => {
  it("squares corners, thins 2 px strokes and scales their arrowheads once", () => {
    const gfx = document.createElementNS(SVG, "g");
    gfx.innerHTML = `
      <defs><marker id="m1" markerWidth="10" markerHeight="10"></marker></defs>
      <rect rx="10" ry="10" style="stroke-width: 2px"></rect>
      <path style="stroke-width: 2px; marker-end: url(#m1)"></path>
      <path style="stroke-width: 2px; marker-end: url('#m1')"></path>
      <circle style="stroke-width: 4px"></circle>
      <path stroke-width="2"></path>`;
    tidyVisual(gfx);
    const [rect] = gfx.querySelectorAll("rect");
    assert.equal(rect.getAttribute("rx"), "0");
    assert.equal(rect.getAttribute("ry"), "0");
    assert.equal(rect.style.strokeWidth, "1.5px");
    const paths = gfx.querySelectorAll("path");
    assert.equal(paths[0].style.strokeWidth, "1.5px");
    assert.equal(paths[2].getAttribute("stroke-width"), "1.5px");
    // El fin de 4 px es semantica BPMN.
    assert.equal(gfx.querySelector("circle").style.strokeWidth, "4px");
    const marker = gfx.querySelector("marker");
    assert.equal(Number(marker.getAttribute("markerWidth")).toFixed(3), (40 / 3).toFixed(3));
    assert.equal(Number(marker.getAttribute("markerHeight")).toFixed(3), (40 / 3).toFixed(3));
  });
});

describe("AgcsBpmnRenderer", () => {
  it("runs above the bpmn-js renderer and draws with roles", () => {
    assert.ok(PRIORITY > 1000);
    const task = element("Task_1", "bpmn:Task");
    const { render, drawn } = fakeDiagram([task]);
    const gfx = render(task);
    assert.deepEqual(drawn.at(-1).attrs, { fill: "#FFFFFF", stroke: "#1A1A1A" });
    assert.equal(gfx.firstElementChild.getAttribute("rx"), "0");
    assert.equal(gfx.firstElementChild.style.strokeWidth, "1.5px");
  });

  it("returns a square path for activities", () => {
    const task = element("Task_1", "bpmn:Task");
    const { eventBus } = fakeDiagram([task]);
    assert.equal(eventBus.fire("render.getShapePath", task), "M10,20l100,0l0,80l-100,0z");
    assert.equal(eventBus.fire("render.getShapePath", element("S", "bpmn:StartEvent")), undefined);
  });

  it("keeps a single lime with the black edge", () => {
    const a = element("Task_A", "bpmn:Task");
    const b = element("Task_B", "bpmn:UserTask");
    const { diagram, canvas, graphics, drawn } = fakeDiagram([a, b]);
    setHighlight(diagram, "Task_A");
    assert.ok(canvas.hasMarker(a, HIGHLIGHT));
    assert.equal(drawn.at(-1).attrs.fill, "#C8FF29");
    assert.equal(graphics.get("Task_A").firstElementChild.style.stroke, "#000000");
    // Marcar otro con addMarker directo tambien quita el anterior.
    canvas.addMarker(b, HIGHLIGHT);
    assert.equal(canvas.hasMarker(a, HIGHLIGHT), false);
    assert.ok(canvas.hasMarker(b, HIGHLIGHT));
    const limes = [...graphics.values()].filter((gfx) => gfx.firstElementChild?.style.fill === "#C8FF29");
    assert.equal(limes.length, 1);
    setHighlight(diagram, null);
    assert.equal(canvas.hasMarker(b, HIGHLIGHT), false);
    assert.equal(graphics.get("Task_B").firstElementChild.style.fill, "#FFFFFF");
  });

  it("rereads the roles after a mode change", () => {
    const task = element("Task_1", "bpmn:Task");
    const { diagram, services, graphics } = fakeDiagram([task]);
    setHighlight(diagram, "Task_1");
    const container = services.canvas.getContainer();
    // Modo oscuro: la marca del lime pasa a lime y el fondo a negro.
    container.style.setProperty("--highlight-edge", "#C8FF29");
    container.style.setProperty("--surface", "#000000");
    refreshAgcsBpmn(diagram);
    const rect = graphics.get("Task_1").firstElementChild;
    assert.equal(rect.style.fill, "#C8FF29");
    assert.equal(rect.style.stroke, "#C8FF29");
    setHighlight(diagram, null);
    assert.equal(graphics.get("Task_1").firstElementChild.style.fill, "#000000");
  });

  it("never paints lime on pools, lanes or flows", () => {
    const pool = element("Pool", "bpmn:Participant");
    const flow = element("Flow", "bpmn:SequenceFlow", { waypoints: [{ x: 0, y: 0 }, { x: 10, y: 0 }] });
    const { canvas, graphics } = fakeDiagram([pool, flow]);
    canvas.addMarker(pool, HIGHLIGHT);
    canvas.addMarker(flow, HIGHLIGHT);
    assert.equal(graphics.get("Pool").firstElementChild.style.fill, "#FFFFFF");
    assert.ok(graphics.get("Pool").classList.contains("agcs-bpmn-pool"));
    assert.equal(graphics.get("Flow").querySelector("path").style.stroke, "#1A1A1A");
  });

  it("marks errors with the error role and a text badge", () => {
    const task = element("Task_1", "bpmn:Task");
    const fake = fakeDiagram([task]);
    const added = [];
    const removed = [];
    fake.services.overlays = { add: (...args) => added.push(args), remove: (filter) => removed.push(filter) };
    setError(fake.diagram, "Task_1", "<b>Falta responsable</b>");
    assert.equal(fake.graphics.get("Task_1").firstElementChild.style.stroke, "#8E1116");
    const badge = added.at(-1)[2].html;
    assert.equal(badge.className, "agcs-bpmn-error");
    assert.equal(badge.textContent, "<b>Falta responsable</b>");
    assert.equal(badge.children.length, 0);
    clearError(fake.diagram, "Task_1");
    assert.equal(fake.graphics.get("Task_1").firstElementChild.style.stroke, "#1A1A1A");
    assert.deepEqual(removed.at(-1), { element: task, type: ERROR });
  });

  it("throws a clear error for an unknown id", () => {
    const { diagram } = fakeDiagram([]);
    assert.throws(() => setHighlight(diagram, "Nope"), /no existe el elemento Nope/);
  });
});

describe("AgcsBpmnOutline", () => {
  it("squares the bpmn-js outline and the fallback rect", () => {
    let provider;
    const base = {
      getOutline: (item) => {
        if (item.id !== "Task") return undefined;
        const rect = document.createElementNS(SVG, "rect");
        rect.setAttribute("rx", "14");
        return rect;
      },
    };
    const injector = { get: (name) => ({ outline: { registerProvider: (priority, value) => { provider = { priority, value }; } }, outlineProvider: base })[name] };
    const outline = new AgcsBpmnOutline(injector);
    assert.equal(provider.priority, PRIORITY);
    assert.equal(provider.value, outline);
    assert.equal(outline.getOutline({ id: "Task" }).getAttribute("rx"), "0");
    const fallback = outline.getOutline({ id: "Flow" });
    assert.equal(fallback.getAttribute("rx"), "0");
    assert.ok(fallback.classList.contains("djs-outline"));
    const shape = document.createElementNS(SVG, "rect");
    shape.setAttribute("rx", "4");
    assert.equal(outline.updateOutline({}, shape), false);
    assert.equal(shape.getAttribute("rx"), "0");
  });

  it("is part of the module", () => {
    assert.deepEqual(agcsBpmnModule.__init__, ["agcsBpmn", "agcsBpmnOutline"]);
  });
});
