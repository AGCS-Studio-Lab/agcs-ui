/**
 * The Lab register stamp — `>> LAB · V[NN]`. The Lab is a register, not a
 * sub-brand: signaled only by this mono stamp (top-right) and the
 * construction grid behind diagrams. No color of its own.
 *
 * Vendored file — canonical source: agcs-ui/ui/lab-stamp.jsx.
 */
import { cn } from "@/lib/utils";
import { Chevron } from "./chevron";

export function LabStamp({ version, className }) {
  return (
    <span className={cn("agcs-label text-xs", className)}>
      <Chevron />
      &nbsp; LAB · V{String(version).padStart(2, "0")}
    </span>
  );
}
