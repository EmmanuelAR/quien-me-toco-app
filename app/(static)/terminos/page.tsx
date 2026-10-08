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
          Al usar <strong>¿Quién me tocó?</strong> (la "App"), aceptás estos términos de uso. 
          Si no estás de acuerdo, no uses la App.
        </p>

        <h2>1. Descripción del servicio</h2>
        <p>
          <strong>¿Quién me tocó?</strong> es una aplicación web gratuita para organizar sorteos 
          de amigo secreto (también conocido como amigo invisible o intercambio navideño). 
          Permite crear grupos, invitar participantes, realizar el sorteo y revelar las asignaciones.
        </p>

        <h2>2. Requisitos</h2>
        <ul>
          <li>Debés tener al menos 13 años para usar la App.</li>
          <li>
            Para crear un grupo como organizador, necesitás una cuenta de Google o Apple 
            y una wallet de Starknet (proporcionada automáticamente por Cavos).
          </li>
          <li>Los participantes pueden unirse sin cuenta, solo con el link de invitación.</li>
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
          <li>Publicar contenido ofensivo, difamatorio o ilegal en los nombres o listas de deseos.</li>
          <li>Interferir con el funcionamiento de la App o de la blockchain.</li>
          <li>Crear bots o scripts automatizados para interactuar con la App.</li>
        </ul>

        <h2>4. Datos en blockchain</h2>
        <p>
          Entendés y aceptás que los datos de los grupos, participantes y asignaciones se 
          almacenan en <strong>Starknet Sepolia</strong>, una blockchain pública de pruebas. 
          Esto significa que:
        </p>
        <ul>
          <li>Los datos son públicamente visibles y no se pueden eliminar.</li>
          <li>
            No debés usar información personal sensible que no quieras que sea pública.
          </li>
          <li>
            La verificabilidad del sorteo depende de la integridad de la blockchain, 
            sobre la cual no tenemos control.
          </li>
        </ul>

        <h2>5. Propiedad intelectual</h2>
        <p>
          El código fuente, diseño, marca y contenido de la App son propiedad de Emmanuel 
          Agüero Rojas o están licenciados para su uso. No podés copiar, modificar o distribuir 
          la App sin autorización, excepto según lo permita la licencia del código fuente 
          si está publicado como open source.
        </p>

        <h2>6. Limitación de responsabilidad</h2>
        <p>
          La App se proporciona "tal cual" sin garantías de ningún tipo. No somos responsables por:
        </p>
        <ul>
          <li>Pérdida de datos o interrupciones del servicio.</li>
          <li>Disputas entre participantes de un grupo.</li>
          <li>Problemas con la blockchain de Starknet Sepolia.</li>
          <li>Cualquier daño indirecto derivado del uso de la App.</li>
        </ul>
        <p>
          Nuestra responsabilidad máxima está limitada al monto que hayas pagado por usar 
          la App (que actualmente es cero, porque es gratis).
        </p>

        <h2>7. Terminación</h2>
        <p>
          Podemos suspender o terminar tu acceso a la App en cualquier momento si violás 
          estos términos o por cualquier otra razón a nuestra discreción. Los datos ya 
          escritos en la blockchain no se pueden eliminar.
        </p>

        <h2>8. Cambios a los términos</h2>
        <p>
          Podemos modificar estos términos en cualquier momento. El uso continuado de la App 
          después de los cambios constituye aceptación de los nuevos términos.
        </p>

        <h2>9. Ley aplicable</h2>
        <p>
          Estos términos se rigen por las leyes de Costa Rica. Cualquier disputa se resolverá 
          en los tribunales de San José, Costa Rica.
        </p>

        <h2>10. Contacto</h2>
        <p>
          Para preguntas sobre estos términos, escribinos a{" "}
          <a href="mailto:hola@ear.dev" className="link">hola@ear.dev</a>.
        </p>
      </section>

      <div className="mt-12 border-t border-line pt-8">
        <Link href="/" className="link">&larr; Volver al inicio</Link>
      </div>
    </main>
  );
}
