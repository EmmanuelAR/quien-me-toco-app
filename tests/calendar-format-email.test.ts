import { describe, expect, it } from "vitest";
import { render } from "@react-email/components";
import { createElement } from "react";
import { buildIcs, googleCalendarUrl } from "@/lib/calendar";
import { formatBudget, formatDate, formatDateTimeLong, formatMoney } from "@/lib/format";
import { TeToco } from "@/emails/TeToco";
import { colors } from "@/lib/brand/tokens";

const event = {
  groupId: 5n,
  name: "navidad familia aguero",
  eventAt: Date.UTC(2026, 11, 24, 2, 0, 0) / 1000, // 23 dic 8pm costa rica
  place: "casa de la abuela",
  budgetMin: 5000,
  budgetMax: 10000,
  currency: "CRC",
  url: "https://quienmetoco.ear.dev/g/5",
};

describe("calendario", () => {
  it("genera un .ics válido con fecha, lugar y presupuesto", () => {
    const ics = buildIcs(event, new Date(Date.UTC(2026, 10, 1)));
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("DTSTART:20261224T020000Z");
    expect(ics).toContain("DTEND:20261224T040000Z");
    expect(ics).toContain("SUMMARY:intercambio: navidad familia aguero");
    expect(ics).toContain("LOCATION:casa de la abuela");
    expect(ics).toContain("UID:qmt-5@quienmetoco");
    expect(ics).toMatch(/DESCRIPTION:.*presupuesto/);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    // ninguna línea pasa de 75 bytes
    for (const line of ics.split("\r\n")) expect(Buffer.byteLength(line)).toBeLessThanOrEqual(75);
  });

  it("arma el link de google calendar", () => {
    const url = new URL(googleCalendarUrl(event));
    expect(url.hostname).toBe("calendar.google.com");
    expect(url.searchParams.get("dates")).toBe("20261224T020000Z/20261224T040000Z");
    expect(url.searchParams.get("location")).toBe("casa de la abuela");
    expect(url.searchParams.get("text")).toBe("intercambio: navidad familia aguero");
  });
});

describe("formato es-cr", () => {
  it("fechas y plata en minúsculas", () => {
    const d = formatDate(event.eventAt, { withTime: true, timeZone: "America/Costa_Rica" });
    expect(d).toBe(d.toLowerCase());
    expect(d).toContain("diciembre");
    expect(formatDateTimeLong(event.eventAt, "America/Costa_Rica")).toContain("a las");
    expect(formatMoney(5000, "CRC")).toMatch(/5/);
    expect(formatBudget(5000, 10000, "CRC")).toContain(" a ");
    expect(formatBudget(5000, 5000, "CRC")).not.toContain(" a ");
  });
});

describe("correo te tocó", () => {
  it("renderiza con el nombre, el marcador y el pie de @ear.dev", async () => {
    const html = await render(
      createElement(TeToco, {
        appUrl: "https://quienmetoco.ear.dev",
        groupUrl: "https://quienmetoco.ear.dev/g/5",
        giverName: "ana",
        receiverName: "beto",
        groupName: "navidad",
        when: "miércoles 23 de diciembre 8:00 p. m.",
        place: "casa de la abuela",
        budget: "₡5000 a ₡10 000",
      }),
    );
    expect(html).toContain("te tocó");
    expect(html).toContain("beto");
    expect(html).toContain(colors.markerBlue);
    expect(html).toContain("instagram.com/ear.dev");
    expect(html).not.toMatch(/[\u{1F300}-\u{1FAFF}]/u);
    const text = await render(
      createElement(TeToco, {
        appUrl: "https://x",
        groupUrl: "https://x/g/5",
        giverName: "ana",
        receiverName: "beto",
        groupName: "navidad",
        when: "hoy",
        place: "",
        budget: "₡5000",
      }),
      { plainText: true },
    );
    expect(text).toContain("ana, te tocó beto");
  });
});
