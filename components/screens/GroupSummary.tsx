import type { AppGroup, GroupStatus } from "@/lib/app/types";
import { copy } from "@/lib/copy/es-CR";
import { capitalize, formatBudget, formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

export function statusLabel(status: GroupStatus): string {
  switch (status) {
    case "open":
      return copy.status.open;
    case "closed":
      return copy.status.closed;
    case "drawn":
      return copy.status.drawn;
    case "revealed":
      return copy.status.revealed;
  }
}

const STEPS: GroupStatus[] = ["open", "closed", "drawn", "revealed"];

function currentStep(status: GroupStatus): number {
  return STEPS.indexOf(status);
}

export function GroupProgress({ status, compact = false }: { status: GroupStatus; compact?: boolean }) {
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

export function GroupSummary({ group }: { group: Pick<AppGroup, "eventAt" | "place" | "budgetMin" | "budgetMax" | "currency" | "rules"> }) {
  const rows: Array<[string, string]> = [[copy.participant.when, capitalize(formatDate(group.eventAt, { withTime: true }))]];
  if (group.place) rows.push([copy.participant.where, group.place]);
  if (group.budgetMax > 0) {
    rows.push([copy.participant.budgetLabel, formatBudget(group.budgetMin, group.budgetMax, group.currency)]);
  }
  if (group.rules) rows.push([copy.participant.rulesLabel, group.rules]);
  return <DetailList rows={rows} />;
}
