import Link from "next/link";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { buttonClass } from "@/components/ui/Button";
import { copy } from "@/lib/copy/es-CR";

export function LandingPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-6">
      <section className="flex flex-1 flex-col items-center justify-center py-16 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-balance lg:text-5xl">
          {copy.app.name}
        </h1>
        <p className="mt-5 max-w-md text-lg text-pretty text-ink-soft">
          Amigo secreto online gratis. Invitá por WhatsApp, sorteá y cada quien ve solo a quién le tocó.
        </p>
        <div className="mt-10">
          <Link href="/dashboard" className={buttonClass({ size: "lg" })}>
            Crear mi amigo secreto
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
