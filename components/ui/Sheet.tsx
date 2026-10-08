"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { copy } from "@/lib/copy/es-CR";
import { CloseIcon } from "./icons";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

/** hoja inferior, respeta la barra de abajo del teléfono */
export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  const dialog = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  // solo al abrir: onClose cambia en cada render del padre y robaría el foco de los campos
  useEffect(() => {
    if (open) dialog.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="presentation">
      <button
        type="button"
        aria-label={copy.common.close}
        className="animate-fade absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          "animate-sheet relative w-full max-w-md rounded-t-lg bg-white px-6 pt-3 shadow-float outline-none safe-bottom",
          "sm:rounded-lg sm:pb-6",
          className,
        )}
      >
        <div className="mx-auto mb-3 h-1.5 w-9 rounded-pill bg-line sm:hidden" aria-hidden="true" />
        <div className="mb-5 flex items-start justify-between gap-4">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          <button
            type="button"
            aria-label={copy.common.close}
            className="-mr-2 -mt-1 flex size-9 shrink-0 items-center justify-center rounded-pill text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
            onClick={onClose}
          >
            <CloseIcon className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
