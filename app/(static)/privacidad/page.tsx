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
          En <strong>¿Quién me tocó?</strong> valoramos tu privacidad. Esta política explica 
          qué datos recolectamos, cómo los usamos y cómo los protegemos.
        </p>

        <h2>1. Datos que recolectamos</h2>
        <p>Cuando usás la app, podemos recolectar:</p>
        <ul>
          <li>
            <strong>Nombre de participante:</strong> el nombre que ponés al unirte a un grupo.
          </li>
          <li>
            <strong>Lista de deseos:</strong> las ideas de regalo que compartís con tu amigo secreto.
          </li>
          <li>
            <strong>Cuenta de Google o Apple:</strong> si creás un grupo como organizador, 
            usamos tu nombre y correo electrónico para identificarte.
          </li>
          <li>
            <strong>Datos técnicos:</strong> dirección IP, tipo de navegador, sistema operativo 
            y cookies estrictamente necesarias para el funcionamiento de la app.
          </li>
        </ul>

        <h2>2. Dónde se guardan los datos</h2>
        <p>
          <strong>Importante:</strong> los nombres de los participantes, las listas de deseos, 
          las asignaciones del sorteo y los datos de los grupos se almacenan en{" "}
          <strong>Starknet Sepolia</strong>, una red de pruebas (testnet) de blockchain pública. 
          Esto significa que:
        </p>
        <ul>
          <li>
            Cualquier persona con conocimientos técnicos puede ver estos datos explorando 
            la blockchain.
          </li>
          <li>
            Los datos no se pueden borrar una vez escritos en la cadena.
          </li>
          <li>
            No uses nombres reales ni información sensible si no querés que sean públicos.
          </li>
        </ul>
        <p>
          Usamos Starknet Sepolia para garantizar que el sorteo sea verificablemente justo: 
          cualquiera puede comprobar que las asignaciones se hicieron correctamente.
        </p>
        <p>
          Los correos electrónicos de los organizadores se almacenan temporalmente en servidores 
          seguros (Vercel KV / Upstash Redis) para funciones como recordatorios y recuperación 
          del código de invitación. Estos datos se borran automáticamente después de un tiempo 
          o cuando cerrás tu cuenta.
        </p>

        <h2>3. Cómo usamos los datos</h2>
        <ul>
          <li>
            <strong>Operar la app:</strong> crear grupos, hacer sorteos, enviar recordatorios.
          </li>
          <li>
            <strong>Mejorar el servicio:</strong> análisis anónimos de uso para detectar errores 
            y mejorar la experiencia.
          </li>
          <li>
            <strong>Comunicaciones:</strong> correos transaccionales (confirmación de sorteo, 
            recordatorios). No enviamos publicidad.
          </li>
        </ul>

        <h2>4. Cookies</h2>
        <p>
          Usamos únicamente cookies técnicas esenciales para el funcionamiento de la app 
          (sesión, preferencias). No usamos cookies de seguimiento ni de publicidad.
        </p>

        <h2>5. Compartir datos</h2>
        <p>
          No vendemos, alquilamos ni compartimos tus datos personales con terceros para 
          fines de marketing. Podemos compartir datos con:
        </p>
        <ul>
          <li>
            <strong>Proveedores de infraestructura:</strong> Vercel (hosting), Upstash (base de datos), 
            Cavos (autenticación con wallet).
          </li>
          <li>
            <strong>Autoridades legales:</strong> si lo requiere la ley.
          </li>
        </ul>

        <h2>6. Tus derechos</h2>
        <p>
          Podés solicitar acceso, corrección o eliminación de tus datos personales escribiendo a{" "}
          <a href="mailto:hola@ear.dev" className="link">hola@ear.dev</a>. 
          Tené en cuenta que los datos en la blockchain (Starknet Sepolia) no se pueden modificar 
          ni eliminar.
        </p>

        <h2>7. Seguridad</h2>
        <p>
          Usamos HTTPS, almacenamiento encriptado y prácticas de seguridad estándar de la industria. 
          Sin embargo, ningún sistema es 100% seguro.
        </p>

        <h2>8. Cambios a esta política</h2>
        <p>
          Podemos actualizar esta política. Te notificaremos de cambios importantes por correo 
          o con un aviso en la app.
        </p>

        <h2>9. Contacto</h2>
        <p>
          Si tenés preguntas sobre esta política, escribinos a{" "}
          <a href="mailto:hola@ear.dev" className="link">hola@ear.dev</a>.
        </p>
      </section>

      <div className="mt-12 border-t border-line pt-8">
        <Link href="/" className="link">&larr; Volver al inicio</Link>
      </div>
    </main>
  );
}
