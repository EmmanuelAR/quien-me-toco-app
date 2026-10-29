import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/lib/brand/tokens";

export const metadata: Metadata = {
  title: "Términos de uso",
  description: `Términos y condiciones de uso de ${brand.shortName}.`,
  alternates: { canonical: "/terminos" },
};

export default function TerminosPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">Términos de uso</h1>
      <p className="mt-4 text-ink-soft">Última actualización: octubre 2026</p>

      <section className="prose prose-ink mt-8 max-w-none">
        <p>
          Al usar <strong>¿Quién me tocó?</strong> (la &quot;App&quot;), aceptás estos términos. Si no
          estás de acuerdo, no uses la App.
        </p>

        <h2>1. Descripción del servicio</h2>
        <p>
          <strong>¿Quién me tocó?</strong> es una aplicación web gratuita para organizar sorteos de
          amigo secreto. Permite crear grupos, invitar participantes, realizar el sorteo y revelar
          las asignaciones.
        </p>

        <h2>2. Requisitos</h2>
        <ul>
          <li>Debés tener al menos 13 años para usar la App.</li>
          <li>
            Para organizar o participar necesitás entrar con una cuenta de <strong>Google</strong>.
          </li>
          <li>Quien organiza comparte un link de invitación; quien se une también entra con Google.</li>
        </ul>

        <h2>3. Uso aceptable</h2>
        <p>Aceptás usar la App únicamente para:</p>
        <ul>
          <li>Organizar sorteos de amigo secreto legítimos.</li>
          <li>Participar en grupos a los que fuiste invitado.</li>
        </ul>
        <p>No podés:</p>
        <ul>
          <li>Usar la App para actividades ilegales o fraudulentas.</li>
          <li>Intentar acceder a grupos sin autorización.</li>
          <li>Publicar contenido ofensivo o ilegal en nombres o listas de deseos.</li>
          <li>Interferir con el funcionamiento de la App.</li>
          <li>Abusar de la App con bots o automatización masiva.</li>
        </ul>

        <h2>4. Datos</h2>
        <p>
          Entendés que los datos del grupo se guardan en una base de datos privada (Neon) y se
          borran automáticamente después del evento según la política de privacidad. El sorteo se
          calcula en el servidor; cada participante ve solo su propio papelito hasta la revelación.
        </p>

        <h2>5. Propiedad intelectual</h2>
        <p>
          El código, diseño, marca y contenido de la App son propiedad de Emmanuel Agüero Rojas o
          están licenciados para su uso. No podés copiar o distribuir la App sin autorización,
          excepto según lo permita la licencia del código fuente si está publicado como open source.
        </p>

        <h2>6. Limitación de responsabilidad</h2>
        <p>
          La App se proporciona &quot;tal cual&quot; sin garantías. No somos responsables por pérdida
          de datos, interrupciones, disputas entre participantes ni daños indirectos. La
          responsabilidad máxima está limitada a lo que hayas pagado por usar la App (hoy: cero).
        </p>

        <h2>7. Terminación</h2>
        <p>
          Podemos suspender el acceso si violás estos términos. Los datos sujetos a purge se
          eliminan según el calendario del grupo.
        </p>

        <h2>8. Cambios</h2>
        <p>
          Podemos modificar estos términos. El uso continuado después de los cambios constituye
          aceptación.
        </p>

        <h2>9. Ley aplicable</h2>
        <p>
          Estos términos se rigen por las leyes de Costa Rica. Las disputas se resuelven en los
          tribunales de San José, Costa Rica.
        </p>

        <h2>10. Contacto</h2>
        <p>
          <a href="mailto:hola@ear.dev" className="link">
            hola@ear.dev
          </a>
          .
        </p>
      </section>

      <div className="mt-12 border-t border-line pt-8">
        <Link href="/" className="link">
          &larr; Volver al inicio
        </Link>
      </div>
    </main>
  );
}
