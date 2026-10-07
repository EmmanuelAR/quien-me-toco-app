import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type StampName = "cara-1" | "cara-2" | "cara-3";

const paths: Record<StampName, ReactNode> = {
  "cara-1": (
    <>
      <path d="M40 8c17 0 31 13 31 31 0 18-13 33-31 33S8 58 8 40 22 8 40 8z" />
      <path d="M28 33c1-3 5-3 6 0" />
      <path d="M47 33c1-3 5-3 6 0" />
      <path d="M27 50c6 6 20 6 26-1" />
    </>
  ),
  "cara-2": (
    <>
      <path d="M41 9c16 1 29 14 29 31S57 72 40 72 10 59 10 41 24 8 41 9z" />
      <path d="M27 36l7-2" />
      <path d="M46 34l7 2" />
      <path d="M30 52c5 3 12 3 20-4" />
      <path d="M50 48l4 3" />
    </>
  ),
  "cara-3": (
    <>
      <path d="M40 9c18 0 30 14 30 31S58 71 40 71 9 57 9 40 22 9 40 9z" />
      <circle cx="31" cy="34" r="1.6" fill="#111111" stroke="none" />
      <circle cx="49" cy="34" r="1.6" fill="#111111" stroke="none" />
      <path d="M35 52c0-4 10-4 10 0s-10 4-10 0z" />
      <path d="M25 24c3-3 7-4 10-3" />
      <path d="M45 21c3-1 7 0 10 3" />
    </>
  ),
};

export interface StampProps {
  name?: StampName;
  /** lado del svg en px */
  size?: number;
  className?: string;
}

/**
 * carita en line-art, dibujada en línea (no depende de un archivo que el navegador cachee mal).
 * va en el flujo, al lado del título, para que no se monte sobre el texto.
 * los trazos son placeholders hasta que lleguen las ilustraciones finales.
 */
export function Stamp({ name = "cara-1", size = 48, className }: StampProps) {
  return (
    <svg
      viewBox="0 0 80 80"
      width={size}
      height={size}
      fill="none"
      stroke="#111111"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("shrink-0 select-none", className)}
    >
      {paths[name]}
    </svg>
  );
}
