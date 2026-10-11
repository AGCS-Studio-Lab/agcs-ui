// Entorno de prueba para ui/disclosure.jsx: un DOM de jsdom y el componente
// compilado con esbuild dos veces, una con React 19 (management) y otra con
// React 18 (DRIs). Cada prueba corre con las dos.
import { build } from "esbuild";
import { JSDOM } from "jsdom";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost/",
  pretendToBeVisual: true,
});
for (const key of Object.getOwnPropertyNames(dom.window)) {
  if (key in globalThis) continue;
  globalThis[key] = dom.window[key];
}
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

export const REACT_VERSIONS = [
  { name: "React 19", alias: {} },
  { name: "React 18", alias: { react: "react-18", "react-dom": "react-dom-18" } },
];

const outDir = mkdtempSync(join(tmpdir(), "agcs-ui-disclosure-"));

/** Compila el componente con la versión de React pedida y devuelve sus exports. */
export async function loadWith(version) {
  const result = await build({
    stdin: {
      contents: [
        `export * from ${JSON.stringify(join(root, "ui/disclosure.jsx"))};`,
        `export { createElement, act, useState } from "react";`,
        `export { createRoot } from "react-dom/client";`,
      ].join("\n"),
      resolveDir: root,
      loader: "jsx",
    },
    bundle: true,
    write: false,
    format: "esm",
    platform: "browser",
    jsx: "automatic",
    alias: version.alias,
    define: { "process.env.NODE_ENV": '"development"' },
    logLevel: "silent",
  });
  const file = join(outDir, `${version.name.replace(/\W+/g, "-")}.mjs`);
  writeFileSync(file, result.outputFiles[0].text);
  return import(pathToFileURL(file).href);
}

/** Monta un árbol y devuelve el contenedor y funciones para interactuar. */
export function mount(lib, element) {
  const container = document.createElement("div");
  document.body.append(container);
  const outside = document.createElement("button");
  outside.textContent = "Fuera";
  document.body.append(outside);
  let root;
  lib.act(() => {
    root = lib.createRoot(container);
    root.render(element);
  });
  return {
    container,
    outside,
    $(selector) {
      return container.querySelector(selector);
    },
    act(fn) {
      lib.act(fn);
    },
    unmount() {
      lib.act(() => root.unmount());
      container.remove();
      outside.remove();
    },
  };
}

export function pointerDown(target) {
  const Ctor = window.PointerEvent ?? window.MouseEvent;
  target.dispatchEvent(new Ctor("pointerdown", { bubbles: true, cancelable: true }));
}

export function keyDown(target, key) {
  target.dispatchEvent(new window.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
}

export function focusOut(from, to) {
  from.dispatchEvent(new window.FocusEvent("focusout", { bubbles: true, relatedTarget: to }));
}
