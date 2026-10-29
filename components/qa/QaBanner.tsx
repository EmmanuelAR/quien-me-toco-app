"use client";

import { setQaPersona } from "@/lib/auth/client";
import { QA_PERSONA_COOKIE, parseQaPersona, qaAuthBypassPublicEnabled } from "@/lib/auth/qa";
import { useEffect, useState } from "react";

export function QaBanner() {
  const [persona, setPersona] = useState("host");

  useEffect(() => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${QA_PERSONA_COOKIE}=([^;]*)`));
    setPersona(parseQaPersona(match?.[1] ? decodeURIComponent(match[1]) : null));
  }, []);

  if (!qaAuthBypassPublicEnabled()) return null;

  return (
    <div className="border-b border-amber-500/40 bg-amber-50 px-3 py-2 text-sm text-amber-950">
      <div className="safe-x mx-auto flex max-w-5xl flex-wrap items-center gap-2 lg:px-2">
        <span className="font-semibold">QA bypass ON</span>
        <span className="text-amber-800/80">persona:</span>
        {(["host", "guest", "off"] as const).map((p) => (
          <button
            key={p}
            type="button"
            className={
              persona === p
                ? "rounded bg-amber-900 px-2 py-0.5 font-medium text-amber-50"
                : "rounded bg-amber-100 px-2 py-0.5 text-amber-900 underline-offset-2 hover:underline"
            }
            onClick={() => void setQaPersona(p)}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
