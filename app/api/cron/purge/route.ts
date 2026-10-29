import { jsonError, jsonOk } from "@/lib/api/http";
import { purgeExpiredGroups } from "@/lib/db/groups";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) return jsonError("unauthorized", 401);
  }
  try {
    await purgeExpiredGroups();
    return jsonOk({ ok: true });
  } catch (e) {
    console.error(e);
    return jsonError("error", 500);
  }
}
