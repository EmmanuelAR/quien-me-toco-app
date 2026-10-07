import { formatBudget } from "./format";

/** evento de calendario del intercambio: .ics y link a google calendar */
export interface CalendarEvent {
  groupId: bigint;
  name: string;
  eventAt: number; // unix seconds
  durationMinutes?: number;
  place: string;
  budgetMin: number;
  budgetMax: number;
  currency?: string;
  url: string;
}

function icsDate(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcs(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** corta líneas a 75 bytes como pide rfc 5545 */
function fold(line: string): string {
  const out: string[] = [];
  let current = "";
  for (const ch of line) {
    if (Buffer.byteLength(current + ch, "utf8") > 73) {
      out.push(current);
      current = " " + ch;
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out.join("\r\n");
}

export function describeEvent(e: CalendarEvent): string {
  const lines = [`intercambio de regalos: ${e.name}`, `presupuesto: ${formatBudget(e.budgetMin, e.budgetMax, e.currency)}`];
  if (e.place) lines.push(`lugar: ${e.place}`);
  lines.push(`¿quién me tocó?: ${e.url}`);
  return lines.join("\n");
}

export function buildIcs(e: CalendarEvent, now = new Date()): string {
  const start = e.eventAt;
  const end = e.eventAt + (e.durationMinutes ?? 120) * 60;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ear.dev//quien me toco//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:qmt-${e.groupId.toString()}@quienmetoco`,
    `DTSTAMP:${icsDate(Math.floor(now.getTime() / 1000))}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${escapeIcs(`intercambio: ${e.name}`)}`,
    `DESCRIPTION:${escapeIcs(describeEvent(e))}`,
    ...(e.place ? [`LOCATION:${escapeIcs(e.place)}`] : []),
    `URL:${e.url}`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcs("mañana es el intercambio. ¿ya tenés el regalo?")}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function googleCalendarUrl(e: CalendarEvent): string {
  const start = icsDate(e.eventAt);
  const end = icsDate(e.eventAt + (e.durationMinutes ?? 120) * 60);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `intercambio: ${e.name}`,
    dates: `${start}/${end}`,
    details: describeEvent(e),
    ...(e.place ? { location: e.place } : {}),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
