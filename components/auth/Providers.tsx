"use client";

import type { ReactNode } from "react";

/** shell de cliente; la sesión vive en cookies vía Better Auth / Neon */
export function Providers({ children }: { children: ReactNode }) {
  return children;
}
