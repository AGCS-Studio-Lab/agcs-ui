"use client";
/**
 * Menu and disclosure — the one toggle of the AGCS apps. Rules in README.md
 * ("Menú y disclosure") and the look in ui/disclosure.css, which the host app
 * imports once.
 *
 *   Disclosure  opens inside the page flow and pushes what follows. Only its
 *               button closes it: it is page content. Use it for everything
 *               except the two cases below, including a list inside a menu.
 *   Menu        an anchored panel for links and account actions only: the
 *               account and workspace menu, and the mobile bar menu. It closes
 *               on its button, a click outside, Escape, Tab out, or choosing
 *               an item. Never content, forms, help or a record's detail.
 *
 * Both follow the WAI-ARIA disclosure pattern (button with aria-expanded and
 * aria-controls, panel hidden when closed), so a menu is walked with Tab.
 *
 * No dependencies besides React 18 or 19. Types live in JSDoc: management
 * reads them through `allowJs`, DRIs checks this file with `checkJs`.
 *
 * Vendored file — canonical source: agcs-ui/ui/disclosure.jsx.
 */
import { createContext, useCallback, useContext, useEffect, useId, useRef, useState } from "react";

/**
 * @typedef {import("react").ReactNode} ReactNode
 * @typedef {"row" | "field" | "inline" | "icon"} ToggleVariant
 *
 * @typedef {object} ToggleState
 * @property {boolean} open
 * @property {(next: boolean) => void} setOpen
 * @property {string} panelId
 * @property {import("react").RefObject<HTMLButtonElement | null>} triggerRef
 *
 * @typedef {object} OpenProps
 * @property {boolean} [open] Controlled state. Pair it with onOpenChange.
 * @property {boolean} [defaultOpen] Initial state when uncontrolled. Default false.
 * @property {(open: boolean) => void} [onOpenChange] Called with the next state.
 * @property {string} [className]
 * @property {ReactNode} [children]
 */

/** @type {import("react").Context<ToggleState | null>} */
const ToggleContext = createContext(/** @type {ToggleState | null} */ (null));
/** @type {import("react").Context<{ close: (returnFocus: boolean) => void } | null>} */
const MenuContext = createContext(/** @type {{ close: (returnFocus: boolean) => void } | null} */ (null));

/** @param {Array<string | false | null | undefined>} parts */
function classes(...parts) {
  return parts.filter(Boolean).join(" ");
}

/**
 * @param {OpenProps} props
 * @returns {ToggleState}
 */
function useToggleState({ open, defaultOpen = false, onOpenChange }) {
  const [own, setOwn] = useState(defaultOpen);
  const controlled = open !== undefined;
  const current = controlled ? open : own;
  const panelId = useId();
  const triggerRef = useRef(/** @type {HTMLButtonElement | null} */ (null));
  const setOpen = useCallback(
    /** @param {boolean} next */
    (next) => {
      if (!controlled) setOwn(next);
      onOpenChange?.(next);
    },
    [controlled, onOpenChange],
  );
  return { open: current, setOpen, panelId, triggerRef };
}

/** @param {string} name */
function useToggle(name) {
  const state = useContext(ToggleContext);
  if (!state) throw new Error(`${name} va dentro de <Disclosure> o <Menu>.`);
  return state;
}

/** The chevron: Lucide's chevron-down at 1.5 px, in ink, drawn here so it does not depend on each app's Lucide. */
export function ToggleIcon({ className = "" }) {
  return (
    <svg
      className={classes("agcs-toggle__icon", className)}
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/**
 * @typedef {object} TriggerOwnProps
 * @property {ToggleVariant} [variant]
 *   row: full width with a hairline below (in the page and inside a menu).
 *   field: full width with a border (the account and workspace menu).
 *   inline: text and chevron, as wide as the text.
 *   icon: the chevron alone, 44 × 44; needs aria-label.
 * @property {string} [className]
 * @property {ReactNode} [children]
 *
 * @typedef {TriggerOwnProps & Omit<import("react").ButtonHTMLAttributes<HTMLButtonElement>, "children">} TriggerProps
 */

/**
 * @param {TriggerProps & { name: string }} props
 */
function Trigger({ name, variant = "row", className, children, onClick, ...rest }) {
  const { open, setOpen, panelId, triggerRef } = useToggle(name);
  return (
    <button
      {...rest}
      ref={triggerRef}
      type="button"
      className={classes("agcs-toggle", className)}
      data-variant={variant}
      aria-expanded={open}
      aria-controls={panelId}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) setOpen(!open);
      }}
    >
      {variant !== "icon" && <span className="agcs-toggle__label">{children}</span>}
      <ToggleIcon />
    </button>
  );
}

/**
 * @param {string} name
 * @param {string} base
 * @param {{ className?: string, children?: ReactNode } & import("react").HTMLAttributes<HTMLDivElement>} props
 */
