import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  leading?: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-pill font-medium select-none " +
  "transition-[transform,background-color,border-color,opacity] duration-fast ease-soft " +
  "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-ink/85",
  secondary: "border border-line-strong bg-white text-ink hover:bg-surface",
  ghost: "bg-transparent text-ink hover:bg-ink/5 active:bg-ink/10",
};

/** sm sigue midiendo 44px de alto: es lo mínimo para un dedo */
const sizes: Record<Size, string> = {
  sm: "h-11 px-4 text-sm",
  md: "h-12 px-6 text-base",
  lg: "h-14 px-7 text-base",
};

/** las clases del botón, para links que se ven como botón */
export function buttonClass({
  variant = "primary",
  size = "md",
  fullWidth = false,
}: { variant?: Variant; size?: Size; fullWidth?: boolean } = {}): string {
  return cn(base, variants[variant], sizes[size], fullWidth && "w-full");
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  fullWidth = false,
  leading,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonClass({ variant, size, fullWidth }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <Spinner className="size-4" /> : leading}
      <span>{children}</span>
    </button>
  );
}
