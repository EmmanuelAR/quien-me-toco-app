"use client";

import { Providers } from "@/components/cavos/Providers";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
