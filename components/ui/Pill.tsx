import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** etiqueta chica y gris; sobre un fondo gris, pasale bg-white */
export function Pill({ className, children, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-pill bg-surface px-2.5 py-1 text-xs font-medium text-ink tabular",
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
