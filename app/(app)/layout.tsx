"use client";

import { Providers } from "@/components/auth/Providers";
import { AppShell } from "@/components/ui/AppShell";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AppShell>{children}</AppShell>
    </Providers>
  );
}
