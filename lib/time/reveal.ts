/** Zona de la app para “día del intercambio”. */
export const APP_TZ = "America/Costa_Rica";

/** YYYY-MM-DD en la zona de la app (sirve para comparar días). */
export function calendarDayKey(date: Date, timeZone: string = APP_TZ): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Reveal habilitado desde las 00:00 del día del evento (America/Costa_Rica). */
export function canRevealNow(eventAt: Date, now: Date = new Date()): boolean {
  return calendarDayKey(now) >= calendarDayKey(eventAt);
}
