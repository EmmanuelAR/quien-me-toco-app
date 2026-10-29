import { jsonError, jsonOk } from "@/lib/api/http";
import { sendUpcomingReminders } from "@/lib/mail/notify-reminder";

export const dynamic = "force-dynamic";

/** cron: recordatorios ~36h antes del evento (requiere CRON_SECRET) */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return jsonError("misconfigured", 503);
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) return jsonError("unauthorized", 401);
  try {
    const result = await sendUpcomingReminders();
    return jsonOk({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    return jsonError("error", 500);
  }
}
