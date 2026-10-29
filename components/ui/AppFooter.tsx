import Link from "next/link";
import { copy } from "@/lib/copy/es-CR";

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-bg">
      <div className="safe-x safe-bottom mx-auto flex max-w-5xl flex-col gap-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:px-2">
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft" aria-label="Pie">
          <Link href="/por-que" className="link">
            Por qué
          </Link>
          <Link href="/preguntas" className="link">
            Preguntas
          </Link>
          <Link href="/privacidad" className="link">
            Privacidad
          </Link>
          <Link href="/terminos" className="link">
            Términos
          </Link>
          <a
            href="https://instagram.com/ear.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="link"
          >
            @ear.dev
          </a>
        </nav>
        <div className="space-y-1 text-xs text-ink-soft lg:text-right">
          <p>
            {copy.pay.discrete}{" "}
            <a
              href="https://instagram.com/ear.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="link"
            >
              @ear.dev
            </a>
          </p>
          <p>{copy.app.by}</p>
        </div>
      </div>
    </footer>
  );
}
