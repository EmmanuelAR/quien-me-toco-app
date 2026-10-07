"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Marker } from "@/components/ui/Marker";
import { copy } from "@/lib/copy/es-CR";
import { cycles } from "@/lib/draw/assign";
import { cn } from "@/lib/cn";

export interface ChainRevealProps {
  names: string[];
  receivers: number[];
  onDone?: () => void;
}

/**
 * revelación final tipo cadena: sigue los ciclos de la permutación
 * (a → b → c → a) destapando una pareja a la vez. para pasar el celular o ponerlo en una tele.
 */
export function ChainReveal({ names, receivers, onDone }: ChainRevealProps) {
  const steps = useMemo(() => {
    const out: Array<{ giver: number; receiver: number; cycleStart: boolean }> = [];
    for (const cycle of cycles(receivers)) {
      cycle.forEach((giver, i) => out.push({ giver, receiver: receivers[giver], cycleStart: i === 0 }));
    }
    return out;
  }, [receivers]);

  const [shown, setShown] = useState(0);
  const [auto, setAuto] = useState(false);

  useEffect(() => {
    if (!auto || shown >= steps.length) return;
    const t = window.setTimeout(() => setShown((s) => s + 1), 1800);
    return () => window.clearTimeout(t);
  }, [auto, shown, steps.length]);

  useEffect(() => {
    if (shown >= steps.length && steps.length > 0) onDone?.();
  }, [shown, steps.length, onDone]);

  const done = shown >= steps.length;

  return (
    <section className="space-y-4" aria-live="polite">
      <ol className="space-y-2">
        {steps.slice(0, shown).map((st, i) => (
          <li
            key={`${st.giver}-${st.receiver}`}
            className={cn(
              "animate-pop flex items-center justify-between gap-3 rounded-md border border-line bg-white px-4 py-3 shadow-card",
              st.cycleStart && i > 0 && "mt-5",
            )}
          >
            <span className="min-w-0 truncate font-medium">{names[st.giver]}</span>
            <span className="shrink-0 text-xs text-ink-soft">{copy.finalReveal.gaveTo}</span>
            <span className="min-w-0 truncate text-right font-semibold">
              <Marker tone={i % 2 === 0 ? "blue" : "pink"}>{names[st.receiver]}</Marker>
            </span>
          </li>
        ))}
      </ol>

      {!done ? (
        <div className="flex gap-2">
          <Button size="lg" fullWidth onClick={() => setShown((s) => s + 1)}>
            {shown === 0 ? copy.finalReveal.start : copy.finalReveal.next}
          </Button>
          <Button size="lg" variant="secondary" onClick={() => setAuto((a) => !a)} aria-pressed={auto}>
            {auto ? "pausa" : "solo"}
          </Button>
        </div>
      ) : (
        <p className="text-center text-ink-soft">{copy.finalReveal.done}</p>
      )}
    </section>
  );
}
