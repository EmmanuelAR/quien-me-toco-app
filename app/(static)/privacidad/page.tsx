import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/lib/brand/tokens";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description: `Cómo ${brand.shortName} maneja tus datos personales y los datos del amigo secreto.`,
  alternates: { canonical: "/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">Política de privacidad</h1>
      <p className="mt-4 text-ink-soft">Última actualización: octubre 2026</p>

      <section className="prose prose-ink mt-8 max-w-none">
        <p>
          En <strong>¿Quién me tocó?</strong> valoramos tu privacidad. Esta política explica qué datos
          recolectamos, cómo los usamos y cómo los protegemos.
        </p>

        <h2>1. Datos que recolectamos</h2>
        <p>Cuando usás la app, podemos recolectar:</p>
        <ul>
          <li>
            <strong>Cuenta de Google:</strong> nombre, correo e identificador para entrar como
            organizador o participante.
          </li>
          <li>
            <strong>Nombre de participante:</strong> el nombre o apodo que ponés al unirte a un grupo.
          </li>
          <li>
            <strong>Lista de deseos:</strong> ideas, tallas y links que compartís con tu amigo secreto.
          </li>
          <li>
            <strong>Datos del grupo:</strong> nombre, fecha, lugar, presupuesto, reglas, exclusiones y
            resultado del sorteo.
          </li>
          <li>
            <strong>Datos técnicos:</strong> dirección IP, tipo de navegador y cookies estrictamente
            necesarias para la sesión.
          </li>
        </ul>

        <h2>2. Dónde se guardan los datos</h2>
        <p>
          Los datos de grupos, participantes, wishlists y asignaciones viven en una base de datos
          privada en <strong>Neon (Postgres)</strong>. La autenticación la provee{" "}
          <strong>Neon Auth</strong> con Google. El hosting es <strong>Vercel</strong>. Si
          configuramos correos, usamos <strong>Resend</strong> solo para avisos del sorteo y
          recordatorios.
        </p>
        <p>
          Los grupos se borran automáticamente unos días después de la fecha del intercambio
          (purga programada).
        </p>

        <h2>3. Cómo usamos los datos</h2>
        <ul>
          <li>
            <strong>Operar la app:</strong> crear grupos, unirse, wishlists, exclusiones, sorteo y
            revelación.
          </li>
          <li>
            <strong>Comunicaciones:</strong> correos transaccionales (aviso al sortear, recordatorio
            antes del evento). No enviamos publicidad.
          </li>
          <li>
            <strong>Mejorar el servicio:</strong> logs técnicos para detectar errores.
          </li>
        </ul>

        <h2>4. Cookies</h2>
        <p>
          Usamos únicamente cookies técnicas esenciales (sesión). No usamos cookies de seguimiento ni
          de publicidad.
        </p>

        <h2>5. Compartir datos</h2>
        <p>
          No vendemos ni compartimos tus datos personales con terceros para marketing. Podemos
          compartir datos con:
        </p>
        <ul>
          <li>
            <strong>Proveedores de infraestructura:</strong> Vercel (hosting), Neon (base de datos y
            auth), Resend (correo, si está configurado), Google (inicio de sesión).
          </li>
          <li>
            <strong>Autoridades legales:</strong> si lo requiere la ley.
          </li>
        </ul>

        <h2>6. Tus derechos</h2>
        <p>
          Podés solicitar acceso, corrección o eliminación de tus datos personales escribiendo a{" "}
          <a href="mailto:hola@ear.dev" className="link">
            hola@ear.dev
          </a>
          . Los grupos también se eliminan solos tras la fecha de purge.
        </p>

        <h2>7. Seguridad</h2>
        <p>
          Usamos HTTPS y prácticas estándar de la industria. Ningún sistema es 100% seguro.
        </p>

        <h2>8. Cambios a esta política</h2>
        <p>
          Podemos actualizar esta política. Los cambios importantes se reflejan en esta página con la
          fecha de actualización.
        </p>

        <h2>9. Contacto</h2>
        <p>
          Preguntas:{" "}
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
