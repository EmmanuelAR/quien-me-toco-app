/**
 * fechas y plata en español de costa rica. las fechas salen en minúscula para ir
 * en medio de una frase ("se habilita el 23 de diciembre"); si van solas, pasan por capitalize.
 */

const LOCALE = "es-CR";

export function capitalize(text: string): string {
  return text.charAt(0).toLocaleUpperCase(LOCALE) + text.slice(1);
}

export function formatDate(unixSeconds: number, opts: { withTime?: boolean; timeZone?: string } = {}): string {
  const d = new Date(unixSeconds * 1000);
  const text = new Intl.DateTimeFormat(LOCALE, {
    weekday: "long",
    day: "numeric",
    month: "long",
    ...(opts.withTime ? { hour: "numeric", minute: "2-digit" } : {}),
    ...(opts.timeZone ? { timeZone: opts.timeZone } : {}),
  }).format(d);
  // node y el navegador no ponen el mismo espacio antes de "p. m."; si difieren, react no hidrata
  return text.toLowerCase().replace(",", "").replace(/\s/g, " ");
}

export function formatDateShort(unixSeconds: number, timeZone?: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    ...(timeZone ? { timeZone } : {}),
  })
    .format(new Date(unixSeconds * 1000))
    .toLowerCase()
    .replace(".", "");
}

export function formatTime(unixSeconds: number, timeZone?: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: "numeric",
    minute: "2-digit",
    ...(timeZone ? { timeZone } : {}),
  })
    .format(new Date(unixSeconds * 1000))
    .toLowerCase()
    .replace(/\s/g, " ");
}

export function formatMoney(amount: number, currency = "CRC"): string {
  try {
    return new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace(/\u00a0/g, " ");
  } catch {
    return `${amount} ${currency}`;
  }
}

export function formatBudget(min: number, max: number, currency = "CRC"): string {
  if (min === max) return formatMoney(max, currency);
  return `${formatMoney(min, currency)} a ${formatMoney(max, currency)}`;
}

/** "3 de diciembre a las 8:14 pm" */
export function formatDateTimeLong(unixSeconds: number, timeZone?: string): string {
  const d = new Date(unixSeconds * 1000);
  const date = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long", ...(timeZone ? { timeZone } : {}) }).format(d);
  return `${date} a las ${formatTime(unixSeconds, timeZone)}`.toLowerCase();
}

export function toDatetimeLocalValue(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string): number {
  return Math.floor(new Date(value).getTime() / 1000);
}

export function shortAddress(addr: string): string {
  return addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;
}
