"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldControl } from "@/components/ui/Field";
import { AlertIcon, CloseIcon, PlusIcon } from "@/components/ui/icons";
import type { Exclusion, Participant } from "@/lib/contract/types";
import { copy } from "@/lib/copy/es-CR";
import { isFeasible } from "@/lib/draw/assign";
import { cn } from "@/lib/cn";

export interface ExclusionsEditorProps {
  participants: Participant[];
  exclusions: Exclusion[];
  previous?: Array<number | null>;
  locked: boolean;
  saving: boolean;
  onSave: (pairs: Exclusion[]) => Promise<void>;
  onFeasibility?: (ok: boolean) => void;
}

const select = cn(fieldControl, "h-12 min-w-0 flex-1 px-3");

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
    <section className="space-y-4" aria-label={copy.admin.exclusions}>
      <div>
        <h2 className="text-lg font-semibold">{copy.admin.exclusions}</h2>
        <p className="mt-1 text-sm text-pretty text-ink-soft">{copy.admin.exclusionsHint}</p>
      </div>

      {pairs.length === 0 ? (
        <p className="text-sm text-ink-soft">{copy.admin.exclusionsEmpty}</p>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {pairs.map((p) => (
            <li key={`${p.a}-${p.b}`} className="flex min-h-14 items-center justify-between gap-3">
              <span className="min-w-0 truncate">
                {name(p.a)} <span className="text-ink-soft">↔</span> {name(p.b)}
              </span>
              {!locked && (
                <button
                  type="button"
                  aria-label={copy.admin.removeExclusion(name(p.a), name(p.b))}
                  className="-mr-3 flex size-11 shrink-0 items-center justify-center rounded-pill text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
                  onClick={() => setPairs(pairs.filter((q) => q !== p))}
                >
                  <CloseIcon className="size-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!locked && participants.length >= 2 && (
        <div className="flex items-center gap-2">
          <select className={select} value={a} onChange={(e) => setA(Number(e.target.value))} aria-label={copy.admin.exclusionA}>
            {participants.map((p, i) => (
              <option key={i} value={i}>
                {p.name}
              </option>
            ))}
          </select>
          <span className="text-ink-soft" aria-hidden="true">
            ↔
          </span>
          <select className={select} value={b} onChange={(e) => setB(Number(e.target.value))} aria-label={copy.admin.exclusionB}>
            {participants.map((p, i) => (
              <option key={i} value={i}>
                {p.name}
              </option>
            ))}
          </select>
          <Button variant="secondary" className="size-12 shrink-0 px-0" onClick={add} disabled={a === b} aria-label={copy.admin.exclusionsAdd}>
            <PlusIcon />
          </Button>
        </div>
      )}

      {!feasible && (
        <p className="flex items-start gap-1.5 text-sm">
          <AlertIcon className="mt-0.5 size-4" />
          {copy.admin.infeasible}
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
