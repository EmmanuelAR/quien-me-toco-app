"use client";

import { useState } from "react";
import { Marker } from "@/components/ui/Marker";
import { Pill } from "@/components/ui/Pill";
import { copy } from "@/lib/copy/es-CR";
import { cn } from "@/lib/cn";

export interface RevealCardProps {
  receiverName: string;
  sealedOk: boolean;
  /** se recuerda que ya se destapó en este dispositivo */
  storageKey: string;
}

/** la tarjeta "¿quién me tocó?": se toca y destapa el nombre con una animación */
export function RevealCard({ receiverName, sealedOk, storageKey }: RevealCardProps) {
  const [revealed, setRevealed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(storageKey) === "1";
  });
  const [animating, setAnimating] = useState(false);

  const reveal = () => {
    if (revealed) return;
    setAnimating(true);
    window.setTimeout(() => {
      setRevealed(true);
      localStorage.setItem(storageKey, "1");
    }, 450);
  };

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-md border border-line bg-white p-6 text-center shadow-card transition-transform duration-base ease-soft",
        animating && !revealed && "scale-[0.97]",
      )}
      aria-live="polite"
    >
      {!revealed ? (
        <button type="button" onClick={reveal} className="flex w-full flex-col items-center gap-3 py-6" aria-label={copy.participant.tap}>
          <span className="text-2xl font-semibold">
            <Marker>{copy.participant.reveal}</Marker>
          </span>
          <span className="text-sm text-ink-soft">{copy.participant.tap}</span>
        </button>
      ) : (
        <div className="animate-pop flex flex-col items-center gap-3 py-4">
          <p className="text-ink-soft">{copy.participant.youGot}</p>
          <p className="text-2xl font-semibold leading-tight">
            <Marker tone="pink">{receiverName}</Marker>
          </p>
          <p className="text-sm text-ink-soft">{copy.participant.shh}</p>
          <Pill tone={sealedOk ? "blue" : "pink"} dot className="mt-2">
            {sealedOk ? copy.participant.verifiedLocal : copy.verify.fail}
          </Pill>
        </div>
      )}
    </section>
  );
}
