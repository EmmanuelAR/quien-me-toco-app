import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface MarkerProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "blue" | "pink";
}

/** resaltado tipo marcador detrás de una palabra clave */
export function Marker({ tone = "blue", className, children, ...rest }: MarkerProps) {
  return (
    <span className={cn("marker", tone === "pink" && "marker-pink", className)} {...rest}>
      {children}
    </span>
  );
}
