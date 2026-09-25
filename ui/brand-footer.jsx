/**
 * Brand attribution footer. Canonical strings (treat as fixtures):
 *   attribution: "AGCS | Studio + Lab |"  — spaces around the +, trailing pipe intentional.
 *   tagline:     ">> Stay Forward"
 *
 * Vendored file — canonical source: agcs-ui/ui/brand-footer.jsx.
 */
import { cn } from "@/lib/utils";
import { Chevron } from "./chevron";

export function BrandFooter({ className }) {
  return (
    <footer
      className={cn(
        "agcs-label flex items-center justify-between border-t px-6 py-4 text-xs",
        className,
      )}
    >
      <span>AGCS&nbsp;|&nbsp;Studio&nbsp;+&nbsp;Lab&nbsp;|</span>
      <span>
        <Chevron />
        &nbsp; Stay Forward
      </span>
    </footer>
  );
}
