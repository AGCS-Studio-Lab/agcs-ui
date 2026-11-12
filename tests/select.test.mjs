// Contrato de Select: el mismo DOM y comportamiento con React 18 y 19.
import assert from "node:assert/strict";
import { before, describe, it } from "node:test";
import { REACT_VERSIONS, loadWith, mount, keyDown, pointerDown, focusOut } from "./helpers/react-dom-env.mjs";

const options = [{ value: "a", label: "Árbol", hint: "México" },
  { value: "b", label: "Bloqueado", disabled: true }, { value: "c", label: "Café" }];
function type(view, value) {
  const input = view.$('[role="combobox"]');
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(input, value);
  view.act(() => input.dispatchEvent(new window.Event("input", { bubbles: true })));
}
for (const version of REACT_VERSIONS) {
  describe(`Select · ${version.name}`, () => {
    let lib;
    before(async () => { lib = await loadWith(version); });
    const render = (props = {}) => mount(lib, lib.createElement(lib.Select, { options, "aria-label": "Área", ...props }));
    const renderLabeled = (explicit = false, props = {}) => {
      const select = lib.createElement(lib.Select, { options, id: "area", name: "area", ...props });
      const text = lib.createElement("span", { "data-label-text": true }, "Área");
      return mount(lib, explicit
        ? lib.createElement("div", null, lib.createElement("label", { htmlFor: "area" }, text), select)
        : lib.createElement("label", null, text, select));
    };
    async function click(view, target, detail = 1) {
      const event = new window.MouseEvent("click", { bubbles: true, cancelable: true, detail });
      view.act(() => target.dispatchEvent(event));
      await Promise.resolve();
      return event;
    }
    for (const explicit of [false, true]) {
      const labeling = explicit ? "label for=id" : "wrapping label";
      it(`${labeling}: option clicks commit and cancel label activation`, async () => {
        const changes = [];
        const view = renderLabeled(explicit, { onChange: (...args) => changes.push(args) });
        const input = view.$('[role="combobox"]');
        let clicks = 0;
        input.addEventListener("click", () => clicks++);
        try {
          await click(view, input);
          clicks = 0;
          const event = await click(view, view.$('[role="option"] span'));
          assert.equal(event.defaultPrevented, true);
          assert.equal(clicks, 0);
          assert.equal(input.getAttribute("aria-expanded"), "false");
          assert.equal(view.$('[role="listbox"]').hidden, true);
          assert.equal(input.value, "Árbol");
          assert.equal(view.$('[type="hidden"]').value, "a");
          assert.deepEqual(changes, [["a", options[0]]]);
          assert.equal(document.activeElement, input);
        } finally { view.unmount(); }
      });
      for (const selector of [".agcs-select__chevron svg", ".agcs-select__field"]) {
        it(`${labeling}: ${selector} toggles once without forwarding an input click`, async () => {
          const changes = [];
          const view = renderLabeled(explicit, { onOpenChange: (open) => changes.push(open) });
          const input = view.$('[role="combobox"]');
          let clicks = 0;
          input.addEventListener("click", () => clicks++);
          try {
            for (const expanded of [true, false]) {
              const target = view.$(selector);
              view.act(() => pointerDown(target));
              await Promise.resolve();
              const down = new window.MouseEvent("mousedown", { bubbles: true, cancelable: true });
              view.act(() => {
                target.dispatchEvent(down);
                // jsdom no ejecuta el cambio de foco por defecto de mousedown.
                if (!down.defaultPrevented) input.blur();
              });
              assert.equal(down.defaultPrevented, true);
              const event = await click(view, target);
              assert.equal(event.defaultPrevented, true);
              assert.equal(clicks, 0);
              assert.equal(input.getAttribute("aria-expanded"), String(expanded));
              assert.equal(view.$('[role="listbox"]').hidden, !expanded);
              assert.equal(document.activeElement, input);
            }
            assert.deepEqual(changes, [true, false]);
          } finally { view.unmount(); }
        });
      }
      it(`${labeling}: creation and panel clicks cancel label activation`, async () => {
        const created = [];
        const view = renderLabeled(explicit, { onCreate: (text) => created.push(text) });
        const input = view.$('[role="combobox"]');
        let clicks = 0;
        input.addEventListener("click", () => clicks++);
        try {
          type(view, " Nuevo ");
          const event = await click(view, view.$('[role="option"]'));
          assert.equal(event.defaultPrevented, true);
          assert.equal(clicks, 0);
          assert.deepEqual(created, ["Nuevo"]);
          assert.equal(input.getAttribute("aria-expanded"), "false");
          assert.equal(view.$('[role="listbox"]').hidden, true);
          assert.equal(view.$('[type="hidden"]').value, "");
          assert.equal(document.activeElement, input);
          type(view, "ar");
          assert.equal((await click(view, view.$('[role="listbox"]'))).defaultPrevented, true);
          assert.equal(clicks, 0);
          assert.equal(input.getAttribute("aria-expanded"), "true");
        } finally { view.unmount(); }
        const empty = renderLabeled(explicit, { options: [] });
        try {
          await click(empty, empty.$('[role="combobox"]'));
          let forwarded = 0;
          empty.$('[role="combobox"]').addEventListener("click", () => forwarded++);
          assert.equal((await click(empty, empty.$('[role="status"]'))).defaultPrevented, true);
          assert.equal(forwarded, 0);
          assert.equal(empty.$('[role="combobox"]').getAttribute("aria-expanded"), "true");
        } finally { empty.unmount(); }
      });
      it(`${labeling}: label text toggles without an intermediate close or blur`, async () => {
        const changes = [];
        let blurs = 0;
        const view = renderLabeled(explicit, { onOpenChange: (open) => changes.push(open), onBlur: () => blurs++ });
        const input = view.$('[role="combobox"]');
        const text = view.$('[data-label-text]');
        try {
          for (const expanded of [true, false]) {
            view.act(() => pointerDown(text));
            await Promise.resolve();
            assert.equal(input.getAttribute("aria-expanded"), String(!expanded));
            const down = new window.MouseEvent("mousedown", { bubbles: true, cancelable: true });
            view.act(() => {
              text.dispatchEvent(down);
              // jsdom no mueve el foco por mousedown; reproduce el blur nativo si procede.
              if (!down.defaultPrevented) input.blur();
            });
            assert.equal(down.defaultPrevented, true);
            await click(view, text);
            assert.equal(input.getAttribute("aria-expanded"), String(expanded));
            assert.equal(document.activeElement, input);
          }
          assert.equal(blurs, 0);
          assert.deepEqual(changes, [true, false]);
          // Un clic de tecnología de asistencia no necesita un pointerdown previo.
          await click(view, input, 0);
          assert.equal(input.getAttribute("aria-expanded"), "true");
          await click(view, input, 0);
          assert.equal(input.getAttribute("aria-expanded"), "true");
          await click(view, text, 0);
          assert.equal(input.getAttribute("aria-expanded"), "false");
        } finally { view.unmount(); }
      });
    }
    it("declares the editable combobox, labels, form value and forwarded input ref", () => {
      const ref = { current: null };
      const view = render({ ref, id: "area", name: "area", defaultValue: "c", required: true,
        "aria-labelledby": "label", "aria-describedby": "hint", "aria-invalid": true });
      const input = view.$("#area");
      assert.equal(ref.current, input);
      assert.equal(input.tagName, "INPUT");
      assert.equal(input.value, "Café");
      for (const [attr, value] of Object.entries({ role: "combobox", "aria-expanded": "false", "aria-autocomplete": "list",
        "aria-haspopup": "listbox", "aria-labelledby": "label", "aria-describedby": "hint", "aria-invalid": "true", "aria-required": "true" })) assert.equal(input.getAttribute(attr), value);
      assert.equal(input.getAttribute("aria-controls"), view.$('[role="listbox"]').id);
      assert.equal(view.$('[type="hidden"]').name, "area");
      assert.equal(view.$('[type="hidden"]').value, "c");
      assert.equal(view.$('[role="listbox"]').hidden, true);
      view.unmount(); assert.equal(ref.current, null);
    });
    it("opens by click, closes by chevron and reports each change once", () => {
      const calls = [];
      const view = render({ onOpenChange: (open) => calls.push(open) });
      view.act(() => view.$("input").click());
      assert.equal(view.$("input").getAttribute("aria-expanded"), "true");
      assert.equal(document.activeElement, view.$("input"));
      view.act(() => view.$("svg").dispatchEvent(new window.MouseEvent("click", { bubbles: true })));
      assert.deepEqual(calls, [true, false]); view.unmount();
    });
    it("opens on the current enabled choice and Enter preserves its value", () => {
      const choices = [...options, { value: "d", label: "Delta" }];
      for (const freeText of [false, true]) {
        const calls = [];
        const view = render({ options: choices, name: "area", defaultValue: "c", freeText,
          onChange: (...args) => calls.push(args) });
        const input = view.$('[role="combobox"]');
        const selected = view.$('[aria-selected="true"]');
        const scrolled = [];
        selected.scrollIntoView = (settings) => scrolled.push(settings);
        try {
          for (const open of [() => input.click(), () => keyDown(input, "ArrowDown"),
            () => keyDown(input, "ArrowUp"), () => view.$(".agcs-select__chevron").click(),
            () => view.$(".agcs-select__field").click()]) {
            view.act(open);
            assert.equal(input.getAttribute("aria-activedescendant"), selected.id);
            assert.equal(input.value, freeText ? "Café" : "");
            assert.equal(view.container.querySelectorAll('[role="option"]').length, choices.length);
            assert.deepEqual(scrolled.at(-1), { block: "nearest" });
            view.act(() => keyDown(input, "Enter"));
            assert.equal(input.value, "Café");
            assert.equal(view.$('[type="hidden"]').value, "c");
          }
          assert.equal(scrolled.length, 5);
          assert.deepEqual(calls, Array.from({ length: 5 }, () => ["c", choices[2]]));
        } finally { view.unmount(); }
      }
    });
    it("opens past emptyLabel on the current choice and Enter does not clear it", () => {
      const calls = [];
      const view = render({ name: "area", defaultValue: "c", emptyLabel: "Sin área",
        onChange: (...args) => calls.push(args) });
      const input = view.$('[role="combobox"]');
      try {
        view.act(() => keyDown(input, "ArrowDown"));
        assert.equal(input.getAttribute("aria-activedescendant"), view.$('[aria-selected="true"]').id);
        view.act(() => keyDown(input, "Enter"));
        assert.deepEqual(calls, [["c", options[2]]]);
        assert.equal(input.value, "Café");
        assert.equal(view.$('[type="hidden"]').value, "c");
      } finally { view.unmount(); }
    });
    it("keeps first/last enabled opening fallbacks when there is no enabled match", () => {
      for (const defaultValue of ["", "missing", "b"]) {
        const view = render({ defaultValue });
        const input = view.$('[role="combobox"]');
        const rows = view.container.querySelectorAll('[role="option"]');
        try {
          for (const [open, expected] of [[() => input.click(), rows[0]],
            [() => keyDown(input, "ArrowDown"), rows[0]], [() => keyDown(input, "ArrowUp"), rows[2]]]) {
            view.act(open);
            assert.equal(input.getAttribute("aria-activedescendant"), expected.id);
            view.act(() => keyDown(input, "Escape"));
          }
        } finally { view.unmount(); }
      }
    });
    it("treats emptyLabel as the current choice for an empty value", () => {
      const view = render({ emptyLabel: "Sin área" });
      const input = view.$('[role="combobox"]');
      try {
        view.act(() => keyDown(input, "ArrowUp"));
        assert.equal(input.getAttribute("aria-activedescendant"), view.$('[aria-selected="true"]').id);
      } finally { view.unmount(); }
    });
    it("keeps the query, filtered options and active row when clicking the open input", () => {
      const view = render({ defaultValue: "c", options: [
        { value: "a", label: "Beta" }, { value: "b", label: "Berenjena" }, options[2],
      ] });
      const input = view.$('[role="combobox"]');
      const labels = () => Array.from(view.container.querySelectorAll('[role="option"]'), (option) => option.textContent);
      try {
        view.act(() => input.click());
        type(view, "be");
        view.act(() => keyDown(input, "ArrowDown"));
        const active = input.getAttribute("aria-activedescendant");
        assert.deepEqual(labels(), ["Beta", "Berenjena"]);
        input.setSelectionRange(1, 1);
        view.act(() => input.click());
        assert.equal(input.getAttribute("aria-expanded"), "true");
        assert.equal(input.value, "be");
        assert.deepEqual(labels(), ["Beta", "Berenjena"]);
        assert.equal(input.getAttribute("aria-activedescendant"), active);
        assert.equal(input.selectionStart, 1);
        view.act(() => view.$(".agcs-select__chevron").click());
        assert.equal(input.getAttribute("aria-expanded"), "false");
      } finally { view.unmount(); }
    });
    it("shows the selected label as the open search placeholder without changing the list label", () => {
      for (const defaultValue of ["c", ""]) {
        const view = render({ defaultValue, placeholder: "Elige un área", "aria-label": undefined });
        try {
          const input = view.$('[role="combobox"]');
          view.act(() => input.click());
          assert.equal(input.value, "");
          assert.equal(input.placeholder, defaultValue ? "Café" : "Elige un área");
          assert.equal(view.$('[role="listbox"]').getAttribute("aria-label"), "Elige un área");
          assert.equal(view.container.querySelectorAll('[role="option"]').length, options.length);
          type(view, "ar");
          assert.equal(view.$('[role="option"]').textContent, "ÁrbolMéxico");
        } finally { view.unmount(); }
      }
    });
    it("opens free text with the current text, an end caret and all options until edited", () => {
      const calls = [];
      const view = render({ name: "org", defaultValue: "Mi organización", freeText: true,
        onChange: (...args) => calls.push(args) });
      const input = view.$('[role="combobox"]');
      try {
        for (const open of [() => input.click(), () => keyDown(input, "ArrowDown"),
          () => keyDown(input, "ArrowUp"), () => view.$(".agcs-select__chevron").click()]) {
          view.act(open);
          assert.equal(input.getAttribute("aria-expanded"), "true");
          assert.equal(input.value, "Mi organización");
          assert.equal(input.selectionStart, input.value.length);
          assert.equal(input.selectionEnd, input.value.length);
          assert.equal(view.container.querySelectorAll('[role="option"]').length, options.length);
          view.act(() => keyDown(input, "Escape"));
        }
        assert.deepEqual(calls, []);
        view.act(() => input.click());
        const edited = input.value.slice(0, input.selectionStart) + " SA" + input.value.slice(input.selectionEnd);
        type(view, edited);
        assert.equal(input.value, "Mi organización SA");
        assert.equal(view.$('[type="hidden"]').value, "Mi organización SA");
        assert.deepEqual(calls, [["Mi organización SA", null]]);
        assert.equal(view.container.querySelectorAll('[role="option"]').length, 0);
        type(view, "ca");
        assert.equal(view.$('[role="option"]').textContent, "Café");
        type(view, "");
        assert.equal(input.value, "");
        assert.equal(view.container.querySelectorAll('[role="option"]').length, options.length);
      } finally { view.unmount(); }
    });
    it("edits and reopens controlled free text using the full accepted value", () => {
      const calls = [];
      function Controlled() {
        const [value, setValue] = lib.useState("Mi organización");
        return lib.createElement(lib.Select, { options, value, freeText: true,
          onChange: (next, option) => { calls.push([next, option]); setValue(next); } });
      }
      const view = mount(lib, lib.createElement(Controlled));
      const input = view.$('[role="combobox"]');
      try {
        view.act(() => input.click());
        type(view, input.value + " SA");
        assert.deepEqual(calls, [["Mi organización SA", null]]);
        view.act(() => keyDown(input, "Escape"));
        view.act(() => keyDown(input, "ArrowDown"));
        assert.equal(input.value, "Mi organización SA");
        assert.equal(view.container.querySelectorAll('[role="option"]').length, options.length);
      } finally { view.unmount(); }
    });
    it("filters labels and hints without case or accents; empty results cannot be selected", () => {
      const view = render(); type(view, "ARB");
      assert.equal(view.$('[role="option"]').textContent, "ÁrbolMéxico");
      assert.equal(view.container.querySelectorAll('[role="option"]').length, 1);
      type(view, "mexico"); assert.ok(view.$('[role="option"]'));
      type(view, "zz"); assert.equal(view.$('[role="status"]').textContent, "Sin resultados");
      assert.equal(view.$("input").hasAttribute("aria-activedescendant"), false);
      view.act(() => keyDown(view.$("input"), "Enter"));
      assert.equal(view.$("input").getAttribute("aria-expanded"), "true"); view.unmount();
    });
    it("opens with arrows, skips disabled options, handles Home/End and selects with Enter", () => {
      const calls = [];
      const view = render({ onChange: (...args) => calls.push(args) });
      const input = view.$("input");
      const active = () => document.getElementById(input.getAttribute("aria-activedescendant"));
      view.act(() => keyDown(input, "ArrowDown")); assert.equal(active().textContent, "ÁrbolMéxico");
      view.act(() => keyDown(input, "ArrowDown")); assert.equal(active().textContent, "Café");
      view.act(() => keyDown(input, "Home")); assert.equal(active().textContent, "ÁrbolMéxico");
      view.act(() => keyDown(input, "End")); assert.equal(active().textContent, "Café");
      view.act(() => keyDown(input, "ArrowUp")); assert.equal(active().textContent, "ÁrbolMéxico");
      view.act(() => keyDown(input, "Enter")); assert.deepEqual(calls, [["a", options[0]]]);
      assert.equal(input.value, "Árbol"); assert.equal(document.activeElement, input);
      view.act(() => keyDown(input, "ArrowUp")); assert.equal(active().textContent, "ÁrbolMéxico");
      view.act(() => keyDown(input, "ArrowUp")); assert.equal(active().textContent, "Café"); view.unmount();
    });
    it("Escape, Tab, blur and outside pointerdown restore the selection without changing it", () => {
      const calls = [];
      const view = render({ defaultValue: "c", onChange: (...args) => calls.push(args) });
      for (const close of [() => keyDown(view.$("input"), "Escape"), () => keyDown(view.$("input"), "Tab"),
        () => pointerDown(view.outside), () => focusOut(view.$("input"), view.outside)]) {
        type(view, "ar"); view.act(close);
        assert.equal(view.$("input").getAttribute("aria-expanded"), "false");
        assert.equal(view.$("input").value, "Café");
      }
      assert.deepEqual(calls, []); view.unmount();
    });
    it("consumes Escape before a dialog's document capture listener, then releases it", () => {
      let dismissed = 0;
      const dialogEscape = (event) => { if (event.key === "Escape") dismissed++; };
      document.addEventListener("keydown", dialogEscape, true);
      const view = render({ defaultValue: "c" });
      try {
        type(view, "ar"); view.act(() => keyDown(view.$("input"), "Escape"));
        assert.equal(dismissed, 0); assert.equal(view.$("input").value, "Café");
        view.act(() => keyDown(view.$("input"), "Escape")); assert.equal(dismissed, 1);
      } finally { view.unmount(); document.removeEventListener("keydown", dialogEscape, true); }
    });
    it("validates the committed value rather than the search query", () => {
      const view = render({ name: "area", required: true });
      const input = view.$('[role="combobox"]');
      assert.equal(input.checkValidity(), false);
      type(view, "zz"); assert.equal(input.checkValidity(), false);
      type(view, "ar"); view.act(() => keyDown(input, "Enter"));
      assert.equal(input.checkValidity(), true);
      view.act(() => keyDown(input, "ArrowDown"));
      assert.equal(input.value, ""); assert.equal(input.checkValidity(), true); view.unmount();
    });
    it("keeps input focus on pointerdown in the panel and ignores disabled choices", () => {
      const view = render(); view.act(() => view.$("input").click());
      view.act(() => pointerDown(view.$('[aria-disabled="true"]')));
      assert.equal(document.activeElement, view.$("input"));
      view.act(() => view.$('[aria-disabled="true"]').click());
      assert.equal(view.$("input").getAttribute("aria-expanded"), "true");
      view.act(() => view.$('[role="option"]').click());
      assert.equal(view.$("input").value, "Árbol"); view.unmount();
    });
    it("offers creation only for new normalized labels and calls onCreate with trimmed text", () => {
      const created = [];
      const view = render({ onCreate: (text) => created.push(text) });
      type(view, " arbol "); assert.equal(view.container.querySelectorAll('[role="option"]').length, 1);
      type(view, " Nuevo "); assert.equal(view.$('[role="option"]').textContent, "Crear «Nuevo»");
      view.act(() => keyDown(view.$("input"), "Enter")); assert.deepEqual(created, ["Nuevo"]); view.unmount();
      const custom = render({ onCreate() {}, createLabel: (text) => `Añadir ${text}` });
      type(custom, "Otro"); assert.equal(custom.$('[role="option"]').textContent, "Añadir Otro"); custom.unmount();
    });
    it("preserves free text on blur, Escape and outside, saving each edit", () => {
      const calls = [];
      const view = render({ name: "org", freeText: true, onChange: (...args) => calls.push(args) });
      type(view, "Mi organización"); view.act(() => pointerDown(view.outside));
      assert.equal(view.$('[role="combobox"]').value, "Mi organización");
      assert.equal(view.$('[type="hidden"]').value, "Mi organización");
      type(view, "Otra"); view.act(() => keyDown(view.$('[role="combobox"]'), "Escape"));
      assert.equal(view.$('[role="combobox"]').value, "Otra");
      assert.deepEqual(calls, [["Mi organización", null], ["Otra", null]]); view.unmount();
    });
    it("emptyLabel clears to the empty string and submits a native form value", () => {
      const calls = [];
      const view = mount(lib, lib.createElement("form", null, lib.createElement(lib.Select,
        { options, name: "area", defaultValue: "a", emptyLabel: "Sin área", onChange: (...args) => calls.push(args) })));
      assert.equal(new window.FormData(view.$("form")).get("area"), "a");
      view.act(() => keyDown(view.$('[role="combobox"]'), "ArrowDown"));
      view.act(() => keyDown(view.$('[role="combobox"]'), "Home"));
      view.act(() => keyDown(view.$('[role="combobox"]'), "Enter"));
      assert.deepEqual(calls, [["", null]]);
      assert.equal(new window.FormData(view.$("form")).get("area"), ""); view.unmount();
    });
    it("keeps controlled values until the parent accepts them and supports null", () => {
      const calls = [];
      const view = render({ value: "c", onChange: (...args) => calls.push(args) });
      view.act(() => keyDown(view.$("input"), "ArrowDown"));
      view.act(() => keyDown(view.$("input"), "Home"));
      view.act(() => keyDown(view.$("input"), "Enter"));
      assert.equal(view.$("input").value, "Café"); assert.equal(calls[0][0], "a"); view.unmount();
      function Controlled() {
        const [value, setValue] = lib.useState(null);
        return lib.createElement(lib.Select, { options, value, onChange: setValue });
      }
      const accepted = mount(lib, lib.createElement(Controlled));
      accepted.act(() => keyDown(accepted.$("input"), "ArrowDown"));
      accepted.act(() => keyDown(accepted.$("input"), "Enter"));
      assert.equal(accepted.$("input").value, "Árbol"); accepted.unmount();
    });
    it("disabled fields cannot open and do not submit", () => {
      const view = render({ name: "area", disabled: true, defaultValue: "a" });
      assert.equal(view.$('[role="combobox"]').disabled, true);
      assert.equal(view.$('[type="hidden"]').disabled, true);
      view.act(() => view.$("svg").dispatchEvent(new window.MouseEvent("click", { bubbles: true })));
      assert.equal(view.$('[role="combobox"]').getAttribute("aria-expanded"), "false"); view.unmount();
    });
    it("uses a manual top layer, fixed viewport bounds, flipping and scroll/resize updates", () => {
      const proto = window.HTMLElement.prototype;
      let shown = 0, hidden = 0;
      proto.showPopover = function () { shown++; };
      proto.hidePopover = function () { hidden++; };
      const view = render();
      const field = view.$(".agcs-select__field");
      let top = window.innerHeight - 80;
      field.getBoundingClientRect = () => ({ top, bottom: top + 44, left: 20, width: 200 });
      Object.defineProperty(view.$('[role="listbox"]'), "scrollHeight", { value: 160 });
      try {
        view.act(() => view.$("input").click());
        const panel = view.$('[role="listbox"]');
        assert.equal(panel.parentElement, view.$(".agcs-select"));
        assert.equal(panel.getAttribute("popover"), "manual");
        assert.equal(panel.style.position, "fixed"); assert.equal(panel.style.width, "200px");
        assert.equal(panel.style.bottom, "84px"); assert.equal(panel.style.maxHeight, "320px");
        top = 10; view.act(() => field.dispatchEvent(new window.Event("scroll")));
        assert.equal(panel.style.top, "58px");
        top = 20; view.act(() => window.dispatchEvent(new window.Event("resize")));
        assert.equal(panel.style.top, "68px");
        view.act(() => keyDown(view.$("input"), "Escape"));
        assert.equal(shown, hidden); assert.equal(panel.hasAttribute("popover"), false);
      } finally { view.unmount(); delete proto.showPopover; delete proto.hidePopover; }
    });
    it("falls back without Popover API and emits no React warnings", () => {
      const warnings = [];
      const original = console.error;
      console.error = (...args) => warnings.push(args);
      try {
        const view = render({ ref: () => {} });
        type(view, "ca");
        assert.equal(view.$('[role="listbox"]').hasAttribute("popover"), false);
        view.act(() => keyDown(view.$("input"), "Enter")); view.unmount();
      } finally { console.error = original; }
      assert.deepEqual(warnings, []);
    });
  });
}
