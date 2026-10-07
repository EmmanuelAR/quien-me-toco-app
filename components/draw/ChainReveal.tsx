"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { copy } from "@/lib/copy/es-CR";
import { cycles } from "@/lib/draw/assign";

export interface ChainRevealProps {
  names: string[];
  receivers: number[];
  onDone?: () => void;
}

type Step = { giver: number; receiver: number; cycleStart: boolean };

/**
 * revelación final tipo cadena: sigue los ciclos de la permutación
 * (a → b → c → a) destapando una pareja a la vez. para pasar el celular o ponerlo en una tele.
 */
export function ChainReveal({ names, receivers, onDone }: ChainRevealProps) {
  const steps = useMemo(() => {
    const out: Step[] = [];
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

  // cada ciclo va en su propio bloque, para que se note dónde se cierra la cadena
  const shownCycles = useMemo(() => {
    const out: Step[][] = [];
    for (const st of steps.slice(0, shown)) {
      if (st.cycleStart || out.length === 0) out.push([]);
      out[out.length - 1].push(st);
    }
    return out;
  }, [steps, shown]);

  const done = shown >= steps.length;

  return (
    <section className="space-y-8" aria-live="polite">
      {shownCycles.length > 0 && (
        <div className="space-y-6">
          {shownCycles.map((cycle) => (
            <ol key={cycle[0].giver} className="divide-y divide-line border-y border-line">
              {cycle.map((st) => (
                <li
                  key={`${st.giver}-${st.receiver}`}
                  className="animate-reveal grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-baseline gap-3 py-4"
                >
                  <span className="truncate">{names[st.giver]}</span>
                  <span className="text-xs text-ink-soft">{copy.finalReveal.gaveTo}</span>
                  <span className="truncate text-right font-semibold">{names[st.receiver]}</span>
                </li>
              ))}
            </ol>
          ))}
        </div>
      )}

      {!done && (
        <div className="flex gap-2">
          <Button size="lg" fullWidth onClick={() => setShown((s) => s + 1)}>
            {shown === 0 ? copy.finalReveal.start : copy.finalReveal.next}
          </Button>
          <Button size="lg" variant="secondary" onClick={() => setAuto((a) => !a)} aria-pressed={auto}>
            {auto ? copy.finalReveal.pause : copy.finalReveal.auto}
          </Button>
        </div>
      )}
    </section>
  );
}
