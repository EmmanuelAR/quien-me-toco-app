import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { buttonClass } from "@/components/ui/Button";
import { benefits } from "@/lib/landing/content";

export const metadata: Metadata = {
  title: "¿Por qué usarla?",
  description:
    "Privacidad real, exclusiones, wishlist y verificación pública del sorteo. Amigo secreto pensado para Latinoamérica.",
  alternates: { canonical: "/por-que" },
};

export default function PorQuePage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12 lg:py-20">
      <p className="text-sm text-ink-soft">
        <Link href="/" className="link">
          Inicio
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-bold lg:text-4xl">¿Por qué usar ¿Quién me tocó?</h1>
      <p className="mt-4 max-w-2xl text-pretty text-ink-soft">
        Hay muchas apps de amigo secreto. Esta es diferente porque está pensada para
        familias y grupos de amigos en Latinoamérica, con privacidad real y sin trucos.
      </p>
      <ul className="mt-10 grid gap-6 sm:grid-cols-2">
        {benefits.map((b) => (
          <li key={b.title} className="rounded-lg border border-line p-6">
            <h2 className="font-semibold">{b.title}</h2>
            <p className="mt-2 text-pretty text-ink-soft">{b.desc}</p>
          </li>
        ))}
      </ul>
      <div className="mt-12 flex justify-center">
        <Link href="/dashboard" className={buttonClass({ size: "lg" })}>
          Crear mi amigo secreto
        </Link>
      </div>
      <SiteFooter />
    </main>
  );
}
