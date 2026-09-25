/**
 * The document-and-arrow glyph (`icons-grid/08`). It is a TOPIC icon, not the
 * AGCS logo and not the lab icon: agcs-design-system v5.4 corrected this, and
 * this comment said otherwise until 2026-09-24. The AGCS mark is only white or
 * black and lives in agcs-design-system/assets/agcs_mark_*.svg; the lab icon
 * is the flask (`alxgdo/01`). agcs-management-system already renders the flask
 * instead of this file.
 *
 * Vendored file — canonical source: agcs-ui/ui/brand-icon.jsx (moved from agcs-design-system/ui on 2026-09-24).
 * Assets: copy agcs-design-system/assets/agcs_doc_arrow_{lime,black,white}.svg
 * into the host app's public/brand/. (Next apps may swap <img> for next/image.)
 */
import { cn } from "@/lib/utils";

const SRC = {
  lime: "/brand/agcs_doc_arrow_lime.svg",
  black: "/brand/agcs_doc_arrow_black.svg",
  white: "/brand/agcs_doc_arrow_white.svg",
};

export function BrandIcon({ variant = "lime", size = 32, className, alt = "AGCS" }) {
  return (
    <img
      src={SRC[variant]}
      alt={alt}
      width={size}
      height={size}
      aria-hidden={alt === "" ? true : undefined}
      className={cn("block", className)}
    />
  );
}
