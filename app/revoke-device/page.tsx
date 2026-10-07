"use client";

import { RevokeDevicePage } from "@cavos/kit/react";
import { cavosConfig } from "@/components/cavos/Providers";

/** "esto no fui yo": revoca un teléfono desde el link del correo de cavos */
export default function Page() {
  return (
    <main className="safe-x safe-top safe-bottom mx-auto w-full max-w-md flex-1 pt-16 [&_button]:mt-8 [&_button]:h-14 [&_button]:w-full [&_button]:rounded-pill [&_button]:bg-ink [&_button]:px-7 [&_button]:font-medium [&_button]:text-white [&_h1]:text-2xl [&_h1]:font-semibold [&_p]:mt-3 [&_p]:text-ink-soft">
      <RevokeDevicePage configs={[cavosConfig]} />
    </main>
  );
}
