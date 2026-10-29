"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldControl } from "@/components/ui/Field";
import { AlertIcon, CloseIcon, PlusIcon } from "@/components/ui/icons";
import type { AppExclusion, AppMember } from "@/lib/app/types";
import { copy } from "@/lib/copy/es-CR";
import { isFeasible } from "@/lib/draw/assign";
import { cn } from "@/lib/cn";

export interface ExclusionsEditorProps {
  members: AppMember[];
  exclusions: AppExclusion[];
  locked: boolean;
  saving: boolean;
  onSave: (pairs: AppExclusion[]) => Promise<void>;
  onFeasibility?: (ok: boolean) => void;
}

const select = cn(
  fieldControl,
  "box-border h-12 min-w-0 flex-1 appearance-none px-3 pr-9 text-sm leading-none",
  "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20fill%3D%22none%22%20stroke%3D%22%231d1d1f%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m3%204.5%203%203%203-3%22%2F%3E%3C%2Fsvg%3E')]",
  "bg-[length:12px_12px] bg-[right_12px_center] bg-no-repeat",
);

export function ExclusionsEditor({
  members,
  exclusions,
  locked,
  saving,
  onSave,
  onFeasibility,
}: ExclusionsEditorProps) {
  const [pairs, setPairs] = useState<AppExclusion[]>(exclusions);
  const [aId, setAId] = useState(members[0]?.id ?? "");
  const [bId, setBId] = useState(members[1]?.id ?? "");

  const [syncedFrom, setSyncedFrom] = useState(exclusions);
  if (syncedFrom !== exclusions) {
    setSyncedFrom(exclusions);
    setPairs(exclusions);
  }

  const indexById = useMemo(() => new Map(members.map((m, i) => [m.id, i])), [members]);
  const feasible = useMemo(() => {
    if (members.length < 3) return true;
    const drawPairs: Array<[number, number]> = [];
    for (const p of pairs) {
      const a = indexById.get(p.aId);
      const b = indexById.get(p.bId);
      if (a === undefined || b === undefined) continue;
      drawPairs.push([a, b]);
    }
    return isFeasible({ n: members.length, pairs: drawPairs });
  }, [members.length, pairs, indexById]);

  useEffect(() => {
    onFeasibility?.(feasible);
  }, [feasible, onFeasibility]);

  const dirty = useMemo(() => JSON.stringify(pairs) !== JSON.stringify(exclusions), [pairs, exclusions]);

  const add = () => {
    if (!aId || !bId || aId === bId) return;
    const [x, y] = aId < bId ? [aId, bId] : [bId, aId];
    if (pairs.some((p) => p.aId === x && p.bId === y)) return;
    setPairs((prev) => [...prev, { aId: x, bId: y }]);
  };

  const nameOf = (id: string) => members.find((m) => m.id === id)?.name ?? "?";

  return (
    <section className="space-y-4" aria-label={copy.admin.exclusions}>
      <div>
        <h2 className="text-lg font-semibold">{copy.admin.exclusions}</h2>
        <p className="mt-1 text-sm text-pretty text-ink-soft">{copy.admin.exclusionsHint}</p>
      </div>

      {!feasible && (
        <p className="flex items-start gap-2 text-sm text-danger">
          <AlertIcon className="mt-0.5 size-4 shrink-0" />
          {copy.admin.infeasible}
        </p>
      )}

      {pairs.length > 0 && (
        <ul className="divide-y divide-line border-y border-line">
          {pairs.map((p) => (
            <li key={`${p.aId}-${p.bId}`} className="flex min-h-12 items-center justify-between gap-2">
              <span className="truncate text-sm">
                {nameOf(p.aId)} ↔ {nameOf(p.bId)}
              </span>
              {!locked && (
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={copy.admin.remove}
                  onClick={() => setPairs((prev) => prev.filter((x) => !(x.aId === p.aId && x.bId === p.bId)))}
                >
                  <CloseIcon className="size-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!locked && members.length >= 2 && (
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-stretch">
          <select
            aria-label={copy.admin.exclusionA}
            className={select}
            value={aId}
            onChange={(e) => setAId(e.target.value)}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select
            aria-label={copy.admin.exclusionB}
            className={select}
            value={bId}
            onChange={(e) => setBId(e.target.value)}
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            size="md"
            className="h-12 shrink-0 rounded-sm px-4 text-sm"
            onClick={add}
            leading={<PlusIcon className="size-4" />}
          >
            {copy.admin.exclusionsAdd}
          </Button>
        </div>
      )}

      {!locked && dirty && (
        <Button
          fullWidth
          disabled={saving || !feasible}
          onClick={() => void onSave(pairs)}
        >
          {copy.admin.exclusionsSave}
        </Button>
      )}
    </section>
  );
}
