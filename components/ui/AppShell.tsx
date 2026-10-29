import type { ReactNode } from "react";
import { AppBar } from "@/components/ui/AppBar";
import { AppFooter } from "@/components/ui/AppFooter";

/** marco de la app: barra superior + contenido + pie */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppBar />
      <div className="flex flex-1 flex-col">{children}</div>
      <AppFooter />
    </div>
  );
}
