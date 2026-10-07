import { GroupStatus, type Group } from "@/lib/contract/types";
import { copy } from "@/lib/copy/es-CR";
import { capitalize, formatBudget, formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

export function statusLabel(status: Group["status"]): string {
  switch (status) {
    case GroupStatus.Open:
      return copy.status.open;
    case GroupStatus.Closed:
      return copy.status.closed;
    case GroupStatus.DrawRequested:
      return copy.status.drawRequested;
    case GroupStatus.Drawn:
      return copy.status.drawn;
    case GroupStatus.RevealRequested:
      return copy.status.revealRequested;
    case GroupStatus.Revealed:
      return copy.status.revealed;
  }
}

/** los cuatro pasos que se ven; "sorteando…" y "revelando…" ocupan el lugar del paso que viene */
const STEPS = [GroupStatus.Open, GroupStatus.Closed, GroupStatus.Drawn, GroupStatus.Revealed] as const;

function currentStep(status: Group["status"]): number {
  if (status >= GroupStatus.RevealRequested) return 3;
  if (status >= GroupStatus.DrawRequested) return 2;
  return status === GroupStatus.Closed ? 1 : 0;
}

/** en qué va el grupo. compact: solo las rayitas y el paso actual, para las listas */
export function GroupProgress({ status, compact = false }: { status: Group["status"]; compact?: boolean }) {
  const current = currentStep(status);
  const bar = (i: number) => cn("rounded-pill", i <= current ? "bg-ink" : "bg-line");

  if (compact) {
    return (
      <span className="inline-flex items-center gap-2.5">
        <span className="flex gap-1" aria-hidden="true">
          {STEPS.map((step, i) => (
            <span key={step} className={cn("h-1 w-4", bar(i))} />
          ))}
        </span>
        <span className="text-sm text-ink-soft">{statusLabel(status)}</span>
      </span>
    );
  }

  return (
    <ol className="grid grid-cols-4 gap-1.5" aria-label={copy.status.progress}>
      {STEPS.map((step, i) => (
        <li key={step} className="min-w-0" aria-current={i === current ? "step" : undefined}>
          <span aria-hidden="true" className={cn("block h-1", bar(i))} />
          <span className={cn("mt-2 block truncate text-xs", i === current ? "font-semibold text-ink" : "text-ink-soft")}>
            {i === current ? statusLabel(status) : statusLabel(step)}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** filas de dato y valor separadas por una línea fina */
export function DetailList({ rows }: { rows: Array<[label: string, value: string]> }) {
  return (
    <dl className="divide-y divide-line border-y border-line">
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[7rem_1fr] gap-3 py-3.5">
          <dt className="text-ink-soft">{label}</dt>
          <dd className="min-w-0 whitespace-pre-wrap break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function GroupSummary({ group }: { group: Group }) {
  const rows: Array<[string, string]> = [[copy.participant.when, capitalize(formatDate(group.eventAt, { withTime: true }))]];
  if (group.place) rows.push([copy.participant.where, group.place]);
  rows.push([copy.participant.budgetLabel, formatBudget(group.budgetMin, group.budgetMax, group.currency || "CRC")]);
  if (group.rules) rows.push([copy.participant.rulesLabel, group.rules]);
  return <DetailList rows={rows} />;
}
