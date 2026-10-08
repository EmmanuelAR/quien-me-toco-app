import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";

const steps = [
  {
    title: "1. Creá tu grupo",
    desc: "Ponele nombre, fecha del intercambio, lugar y presupuesto. Listo en 30 segundos.",
  },
  {
    title: "2. Invitá por WhatsApp",
    desc: "Compartí el link privado. Cada quien pone su nombre y su lista de deseos.",
  },
  {
    title: "3. Hacé el sorteo",
    desc: "Cuando estén todos, tocás un botón. El sistema asigna los nombres al azar.",
  },
  {
    title: "4. Revelá el día del intercambio",
    desc: "Cada quien ve solo a quién le tocó. El organizador no ve nada hasta que todos destapan.",
  },
];

const benefits = [
  {
    title: "100% gratis, sin registro obligatorio",
    desc: "Solo quien organiza entra con Google o Apple. Los demás participan con el link.",
  },
  {
    title: "Exclusiones de parejas",
    desc: "Podés marcar quiénes no se pueden tocar entre sí: parejas, roommates, familiares que ya se regalan.",
  },
  {
    title: "Lista de deseos integrada",
    desc: "Cada participante pone qué quiere: ideas, tallas, links. Siempre actualizada.",
  },
  {
    title: "Privacidad real",
    desc: "Ni vos como organizador ves quién le tocó a quién hasta que todos destapan.",
  },
  {
    title: "Sin repetir parejas del año pasado",
    desc: "Si repetís el grupo, el sistema evita que te toque la misma persona que el año anterior.",
  },
  {
    title: "Verificación pública del sorteo",
    desc: "Cada asignación queda sellada en una cadena pública. Al revelar, cualquiera puede comprobar que fue justo.",
  },
  {
    title: "Recordatorios automáticos",
    desc: "Te mandamos un correo antes de la fecha para que no se te olvide comprar el regalo.",
  },
  {
    title: "Funciona offline",
    desc: "Instalalo en tu pantalla de inicio y abrilo como una app, sin barras del navegador.",
  },
];

const faqs = [
  {
    q: "¿Es gratis de verdad?",
    a: "Sí, completamente. No hay planes premium ni funciones escondidas. El único 'pago' es un follow a @ear.dev si te sirvió.",
  },
  {
    q: "¿Cómo sé que el sorteo es justo?",
    a: "Cada asignación queda sellada en Starknet, una cadena pública, antes de que nadie sepa nada. Al revelar, se abren los sellos y cualquiera puede verificar que coinciden.",
  },
  {
    q: "¿Puedo ver quién le tocó a quién?",
    a: "No, ni siquiera como organizador. Cada participante ve solo su propio papelito. El día del intercambio, todos revelan juntos.",
  },
  {
    q: "¿Qué pasa si alguien no tiene smartphone?",
    a: "Podés agregar 'participantes sin cuenta'. Vos les pasás un link privado por WhatsApp y ellos ven su papelito sin necesidad de entrar a la app.",
  },
  {
    q: "¿Funciona en iPhone y Android?",
    a: "Sí. Es una web app que funciona en cualquier navegador moderno. Podés instalarla en tu pantalla de inicio para que se abra como una app nativa.",
  },
  {
    q: "¿Puedo repetir el grupo el próximo año?",
    a: "Sí. Hay un botón para clonar el grupo con los mismos participantes sin cuenta, el mismo presupuesto y todo. Solo cambiás la fecha.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Los nombres y deseos quedan en una cadena pública (Starknet Sepolia). Los correos se guardan temporalmente solo para enviarte tu papelito y se borran después del intercambio.",
  },
  {
    q: "¿Puedo poner exclusiones?",
    a: "Sí. Podés marcar pares que no se pueden tocar entre sí: parejas, roommates, o cualquier combinación que quieras evitar.",
  },
];

export function LandingPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12 lg:py-20">
      {/* Hero - Two column on desktop */}
      <section className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
        <div className="text-center lg:text-left">
          <h1 className="text-4xl font-bold lg:text-5xl">
            Amigo secreto online gratis
          </h1>
          <p className="mt-6 text-xl text-pretty text-ink-soft lg:text-2xl">
            Organizá el intercambio de regalos, repartí los nombres sin que nadie vea 
            y revelá todo el día del evento. Hecho en Costa Rica.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link href="/crear" className={buttonClass({ size: "lg" })}>
              Crear mi amigo secreto
            </Link>
            <a href="#como-funciona" className={buttonClass({ size: "lg", variant: "secondary" })}>
              ¿Cómo funciona?
            </a>
          </div>
        </div>
        <div className="hidden lg:flex lg:items-center lg:justify-center">
          <div className="text-[120px] leading-none" role="img" aria-label="Regalo">🎁</div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="mt-20 scroll-mt-8">
        <h2 className="text-2xl font-bold lg:text-3xl">¿Cómo funciona?</h2>
        <p className="mt-4 text-pretty text-ink-soft">
          En 4 pasos tenés tu amigo secreto listo. Sin descargas, sin cuentas para todos, sin complicaciones.
        </p>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2">
          {steps.map((step) => (
            <li key={step.title} className="rounded-lg bg-surface p-6">
              <h3 className="font-semibold">{step.title}</h3>
              <p className="mt-2 text-pretty text-ink-soft">{step.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Beneficios */}
      <section className="mt-20">
        <h2 className="text-2xl font-bold lg:text-3xl">¿Por qué usar ¿Quién me tocó?</h2>
        <p className="mt-4 text-pretty text-ink-soft">
          Hay muchas apps de amigo secreto. Esta es diferente porque está pensada para 
          familias y grupos de amigos en Latinoamérica, con privacidad real y sin trucos.
        </p>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2">
          {benefits.map((b) => (
            <li key={b.title} className="rounded-lg border border-line p-6">
              <h3 className="font-semibold">{b.title}</h3>
              <p className="mt-2 text-pretty text-ink-soft">{b.desc}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section id="preguntas" className="mt-20 scroll-mt-8">
        <h2 className="text-2xl font-bold lg:text-3xl">Preguntas frecuentes</h2>
        <dl className="mt-8 divide-y divide-line">
          {faqs.map((faq) => (
            <div key={faq.q} className="py-6">
              <dt className="font-semibold">{faq.q}</dt>
              <dd className="mt-2 text-pretty text-ink-soft">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* CTA final */}
      <section className="mt-20 rounded-lg bg-surface p-8 text-center">
        <h2 className="text-2xl font-bold">¿Listo para tu amigo secreto?</h2>
        <p className="mt-4 text-pretty text-ink-soft">
          Es gratis, toma menos de un minuto y tus amigos te van a agradecer.
        </p>
        <Link href="/crear" className={`${buttonClass({ size: "lg" })} mt-6`}>
          Crear mi amigo secreto
        </Link>
      </section>

      {/* Footer */}
      <footer className="mt-20 border-t border-line pt-8 text-center text-sm text-ink-soft">
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link href="/privacidad" className="link">Privacidad</Link>
          <Link href="/terminos" className="link">Términos</Link>
          <a href="https://instagram.com/ear.dev" target="_blank" rel="noopener noreferrer" className="link">
            @ear.dev
          </a>
        </nav>
        <p className="mt-4">Hecho con ❤️ en Costa Rica · {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
