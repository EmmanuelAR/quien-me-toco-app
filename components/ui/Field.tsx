import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";

interface BaseProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  className?: string;
}

const control =
  "w-full rounded-md border border-line bg-white px-4 py-3 text-base text-ink placeholder:text-ink-soft/70 " +
  "transition-colors duration-fast focus:border-ink focus:outline-none disabled:opacity-50";

export function Field({
  label,
  hint,
  error,
  className,
  id: idProp,
  ...rest
}: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <label htmlFor={id} className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <input
        id={id}
        className={cn(control, error && "border-marker-pink focus:border-marker-pink")}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? `${id}-hint` : undefined}
        {...rest}
      />
      {(hint || error) && (
        <span
          id={`${id}-hint`}
          className={cn("mt-1.5 block text-sm", error ? "text-ink" : "text-ink-soft")}
        >
          {error ? <span className="marker marker-pink">{error}</span> : hint}
        </span>
      )}
    </label>
  );
}

export function TextArea({
  label,
  hint,
  error,
  className,
  id: idProp,
  rows = 3,
  ...rest
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <label htmlFor={id} className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <textarea
        id={id}
        rows={rows}
        className={cn(control, "resize-y", error && "border-marker-pink focus:border-marker-pink")}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
      {(hint || error) && (
        <span className={cn("mt-1.5 block text-sm", error ? "text-ink" : "text-ink-soft")}>
          {error ? <span className="marker marker-pink">{error}</span> : hint}
        </span>
      )}
    </label>
  );
}
