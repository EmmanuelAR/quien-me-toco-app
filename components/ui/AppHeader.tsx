import Link from "next/link";
import type { ReactNode } from "react";
import { copy } from "@/lib/copy/es-CR";
import { cn } from "@/lib/cn";

export interface AppHeaderProps {
  title?: ReactNode;
  backHref?: string;
  right?: ReactNode;
  className?: string;
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AppHeader({ title, backHref, right, className }: AppHeaderProps) {
  return (
    <header className={cn("safe-top flex items-center justify-between gap-3 pb-2", className)}>
      <div className="flex min-w-0 items-center gap-2">
        {backHref && (
          <Link
            href={backHref}
            aria-label={copy.common.back}
            className="-ml-2 flex size-10 items-center justify-center rounded-pill hover:bg-surface"
          >
            <BackIcon />
          </Link>
        )}
        {title && <h1 className="truncate text-lg font-semibold">{title}</h1>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}

/**
 * una sola columna, del ancho de un celular, centrada.
 * en el teléfono ocupa la pantalla; en la computadora queda al medio, con el mismo orden.
 */
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className={cn("safe-x safe-bottom relative mx-auto flex w-full max-w-md flex-1 flex-col", className)}>
      {children}
    </main>
  );
}
