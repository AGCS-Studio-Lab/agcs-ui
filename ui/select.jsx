"use client";
/**
 * Campo compartido con búsqueda, creación opcional y texto libre.
 * Copia también disclosure.jsx y select.css; importa el CSS después de los tokens.
 * Sin portal: la capa superior conserva el parentesco del diálogo y sus roles.
 */
import { forwardRef, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { ToggleIcon } from "./disclosure.jsx";

/**
 * @typedef {{ value: string | number, label: string, disabled?: boolean, hint?: string }} SelectOption
 * @typedef {object} SelectOwnProps
 * @property {string | number | null} [value] Valor controlado; null equivale a vacío.
 * @property {string | number | null} [defaultValue] Valor inicial sin controlar.
 * @property {(value: string, option: SelectOption | null) => void} [onChange] Vacío y texto libre llevan option=null.
 * @property {SelectOption[]} [options]
 * @property {string} [emptyLabel] Añade una opción que devuelve "".
 * @property {string} [noResultsLabel]
 * @property {(text: string) => void} [onCreate] La app crea y actualiza options/value.
 * @property {(text: string) => string} [createLabel]
 * @property {boolean} [freeText] Guarda cada edición; no exige elegir de la lista.
 * @property {(open: boolean) => void} [onOpenChange]
 * @typedef {SelectOwnProps & Omit<import("react").InputHTMLAttributes<HTMLInputElement>,
 * "value" | "defaultValue" | "onChange" | "type" | "children" | "role" | "size">} SelectProps
 */

/** @param {string} text */
const fold = (text) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const useClientLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export const Select = forwardRef(
  /** @param {SelectProps} props @param {import("react").ForwardedRef<HTMLInputElement>} ref */
  function Select({ value, defaultValue = "", onChange, options = [], placeholder = "Seleccionar",
    emptyLabel, noResultsLabel = "Sin resultados", onCreate, createLabel = (text) => `Crear «${text}»`,
    freeText = false, onOpenChange, disabled = false, required = false, name, id, className = "",
    onClick, onKeyDown, onBlur, ...inputProps }, ref) {
    const uid = useId();
    const listId = `${uid}-list`;
    const rootRef = useRef(/** @type {HTMLDivElement | null} */ (null));
    const inputRef = useRef(/** @type {HTMLInputElement | null} */ (null));
    const panelRef = useRef(/** @type {HTMLDivElement | null} */ (null));
    useImperativeHandle(ref, () => /** @type {HTMLInputElement} */ (inputRef.current));
    const [ownValue, setOwnValue] = useState(defaultValue);
    const selectedValue = String((value !== undefined ? value : ownValue) ?? "");
    const selected = options.find((option) => String(option.value) === selectedValue);
    const label = selected?.label ?? (freeText ? selectedValue : "");
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [edited, setEdited] = useState(false);
    const [active, setActive] = useState(0);
    const expanded = open && !disabled;
    // El texto libre se conserva al abrir, pero solo filtra tras una edición.
    const term = fold(freeText && !edited ? "" : query);
    const allRows = [
      ...(emptyLabel ? [{ value: "", label: emptyLabel }] : []),
      ...options,
    ];
    const rows = allRows.filter((option) => fold(`${option.label} ${option.hint ?? ""}`).includes(term));
    const canCreate = Boolean(onCreate && term && !options.some((option) => fold(option.label) === term));
    const enabled = rows.map((option, index) => option.disabled ? -1 : index).filter((index) => index !== -1);
    if (canCreate) enabled.push(rows.length);
    const activeRow = enabled[Math.min(active, enabled.length - 1)];
    const optionId = (/** @type {number} */ index) => `${uid}-option-${index}`;

    /** @param {boolean} next */
    function changeOpen(next) {
      if (next === open) return;
      setOpen(next);
      onOpenChange?.(next);
    }
    function close() {
      changeOpen(false);
      setQuery("");
    }
    /** @param {number} [initialActive] */
    function openList(initialActive = 0) {
      setQuery(freeText ? label : "");
      setEdited(false);
      // Al abrir se muestran todas las filas; conserva la elección si está habilitada.
      const selectedActive = allRows.filter((option) => !option.disabled)
        .findIndex((option) => String(option.value) === selectedValue);
      setActive(selectedActive === -1 ? initialActive : selectedActive);
      changeOpen(true);
    }
    /** @param {string} next @param {SelectOption | null} option */
    function commit(next, option) {
      if (value === undefined) setOwnValue(next);
      onChange?.(next, option);
    }
    /** @param {number} index */
    function choose(index) {
      if (disabled) return;
      if (index === rows.length && canCreate) onCreate?.(query.trim());
      else {
        const option = rows[index];
        if (!option || option.disabled) return;
        commit(String(option.value), option.value === "" ? null : option);
      }
      close();
      inputRef.current?.focus();
    }
    function toggle() {
      if (disabled) return;
      inputRef.current?.focus();
      if (expanded) close();
      else openList();
    }

    // El listener lee el cierre vigente sin desmontarse al escribir.
    const closeRef = useRef(close);
    closeRef.current = close;
    useEffect(() => {
      if (!expanded) return;
      const outside = (/** @type {PointerEvent} */ event) => {
        if (event.target instanceof Node && !rootRef.current?.contains(event.target)) closeRef.current();
      };
      // Radix escucha Escape en captura en document. Lo consume el campo
      // antes, en window, para que el primer Escape cierre solo la lista.
      const escape = (/** @type {KeyboardEvent} */ event) => {
        if (event.key !== "Escape" || event.isComposing || event.target !== inputRef.current) return;
        event.preventDefault(); event.stopPropagation(); closeRef.current();
      };
      document.addEventListener("pointerdown", outside, true);
      window.addEventListener("keydown", escape, true);
      return () => {
        document.removeEventListener("pointerdown", outside, true);
        window.removeEventListener("keydown", escape, true);
      };
    }, [expanded]);
    useEffect(() => { if (disabled && open) closeRef.current(); }, [disabled, open]);
    useEffect(() => {
      // La consulta de búsqueda nunca satisface un valor obligatorio sin elegir.
      inputRef.current?.setCustomValidity(required && !selectedValue ? "Selecciona una opción" : "");
    }, [required, selectedValue]);

    useClientLayoutEffect(() => {
      const input = inputRef.current;
      if (expanded && freeText && input) input.setSelectionRange(input.value.length, input.value.length);
    }, [expanded, freeText]);

    useClientLayoutEffect(() => {
      const panel = panelRef.current;
      const field = inputRef.current?.parentElement;
      if (!expanded || !panel || !field) return;
      // setAttribute evita advertencias de React 18 sobre props DOM recientes.
      const topLayer = typeof panel.showPopover === "function";
      if (!topLayer) return;
      panel.setAttribute("popover", "manual");
      panel.dataset.layer = "top";
      panel.showPopover();
      const reposition = () => {
        const rect = field.getBoundingClientRect();
        const below = Math.max(0, window.innerHeight - rect.bottom - 4);
        const above = Math.max(0, rect.top - 4);
        const flip = below < Math.min(320, panel.scrollHeight) && above > below;
        const available = flip ? above : below;
        Object.assign(panel.style, {
          position: "fixed", width: `${rect.width}px`, minWidth: `${rect.width}px`,
          maxHeight: `${Math.min(320, available)}px`,
          left: `${Math.max(0, Math.min(rect.left, window.innerWidth - rect.width))}px`,
          top: flip ? "auto" : `${rect.bottom + 4}px`,
          bottom: flip ? `${window.innerHeight - rect.top + 4}px` : "auto",
        });
      };
      reposition();
      window.addEventListener("scroll", reposition, true);
      window.addEventListener("resize", reposition);
      const observer = typeof ResizeObserver === "function" ? new ResizeObserver(reposition) : null;
      observer?.observe(field);
      return () => {
        window.removeEventListener("scroll", reposition, true);
        window.removeEventListener("resize", reposition);
        observer?.disconnect();
        panel.hidePopover();
        panel.removeAttribute("popover");
        delete panel.dataset.layer;
        panel.removeAttribute("style");
      };
    }, [expanded, query, rows.length]);
    useClientLayoutEffect(() => {
      if (expanded && activeRow !== undefined) document.getElementById(optionId(activeRow))?.scrollIntoView?.({ block: "nearest" });
    }, [expanded, activeRow, query]);

    return (
      <div ref={rootRef} className={`agcs-select ${className}`} data-state={expanded ? "open" : "closed"}>
        {name && <input type="hidden" name={name} value={selectedValue} disabled={disabled} />}
        <div className="agcs-select__field" data-disabled={disabled || undefined}
          onClick={(event) => { if (event.target === event.currentTarget) toggle(); }}>
          <input {...inputProps} id={id} ref={inputRef} type="text" role="combobox"
            className="agcs-select__input" autoComplete="off" disabled={disabled}
            required={required && !selectedValue} aria-required={required || undefined}
            aria-expanded={expanded} aria-controls={listId} aria-autocomplete="list" aria-haspopup="listbox"
            aria-activedescendant={expanded && activeRow !== undefined ? optionId(activeRow) : undefined}
            placeholder={expanded && !freeText && !query ? (selected?.label ?? placeholder) : placeholder}
            value={expanded ? query : label}
            onClick={(event) => { onClick?.(event); if (!event.defaultPrevented && !expanded) toggle(); }}
            onChange={(event) => {
              setQuery(event.target.value); setEdited(true); setActive(0); changeOpen(true);
              if (freeText) commit(event.target.value, null);
            }}
            onBlur={(event) => { onBlur?.(event); if (!rootRef.current?.contains(event.relatedTarget)) close(); }}
            onKeyDown={(event) => {
              onKeyDown?.(event);
              if (event.defaultPrevented || event.nativeEvent.isComposing) return;
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                const direction = event.key === "ArrowDown" ? 1 : -1;
                if (!expanded) openList(direction === 1 ? 0 : Math.max(0, enabled.length - 1));
                else setActive(enabled.length ? (active + direction + enabled.length) % enabled.length : 0);
              } else if (expanded && (event.key === "Home" || event.key === "End")) {
                event.preventDefault(); setActive(event.key === "Home" ? 0 : Math.max(0, enabled.length - 1));
              } else if (expanded && event.key === "Enter") {
                event.preventDefault(); if (activeRow !== undefined) choose(activeRow);
              } else if (expanded && event.key === "Escape") {
                event.preventDefault(); event.stopPropagation(); close();
              } else if (event.key === "Tab") close();
            }} />
          <span className="agcs-select__chevron" aria-hidden="true"
            onMouseDown={(event) => event.preventDefault()} onClick={toggle}><ToggleIcon /></span>
        </div>
        <div id={listId} ref={panelRef} role="listbox" className="agcs-select__panel" hidden={!expanded}
          aria-label={inputProps["aria-label"] ?? (typeof placeholder === "string" ? placeholder : "Opciones")}
          aria-labelledby={inputProps["aria-labelledby"]}
          onPointerDown={(event) => event.preventDefault()} onMouseDown={(event) => event.preventDefault()}>
          {rows.map((option, index) => (
            <div key={`${option.value}-${index}`} id={optionId(index)} role="option"
              className="agcs-select__option" aria-selected={String(option.value) === selectedValue}
              aria-disabled={option.disabled || undefined} data-active={index === activeRow || undefined}
              onPointerMove={() => { if (!option.disabled) setActive(enabled.indexOf(index)); }}
              onClick={() => choose(index)}>
              <span>{option.label}</span>{option.hint && <small className="agcs-select__hint">{option.hint}</small>}
            </div>
          ))}
          {canCreate && <div id={optionId(rows.length)} role="option" aria-selected="false"
            className="agcs-select__option" data-active={activeRow === rows.length || undefined}
            onPointerMove={() => setActive(enabled.length - 1)} onClick={() => choose(rows.length)}>{createLabel(query.trim())}</div>}
          {!rows.length && !canCreate && <div className="agcs-select__empty" role="status">{noResultsLabel}</div>}
        </div>
      </div>
    );
  },
);
