import Link from "next/link";
import type { ReactNode } from "react";
import { copy } from "@/lib/copy/es-CR";
import { cn } from "@/lib/cn";
import { ChevronLeftIcon } from "./icons";

export interface AppHeaderProps {
  title?: ReactNode;
  /** línea chica arriba del título, por ejemplo el nombre del grupo */
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
  backHref?: string;
  right?: ReactNode;
  /** va debajo del título, por ejemplo en qué va el grupo */
  children?: ReactNode;
  className?: string;
}

/** barra con la flecha de volver y, debajo, el título grande de la pantalla */
export function AppHeader({ title, eyebrow, subtitle, backHref, right, children, className }: AppHeaderProps) {
  return (
    <header className={cn("pb-10 pt-6", className)}>
      {(backHref || right) && (
        <div className="-mx-3 flex h-11 items-center justify-between gap-3">
          {backHref ? (
            <Link
              href={backHref}
              aria-label={copy.common.back}
              className="flex size-11 items-center justify-center rounded-pill text-ink transition-colors hover:bg-ink/5"
            >
              <ChevronLeftIcon className="size-6" />
            </Link>
          ) : (
            <span />
          )}
          {right && <div className="shrink-0 px-3">{right}</div>}
        </div>
      )}
      {eyebrow && <p className="mt-6 truncate text-sm font-semibold text-ink-soft">{eyebrow}</p>}
      {title && <h1 className={cn("text-2xl font-semibold text-balance", eyebrow ? "mt-1" : "mt-6")}>{title}</h1>}
      {subtitle && <p className="mt-3 text-lg text-pretty text-ink-soft">{subtitle}</p>}
      {children && <div className="mt-8">{children}</div>}
    </header>
  );
}

type PageWidth = "narrow" | "wide";

/**
 * narrow: formularios y flujos de una columna (sigue legible en desktop).
 * wide: listados densos (dashboard, admin) que aprovechan el ancho.
 */
export function Page({
  children,
  className,
  width = "narrow",
}: {
  children: ReactNode;
  className?: string;
  width?: PageWidth;
}) {
  return (
    <main
      className={cn(
        "safe-x relative mx-auto flex w-full flex-1 flex-col",
        width === "wide" ? "max-w-md lg:max-w-5xl lg:px-2" : "max-w-md lg:max-w-xl",
        className,
      )}
    >
      {children}
    </main>
  );
}
