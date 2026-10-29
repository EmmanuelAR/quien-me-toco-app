import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { buttonClass } from "@/components/ui/Button";
import { faqs } from "@/lib/landing/content";

export const metadata: Metadata = {
  title: "Preguntas frecuentes",
  description:
    "Respuestas sobre precio, privacidad, sorteo justo, iPhone, Android y participantes sin cuenta.",
  alternates: { canonical: "/preguntas" },
};

export default function PreguntasPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 lg:py-20">
      <p className="text-sm text-ink-soft">
        <Link href="/" className="link">
          Inicio
        </Link>
      </p>
      <h1 className="mt-4 text-3xl font-bold lg:text-4xl">Preguntas frecuentes</h1>
      <dl className="mt-10 divide-y divide-line">
        {faqs.map((faq) => (
          <div key={faq.q} className="py-6">
            <dt className="font-semibold">{faq.q}</dt>
            <dd className="mt-2 text-pretty text-ink-soft">{faq.a}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-12 flex justify-center">
        <Link href="/dashboard" className={buttonClass({ size: "lg" })}>
          Crear mi amigo secreto
        </Link>
      </div>
      <SiteFooter />
    </main>
  );
}
