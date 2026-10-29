import { buildIcs } from "@/lib/calendar";
import { getGroup } from "@/lib/db/groups";

export const dynamic = "force-dynamic";

/** el evento del intercambio como archivo .ics (apple calendar, outlook, etc.) */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const group = await getGroup(id).catch(() => null);
  if (!group || group.archived) return new Response("no existe", { status: 404 });
  const eventAt = Math.floor(new Date(group.event_at).getTime() / 1000);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(_req.url).origin;
  const ics = buildIcs({
    groupId: group.id,
    name: group.name,
    eventAt,
    place: group.place,
    budgetMin: group.budget_min,
    budgetMax: group.budget_max,
    currency: group.currency || "CRC",
    url: `${appUrl}/g/${group.id}`,
  });
  return new Response(ics, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="intercambio-${group.id}.ics"`,
      "cache-control": "no-store",
    },
  });
}
