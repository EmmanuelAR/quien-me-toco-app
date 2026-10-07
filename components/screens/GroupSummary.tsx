import { Pill } from "@/components/ui/Pill";
import { Marker } from "@/components/ui/Marker";
import { GroupStatus, type Group } from "@/lib/contract/types";
import { copy } from "@/lib/copy/es-CR";
import { formatBudget, formatDate } from "@/lib/format";

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

export function StatusPill({ status }: { status: Group["status"] }) {
  const tone = status === GroupStatus.Revealed ? "pink" : status >= GroupStatus.Drawn ? "blue" : "neutral";
  return (
    <Pill tone={tone} dot>
      {statusLabel(status)}
    </Pill>
  );
}

export function GroupSummary({ group, compact = false }: { group: Group; compact?: boolean }) {
  return (
    <section className="space-y-2">
      {!compact && (
        <h2 className="text-xl font-semibold leading-tight">
          <Marker>{group.name}</Marker>
        </h2>
      )}
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-ink-soft">{copy.participant.when}</dt>
        <dd>{formatDate(group.eventAt, { withTime: true })}</dd>
        {group.place && (
          <>
            <dt className="text-ink-soft">{copy.participant.where}</dt>
            <dd>{group.place}</dd>
          </>
        )}
        <dt className="text-ink-soft">presupuesto</dt>
        <dd>{formatBudget(group.budgetMin, group.budgetMax, group.currency || "CRC")}</dd>
        {group.rules && (
          <>
            <dt className="text-ink-soft">reglas</dt>
            <dd className="whitespace-pre-wrap">{group.rules}</dd>
          </>
        )}
      </dl>
    </section>
  );
}
