import { buildIcs } from "@/lib/calendar";
import { readGroupSafe } from "@/lib/contract/reads";
import { parseGroupId } from "@/lib/server/http";

/** el evento del intercambio como archivo .ics (apple calendar, outlook, etc.) */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const groupId = parseGroupId(id);
  const group = groupId ? await readGroupSafe(groupId) : null;
  if (!group) return new Response("no existe", { status: 404 });
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(_req.url).origin;
  const ics = buildIcs({
    groupId: group.id,
    name: group.name,
    eventAt: group.eventAt,
    place: group.place,
    budgetMin: group.budgetMin,
    budgetMax: group.budgetMax,
    currency: group.currency || "CRC",
    url: `${appUrl}/g/${group.id.toString()}`,
  });
  return new Response(ics, {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="intercambio-${group.id.toString()}.ics"`,
      "cache-control": "no-store",
    },
  });
}
