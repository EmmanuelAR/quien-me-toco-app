"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { copy } from "@/lib/copy/es-CR";
import { cn } from "@/lib/cn";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "qmt:install-dismissed";

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(ua) || iPadOS;
}

/* valores que solo existen en el navegador; en el servidor son "todavía no" */
const noop = () => () => {};
function useMounted() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}

/** icono de "compartir" de ios, en line-art, para las instrucciones */
function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 15V4m0 0L8.5 7.5M12 4l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 10H6a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" strokeLinecap="round" />
    </svg>
  );
}

function PlusSquareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M12 8v8M8 12h8" strokeLinecap="round" />
    </svg>
  );
}

export interface InstallPromptProps {
  /** "banner" muestra una tarjeta; "button" solo un botón que abre la hoja */
  mode?: "banner" | "button";
  className?: string;
}

/**
 * aviso de instalación: en android usa el prompt nativo (beforeinstallprompt),
 * en iphone muestra los dos pasos. no aparece si ya está instalada.
 */
export function InstallPrompt({ mode = "banner", className }: InstallPromptProps) {
  const mounted = useMounted();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissedNow, setDismissedNow] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!mounted || installed || isStandalone()) return null;
  const ios = isIOS();
  const dismissedBefore = localStorage.getItem(DISMISSED_KEY) === "1";
  if (mode === "banner" && (dismissedBefore || dismissedNow)) return null;

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
      setDeferred(null);
      return;
    }
    setSheetOpen(true);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissedNow(true);
  };

  const sheet = (
    <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={copy.pwa.install}>
      <p className="mb-6 text-pretty text-ink-soft">{copy.pwa.installBody}</p>
      {ios ? (
        <ol className="mb-8 divide-y divide-line border-y border-line">
          {copy.pwa.iosSteps.map((step, i) => (
            <li key={step} className="flex items-center gap-4 py-4">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-pill bg-surface text-sm font-semibold tabular">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">{step}</span>
              {i === 0 ? <ShareIcon /> : <PlusSquareIcon />}
            </li>
          ))}
        </ol>
      ) : (
        <p className="mb-8 text-pretty">{copy.pwa.androidSteps}</p>
      )}
      <Button fullWidth variant="secondary" onClick={() => setSheetOpen(false)}>
        {copy.common.close}
      </Button>
    </Sheet>
  );

  if (mode === "button") {
    return (
      <>
        <Button variant="secondary" className={className} onClick={() => void install()}>
          {copy.pwa.install}
        </Button>
        {sheet}
      </>
    );
  }

  return (
    <>
      <div className={cn("animate-rise rounded-md bg-surface p-5", className)} role="region" aria-label={copy.pwa.install}>
        <p className="font-semibold">{copy.pwa.install}</p>
        <p className="mt-1 text-sm text-pretty text-ink-soft">{copy.pwa.installBody}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={dismiss}>
            {copy.pwa.later}
          </Button>
          <Button size="sm" onClick={() => void install()}>
            {deferred ? copy.pwa.installAndroid : copy.common.yes}
          </Button>
        </div>
      </div>
      {sheet}
    </>
  );
}
