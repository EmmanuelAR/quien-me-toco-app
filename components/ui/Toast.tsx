"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { AlertIcon, CheckIcon } from "./icons";

type Tone = "neutral" | "ok" | "error";
interface ToastItem {
  id: number;
  text: string;
  tone: Tone;
}

interface ToastApi {
  show: (text: string, tone?: Tone) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const show = useCallback((text: string, tone: Tone = "neutral") => {
    const id = ++counter.current;
    setItems((prev) => [...prev, { id, text, tone }]);
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), tone === "error" ? 4000 : 2600);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-6 pb-[max(1.5rem,var(--safe-bottom))]"
        role="status"
        aria-live="polite"
      >
        {items.map((t) => (
          <div
            key={t.id}
            className="animate-rise flex max-w-full items-center gap-2 rounded-pill bg-ink px-5 py-3 text-sm font-medium text-white shadow-float"
          >
            {t.tone === "ok" && <CheckIcon className="size-4" />}
            {t.tone === "error" && <AlertIcon className="size-4" />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { show: () => undefined };
  }
  return ctx;
}
