"use client";

import { useState } from "react";
import { AlertIcon, CheckIcon } from "@/components/ui/icons";
import { copy } from "@/lib/copy/es-CR";
import { cn } from "@/lib/cn";

export interface RevealCardProps {
  receiverName: string;
  sealedOk: boolean;
  /** se recuerda que ya se destapó en este dispositivo */
  storageKey: string;
}

/** la tarjeta "¿Quién me tocó?": se toca y destapa el nombre, grande y en negro */
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
        "rounded-md bg-surface transition-transform duration-base ease-soft",
        animating && !revealed && "scale-[0.98]",
      )}
      aria-live="polite"
    >
      {!revealed ? (
        <button
          type="button"
          onClick={reveal}
          className="flex min-h-64 w-full flex-col items-center justify-center gap-2 rounded-md px-6 py-12 text-center"
        >
          <span className="text-xl font-semibold">{copy.participant.reveal}</span>
          <span className="text-sm text-ink-soft">{copy.participant.tap}</span>
        </button>
      ) : (
        <div className="animate-reveal flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center">
          <p className="text-ink-soft">{copy.participant.youGot}</p>
          <p className="mt-2 max-w-full text-4xl font-semibold text-balance break-words">{receiverName}</p>
          <p className="mt-4 text-sm text-ink-soft">{copy.participant.shh}</p>
          <p className="mt-8 flex items-start gap-1.5 text-left text-sm">
            {sealedOk ? <CheckIcon className="mt-0.5 size-4" /> : <AlertIcon className="mt-0.5 size-4" />}
            {sealedOk ? copy.participant.verifiedLocal : copy.verify.fail}
          </p>
        </div>
      )}
    </section>
  );
}
