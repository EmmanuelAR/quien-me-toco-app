"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { copy } from "@/lib/copy/es-CR";
import { googleCalendarUrl } from "@/lib/calendar";
import { appUrl } from "@/lib/brand/links";
import type { Group } from "@/lib/contract/types";

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  );
}

/** "agregar al calendario": .ics (apple y otros) o google calendar */
export function AddToCalendar({ group, variant = "secondary" }: { group: Group; variant?: "secondary" | "ghost" }) {
  const [open, setOpen] = useState(false);
  const event = {
    groupId: group.id,
    name: group.name,
    eventAt: group.eventAt,
    place: group.place,
    budgetMin: group.budgetMin,
    budgetMax: group.budgetMax,
    currency: group.currency || "CRC",
    url: appUrl(`/g/${group.id.toString()}`),
  };
  return (
    <>
      <Button variant={variant} fullWidth leading={<CalendarIcon />} onClick={() => setOpen(true)}>
        {copy.calendar.add}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title={copy.calendar.add}>
        <div className="space-y-2 pb-2">
          <a
            href={googleCalendarUrl(event)}
            target="_blank"
            rel="noreferrer noopener"
            className="flex h-12 items-center justify-center rounded-pill bg-ink px-5 font-medium text-white"
          >
            {copy.calendar.google}
          </a>
          <a
            href={`/g/${group.id.toString()}/calendario.ics`}
            className="flex h-12 items-center justify-center rounded-pill border border-ink px-5 font-medium"
          >
            {copy.calendar.ics}
          </a>
        </div>
      </Sheet>
    </>
  );
}
