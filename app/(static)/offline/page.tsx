import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { copy } from "@/lib/copy/es-CR";

export const metadata: Metadata = { title: copy.pwa.offlineTitle };

export default function OfflinePage() {
  return (
    <main className="safe-x safe-top safe-bottom mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center">
      <h1 className="text-2xl font-semibold">{copy.pwa.offlineTitle}</h1>
      <p className="mt-3 text-lg text-pretty text-ink-soft">{copy.pwa.offlineBody}</p>
      <Link href="/" className={`${buttonClass({ size: "lg", fullWidth: true })} mt-10`}>
        {copy.pwa.retry}
      </Link>
    </main>
  );
}
