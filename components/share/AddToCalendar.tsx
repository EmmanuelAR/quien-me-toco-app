"use client";

import { useState } from "react";
import { Button, buttonClass } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { copy } from "@/lib/copy/es-CR";
import { googleCalendarUrl } from "@/lib/calendar";
import { appUrl } from "@/lib/brand/links";

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  );
}

export function AddToCalendar({
  groupId,
  name,
  eventAt,
  place,
  budgetMin = 0,
  budgetMax = 0,
  currency = "CRC",
  variant = "secondary",
}: {
  groupId: string;
  name: string;
  eventAt: number;
  place: string;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  variant?: "secondary" | "ghost";
}) {
  const [open, setOpen] = useState(false);
  const event = {
    groupId,
    name,
    eventAt,
    place,
    budgetMin,
    budgetMax,
    currency,
    url: appUrl(`/g/${groupId}`),
  };
  return (
    <>
      <Button variant={variant} fullWidth leading={<CalendarIcon />} onClick={() => setOpen(true)}>
        {copy.calendar.add}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title={copy.calendar.add}>
        <div className="space-y-3 pb-2">
          <a
            className={buttonClass({ variant: "secondary", size: "lg", fullWidth: true })}
            href={`/g/${groupId}/calendario.ics`}
          >
            {copy.calendar.ics}
          </a>
          <a
            className={buttonClass({ variant: "secondary", size: "lg", fullWidth: true })}
            href={googleCalendarUrl(event)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {copy.calendar.google}
          </a>
        </div>
      </Sheet>
    </>
  );
}
