"use client";

import { ApproveDevicePage } from "@cavos/kit/react";
import { cavosConfig } from "@/components/cavos/Providers";

/**
 * página a la que llega el correo "un teléfono nuevo quiere entrar" de cavos.
 * la url (origen + /approve-device) se configura como device_approval_url en el dashboard.
 */
export default function Page() {
  return (
    <main className="safe-x safe-top safe-bottom mx-auto w-full max-w-md flex-1 [&_button]:mt-4 [&_button]:h-11 [&_button]:rounded-pill [&_button]:bg-ink [&_button]:px-5 [&_button]:text-white [&_h1]:text-xl [&_h1]:font-semibold [&_p]:mt-2 [&_p]:text-ink-soft">
      <ApproveDevicePage configs={[cavosConfig]} />
    </main>
  );
}
