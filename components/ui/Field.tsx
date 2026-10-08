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

export type Currency = "CRC" | "USD";

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  CRC: "₡",
  USD: "$",
};

interface CurrencyFieldProps extends BaseProps {
  value: string;
  currency: Currency;
  onChange: (value: string) => void;
  onCurrencyChange: (currency: Currency) => void;
  id?: string;
  min?: number;
  step?: number;
  disabled?: boolean;
}

export function CurrencyField({
  label,
  hint,
  error,
  className,
  id: idProp,
  value,
  currency,
  onChange,
  onCurrencyChange,
  min = 1,
  step = 1,
  disabled,
}: CurrencyFieldProps) {
  const auto = useId();
  const id = idProp ?? auto;
  return (
    <div className={cn("block", className)}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-ink">
        {label}
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft">
            {CURRENCY_SYMBOLS[currency]}
          </span>
          <input
            id={id}
            type="number"
            inputMode="numeric"
            min={min}
            step={step}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={cn(fieldControl, "h-14 pl-8", error && invalid)}
            aria-invalid={error ? true : undefined}
            aria-describedby={hint || error ? `${id}-hint` : undefined}
          />
        </div>
        <select
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value as Currency)}
          disabled={disabled}
          className={cn(fieldControl, "h-14 w-24 appearance-none bg-right bg-no-repeat pr-8")}
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236e6e73' d='M3 4l3 4 3-4H3z'/%3E%3C/svg%3E")`, backgroundPosition: "right 0.75rem center" }}
          aria-label="Moneda"
        >
          <option value="CRC">CRC</option>
          <option value="USD">USD</option>
        </select>
      </div>
      <Message id={`${id}-hint`} hint={hint} error={error} />
    </div>
  );
}
