import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";
import { AlertIcon } from "./icons";

interface BaseProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  className?: string;
}

/** el borde y el foco de cualquier control de formulario (también los select) */
export const fieldControl =
  "w-full rounded-sm border border-line-strong bg-white px-4 text-base text-ink placeholder:text-ink-soft " +
  "transition-[border-color,box-shadow] duration-fast focus:border-link focus:outline-none focus:ring-4 focus:ring-link/15 " +
  "disabled:bg-surface disabled:text-ink-soft";

/** el error se marca con borde más grueso, ícono y texto: no depende del color */
const invalid = "border-ink ring-1 ring-ink focus:border-ink focus:ring-ink/15";

function Message({ id, hint, error }: { id: string; hint?: ReactNode; error?: string }) {
  if (!hint && !error) return null;
  return error ? (
    <span id={id} className="mt-2 flex items-start gap-1.5 text-sm text-ink">
      <AlertIcon className="mt-0.5 size-4" />
      {error}
    </span>
  ) : (
    <span id={id} className="mt-2 block text-sm text-ink-soft">
      {hint}
    </span>
  );
}

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
      <span className="mb-2 block text-sm font-medium text-ink">{label}</span>
      <input
        id={id}
        className={cn(fieldControl, "h-14", error && invalid)}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? `${id}-hint` : undefined}
        {...rest}
      />
      <Message id={`${id}-hint`} hint={hint} error={error} />
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
      <span className="mb-2 block text-sm font-medium text-ink">{label}</span>
      <textarea
        id={id}
        rows={rows}
        className={cn(fieldControl, "resize-y py-3.5", error && invalid)}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint || error ? `${id}-hint` : undefined}
        {...rest}
      />
      <Message id={`${id}-hint`} hint={hint} error={error} />
    </label>
  );
}
