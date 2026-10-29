import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="safe-bottom mt-16 shrink-0 border-t border-line pt-8 text-center text-sm text-ink-soft">
      <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
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
    </footer>
  );
}
