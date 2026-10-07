"use client";

import { RevokeDevicePage } from "@cavos/kit/react";
import { cavosConfig } from "@/components/cavos/Providers";

/** "esto no fui yo": revoca un teléfono desde el link del correo de cavos */
export default function Page() {
  return (
    <main className="safe-x safe-top safe-bottom mx-auto w-full max-w-md flex-1 [&_button]:mt-4 [&_button]:h-11 [&_button]:rounded-pill [&_button]:bg-ink [&_button]:px-5 [&_button]:text-white [&_h1]:text-xl [&_h1]:font-semibold [&_p]:mt-2 [&_p]:text-ink-soft">
      <RevokeDevicePage configs={[cavosConfig]} />
    </main>
  );
}
