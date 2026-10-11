// Comportamiento de ui/disclosure.jsx con React 19 (management) y React 18 (DRIs).
import assert from "node:assert/strict";
import { describe, it, before } from "node:test";
import { REACT_VERSIONS, loadWith, mount, pointerDown, keyDown, focusOut } from "./helpers/react-dom-env.mjs";

for (const version of REACT_VERSIONS) {
  describe(version.name, () => {
    let lib;
    let h;
    before(async () => {
      lib = await loadWith(version);
      h = lib.createElement;
    });

    function disclosure(props = {}) {
      return h(
        lib.Disclosure,
        props,
        h(lib.DisclosureTrigger, null, "Añadir persona"),
        h(lib.DisclosurePanel, null, h("input", { "aria-label": "Nombre" })),
      );
    }

    function menu(props = {}, items) {
      return h(
        lib.Menu,
        props,
        h(lib.MenuTrigger, null, "Senda Uno"),
        h(
          lib.MenuPanel,
          { "aria-label": "Cuenta" },
          items ?? [
            h(lib.MenuItem, { key: "a", onSelect: props.onAyuda }, "Ayuda"),
            h(lib.MenuItem, { key: "t", as: "a", href: "/legal/terminos" }, "Términos"),
          ],
        ),
      );
    }

    describe("Disclosure", () => {
      it("starts closed, with aria-expanded and aria-controls pointing at the hidden panel", () => {
        const view = mount(lib, disclosure());
        const button = view.$("button");
        const panel = view.$(".agcs-disclosure__panel");
        assert.equal(button.getAttribute("type"), "button");
        assert.equal(button.getAttribute("aria-expanded"), "false");
        assert.equal(button.getAttribute("aria-controls"), panel.id);
        assert.ok(panel.id);
        assert.equal(panel.hidden, true);
        assert.equal(view.$(".agcs-disclosure").dataset.state, "closed");
        view.unmount();
      });

      it("opens and closes with its button", () => {
        const view = mount(lib, disclosure());
        const button = view.$("button");
        view.act(() => button.click());
        assert.equal(button.getAttribute("aria-expanded"), "true");
        assert.equal(view.$(".agcs-disclosure__panel").hidden, false);
        assert.equal(view.$(".agcs-disclosure").dataset.state, "open");
        view.act(() => button.click());
        assert.equal(button.getAttribute("aria-expanded"), "false");
        assert.equal(view.$(".agcs-disclosure__panel").hidden, true);
        view.unmount();
      });

      it("stays open on a click outside and on Escape: it is page content", () => {
        const view = mount(lib, disclosure({ defaultOpen: true }));
        view.act(() => pointerDown(view.outside));
        view.act(() => keyDown(document, "Escape"));
        view.act(() => focusOut(view.$("input"), view.outside));
        assert.equal(view.$("button").getAttribute("aria-expanded"), "true");
        view.unmount();
      });

      it("can be controlled with open and onOpenChange", () => {
        const calls = [];
        const view = mount(lib, disclosure({ open: false, onOpenChange: (next) => calls.push(next) }));
        view.act(() => view.$("button").click());
        assert.deepEqual(calls, [true]);
        assert.equal(view.$("button").getAttribute("aria-expanded"), "false");
        view.unmount();
      });

      it("draws the chevron inside the button and hides it from assistive tech", () => {
        const view = mount(lib, disclosure());
        const icon = view.$("button svg.agcs-toggle__icon");
        assert.ok(icon);
        assert.equal(icon.getAttribute("aria-hidden"), "true");
        assert.equal(view.$("button .agcs-toggle__label").textContent, "Añadir persona");
        assert.equal(view.$("button").dataset.variant, "row");
        view.unmount();
      });

      it("has an icon-only variant that keeps its accessible name", () => {
        const view = mount(
          lib,
          h(
            lib.Disclosure,
            null,
            h(lib.DisclosureTrigger, { variant: "icon", "aria-label": "Desplegar Monitor" }),
            h(lib.DisclosurePanel, null, "Destinos"),
          ),
        );
        const button = view.$("button");
        assert.equal(button.dataset.variant, "icon");
        assert.equal(button.getAttribute("aria-label"), "Desplegar Monitor");
        assert.equal(view.$("button .agcs-toggle__label"), null);
        view.unmount();
      });
    });

    describe("Menu", () => {
      it("starts closed and opens with its button", () => {
        const view = mount(lib, menu());
        const button = view.$(".agcs-toggle");
        const panel = view.$(".agcs-menu__panel");
        assert.equal(button.getAttribute("aria-expanded"), "false");
        assert.equal(button.getAttribute("aria-controls"), panel.id);
        assert.equal(panel.hidden, true);
        assert.equal(panel.getAttribute("aria-label"), "Cuenta");
        assert.equal(button.dataset.variant, "field");
        view.act(() => button.click());
        assert.equal(button.getAttribute("aria-expanded"), "true");
        assert.equal(panel.hidden, false);
        assert.equal(view.$(".agcs-menu").dataset.state, "open");
        view.unmount();
      });

      it("records placement and alignment for the CSS", () => {
        const view = mount(lib, menu({ placement: "top", align: "stretch" }));
        const root = view.$(".agcs-menu");
        assert.equal(root.dataset.placement, "top");
        assert.equal(root.dataset.align, "stretch");
        view.unmount();
      });

      it("closes on a click outside", () => {
        const view = mount(lib, menu({ defaultOpen: true }));
        view.act(() => pointerDown(view.outside));
        assert.equal(view.$(".agcs-toggle").getAttribute("aria-expanded"), "false");
        assert.equal(view.$(".agcs-menu__panel").hidden, true);
        view.unmount();
      });

      it("stays open on a click inside the panel", () => {
        const view = mount(lib, menu({ defaultOpen: true }));
        view.act(() => pointerDown(view.$(".agcs-menu__panel")));
        assert.equal(view.$(".agcs-toggle").getAttribute("aria-expanded"), "true");
        view.unmount();
      });

      it("closes on Escape and returns focus to its button", () => {
        const view = mount(lib, menu({ defaultOpen: true }));
        const item = view.$(".agcs-menu__item");
        item.focus();
        view.act(() => keyDown(item, "Escape"));
        assert.equal(view.$(".agcs-toggle").getAttribute("aria-expanded"), "false");
        assert.ok(document.activeElement === view.$(".agcs-toggle"), "el foco vuelve al botón");
        view.unmount();
      });

      it("closes when focus leaves it with Tab", () => {
        const view = mount(lib, menu({ defaultOpen: true }));
        view.act(() => focusOut(view.$(".agcs-menu__item"), view.outside));
        assert.equal(view.$(".agcs-toggle").getAttribute("aria-expanded"), "false");
        view.unmount();
      });

      it("stays open when focus moves inside it", () => {
        const view = mount(lib, menu({ defaultOpen: true }));
        const [first, second] = view.container.querySelectorAll(".agcs-menu__item");
        view.act(() => focusOut(first, second));
        assert.equal(view.$(".agcs-toggle").getAttribute("aria-expanded"), "true");
        view.unmount();
      });

      it("runs onSelect, closes and returns focus when an item is chosen", () => {
        let chosen = 0;
        const view = mount(lib, menu({ defaultOpen: true, onAyuda: () => chosen++ }));
        const item = view.$(".agcs-menu__item");
        assert.equal(item.tagName, "BUTTON");
        assert.equal(item.getAttribute("type"), "button");
        view.act(() => item.click());
        assert.equal(chosen, 1);
        assert.equal(view.$(".agcs-toggle").getAttribute("aria-expanded"), "false");
        assert.ok(document.activeElement === view.$(".agcs-toggle"), "el foco vuelve al botón");
        view.unmount();
      });

      it("stays open when onSelect calls preventDefault", () => {
        const view = mount(lib, menu({ defaultOpen: true, onAyuda: (event) => event.preventDefault() }));
        view.act(() => view.$(".agcs-menu__item").click());
        assert.equal(view.$(".agcs-toggle").getAttribute("aria-expanded"), "true");
        view.unmount();
      });

      it("renders an item as another element or component with as", () => {
        const view = mount(lib, menu({ defaultOpen: true }));
        const link = view.$("a.agcs-menu__item");
        assert.ok(link);
        assert.equal(link.getAttribute("href"), "/legal/terminos");
        assert.equal(link.hasAttribute("type"), false);
        view.unmount();
      });

      it("keeps the menu open while a disclosure inside it toggles", () => {
        const view = mount(
          lib,
          menu({ defaultOpen: true }, [
            h(
              lib.Disclosure,
              { key: "ws" },
              h(lib.DisclosureTrigger, null, "Cambiar workspace"),
              h(lib.DisclosurePanel, null, h(lib.MenuItem, null, "Banco Andino")),
            ),
          ]),
        );
        const nested = view.$(".agcs-disclosure .agcs-toggle");
        view.act(() => pointerDown(nested));
        view.act(() => nested.click());
        assert.equal(nested.getAttribute("aria-expanded"), "true");
        assert.equal(view.$(".agcs-menu > .agcs-toggle").getAttribute("aria-expanded"), "true");
        view.act(() => view.$(".agcs-disclosure .agcs-menu__item").click());
        assert.equal(view.$(".agcs-menu > .agcs-toggle").getAttribute("aria-expanded"), "false");
        view.unmount();
      });

      it("removes its document listeners once closed", () => {
        const changes = [];
        const view = mount(lib, menu({ onOpenChange: (next) => changes.push(next) }));
        const button = view.$(".agcs-toggle");
        view.act(() => button.click());
        view.act(() => button.click());
        assert.deepEqual(changes, [true, false]);
        view.act(() => keyDown(document, "Escape"));
        view.act(() => pointerDown(view.outside));
        assert.deepEqual(changes, [true, false]);
        view.unmount();
      });
    });
  });
}
