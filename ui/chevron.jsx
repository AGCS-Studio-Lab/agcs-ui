/**
 * The chevron `>>` — the brand mark in text form. Typed in mono, never imaged,
 * never lime, never repeated for emphasis. The only repeating glyph in the system.
 *
 * Vendored file — canonical source: agcs-ui/ui/chevron.jsx.
 * Adapt the `cn` import to the host app (`@/lib/utils` in both apps).
 */
import { cn } from "@/lib/utils";

export function Chevron({ className }) {
  return (
    <span aria-hidden className={cn("agcs-chevron", className)}>
      {">>"}
    </span>
  );
}