function Panel(name, base, { className, children, ...rest }) {
  const { open, panelId } = useToggle(name);
  return (
    <div {...rest} id={panelId} className={classes(base, className)} hidden={!open}>
      {children}
    </div>
  );
}

/** @param {OpenProps} props */
export function Disclosure({ className, children, ...openProps }) {
  const state = useToggleState(openProps);
  return (
    <ToggleContext.Provider value={state}>
      <div className={classes("agcs-disclosure", className)} data-state={state.open ? "open" : "closed"}>
        {children}
      </div>
    </ToggleContext.Provider>
  );
}

/** @param {TriggerProps} props */
export function DisclosureTrigger(props) {
  return <Trigger name="DisclosureTrigger" {...props} />;
}

/** @param {{ className?: string, children?: ReactNode } & import("react").HTMLAttributes<HTMLDivElement>} props */
export function DisclosurePanel(props) {
  return Panel("DisclosurePanel", "agcs-disclosure__panel", props);
}

/**
 * @typedef {object} MenuOwnProps
 * @property {"bottom" | "top"} [placement] Where the panel opens. Default bottom; the account menu at the foot of the sidebar uses top.
 * @property {"start" | "end" | "stretch"} [align] Which edge the panel lines up with. Default start; stretch takes the button's width.
 * @property {"self" | "parent"} [anchor] self: the panel is positioned against the menu. parent: against the app's nearest positioned element (the mobile bar). Default self.
 *
 * @param {OpenProps & MenuOwnProps} props
 */
export function Menu({ placement = "bottom", align = "start", anchor = "self", className, children, ...openProps }) {
  const state = useToggleState(openProps);
  const { open, setOpen, triggerRef } = state;
  const rootRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  const close = useCallback(
    /** @param {boolean} returnFocus */
    (returnFocus) => {
      setOpen(false);
      if (returnFocus) triggerRef.current?.focus();
    },
    [setOpen, triggerRef],
  );

  useEffect(() => {
    if (!open) return undefined;
    /** @param {Event} event */
    const onPointerDown = (event) => {
      const root = rootRef.current;
      if (root && event.target instanceof Node && !root.contains(event.target)) close(false);
    };
    /** @param {KeyboardEvent} event */
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      const root = rootRef.current;
      const active = document.activeElement;
      close(!active || active === document.body || Boolean(root && root.contains(active)));
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <ToggleContext.Provider value={state}>
      <MenuContext.Provider value={{ close }}>
        <div
          ref={rootRef}
          className={classes("agcs-menu", className)}
          data-state={open ? "open" : "closed"}
          data-placement={placement}
          data-align={align}
          data-anchor={anchor}
          onBlur={(event) => {
            const next = event.relatedTarget;
            if (open && next instanceof Node && !event.currentTarget.contains(next)) close(false);
          }}
        >
          {children}
        </div>
      </MenuContext.Provider>
    </ToggleContext.Provider>
  );
}

/** @param {TriggerProps} props */
export function MenuTrigger({ variant = "field", ...props }) {
  return <Trigger name="MenuTrigger" variant={variant} {...props} />;
}

/** @param {{ className?: string, children?: ReactNode } & import("react").HTMLAttributes<HTMLDivElement>} props Give it an aria-label. */
export function MenuPanel(props) {
  return Panel("MenuPanel", "agcs-menu__panel", props);
}

/**
 * One link or action. Choosing it closes the menu and returns focus to its
 * button, unless onSelect calls event.preventDefault().
 *
 * @typedef {object} MenuItemOwnProps
 * @property {import("react").ElementType} [as] The element or component to render: "button" (default), "a", Next's Link, react-router's Link.
 * @property {(event: import("react").MouseEvent<HTMLElement>) => void} [onSelect]
 * @property {string} [className]
 * @property {ReactNode} [children]
 *
 * @param {MenuItemOwnProps & Record<string, any>} props
 */
export function MenuItem({ as: Component = "button", onSelect, onClick, className, children, ...rest }) {
  const menu = useContext(MenuContext);
  if (!menu) throw new Error("MenuItem va dentro de <Menu>.");
  return (
    <Component
      {...(Component === "button" ? { type: "button" } : null)}
      {...rest}
      className={classes("agcs-menu__item", className)}
      onClick={(/** @type {import("react").MouseEvent<HTMLElement>} */ event) => {
        onClick?.(event);
        onSelect?.(event);
        if (!event.defaultPrevented) menu.close(true);
      }}
    >
      {children}
    </Component>
  );
}

/** A short mono label over a group of items. @param {{ className?: string, children?: ReactNode }} props */
export function MenuLabel({ className, children }) {
  return <div className={classes("agcs-menu__label", className)}>{children}</div>;
}

/** A hairline between groups of items. @param {{ className?: string }} props */
export function MenuSeparator({ className }) {
  return <div role="separator" className={classes("agcs-menu__sep", className)} />;
}
