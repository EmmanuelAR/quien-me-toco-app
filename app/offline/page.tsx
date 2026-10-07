import type { Metadata } from "next";
import Link from "next/link";
import { Marker } from "@/components/ui/Marker";
import { copy } from "@/lib/copy/es-CR";

export const metadata: Metadata = { title: copy.pwa.offlineTitle };

export default function OfflinePage() {
  return (
    <main className="safe-x safe-top safe-bottom flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold">
        <Marker tone="pink">{copy.pwa.offlineTitle}</Marker>
      </h1>
      <p className="mt-4 max-w-xs text-ink-soft">{copy.pwa.offlineBody}</p>
      <Link href="/" className="mt-8 inline-flex h-11 items-center rounded-pill bg-ink px-5 font-medium text-white">
        {copy.pwa.retry}
      </Link>
    </main>
  );
}
