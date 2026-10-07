"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Marker } from "@/components/ui/Marker";
import { Pill } from "@/components/ui/Pill";
import type { Exclusion, Participant } from "@/lib/contract/types";
import { copy } from "@/lib/copy/es-CR";
import { isFeasible } from "@/lib/draw/assign";

export interface ExclusionsEditorProps {
  participants: Participant[];
  exclusions: Exclusion[];
  previous?: Array<number | null>;
  locked: boolean;
  saving: boolean;
  onSave: (pairs: Exclusion[]) => Promise<void>;
  onFeasibility?: (ok: boolean) => void;
}

const select =
  "h-11 min-w-28 flex-1 rounded-md border border-line bg-white px-3 text-base focus:border-ink focus:outline-none disabled:opacity-50";

/** pares que no se pueden tocar entre sí; avisa al instante si con eso no sale el sorteo */
export function ExclusionsEditor({ participants, exclusions, previous, locked, saving, onSave, onFeasibility }: ExclusionsEditorProps) {
  const [pairs, setPairs] = useState<Exclusion[]>(exclusions);
  const [a, setA] = useState(0);
  const [b, setB] = useState(1);

  // si la cadena trae exclusiones nuevas, el borrador se reinicia (ajuste de estado durante el render)
  const [syncedFrom, setSyncedFrom] = useState(exclusions);
  if (syncedFrom !== exclusions) {
    setSyncedFrom(exclusions);
    setPairs(exclusions);
  }

  const feasible = useMemo(
    () => participants.length < 3 || isFeasible({ n: participants.length, pairs: pairs.map((p) => [p.a, p.b]), previous }),
    [participants.length, pairs, previous],
  );
  useEffect(() => {
    onFeasibility?.(feasible);
  }, [feasible, onFeasibility]);

  const dirty = useMemo(
    () => JSON.stringify(pairs) !== JSON.stringify(exclusions),
    [pairs, exclusions],
  );

  const add = () => {
    if (a === b) return;
    const [x, y] = a < b ? [a, b] : [b, a];
    if (pairs.some((p) => (p.a === x && p.b === y) || (p.a === y && p.b === x))) return;
    setPairs([...pairs, { a: x, b: y }]);
  };

  const name = (i: number) => participants[i]?.name ?? `#${i}`;

  return (
    <section className="space-y-3" aria-label={copy.admin.exclusions}>
      <div>
        <h3 className="text-lg font-semibold">{copy.admin.exclusions}</h3>
        <p className="text-sm text-ink-soft">{copy.admin.exclusionsHint}</p>
      </div>

      {pairs.length === 0 ? (
        <p className="text-sm text-ink-soft">{copy.admin.exclusionsEmpty}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {pairs.map((p) => (
            <li key={`${p.a}-${p.b}`}>
              <Pill tone="pink" className="pr-1">
                {name(p.a)} ↔ {name(p.b)}
                {!locked && (
                  <button
                    type="button"
                    aria-label={copy.admin.remove}
                    className="ml-1 flex size-6 items-center justify-center rounded-pill hover:bg-white/60"
                    onClick={() => setPairs(pairs.filter((q) => q !== p))}
                  >
                    ×
                  </button>
                )}
              </Pill>
            </li>
          ))}
        </ul>
      )}

      {!locked && participants.length >= 2 && (
        <div className="flex flex-wrap items-center gap-2">
          <select className={select} value={a} onChange={(e) => setA(Number(e.target.value))} aria-label="persona a">
            {participants.map((p, i) => (
              <option key={i} value={i}>
                {p.name}
              </option>
            ))}
          </select>
          <span className="text-ink-soft">↔</span>
          <select className={select} value={b} onChange={(e) => setB(Number(e.target.value))} aria-label="persona b">
            {participants.map((p, i) => (
              <option key={i} value={i}>
                {p.name}
              </option>
            ))}
          </select>
          <Button variant="secondary" className="h-11 px-3" onClick={add} disabled={a === b}>
            +
          </Button>
        </div>
      )}

      {!feasible && (
        <p className="text-sm">
          <Marker tone="pink">{copy.admin.infeasible}</Marker>
        </p>
      )}

      {!locked && dirty && (
        <Button fullWidth loading={saving} onClick={() => void onSave(pairs)}>
          {copy.admin.exclusionsSave}
        </Button>
      )}
    </section>
  );
}
