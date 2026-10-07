import { redeemGhostLink } from "@/lib/server/ghost";
import { handleError, json } from "@/lib/server/http";

/**
 * canjea un link privado de un participante sin cuenta.
 * ?device=… permite reabrirlo en el mismo teléfono después del primer uso.
 */
export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await ctx.params;
    if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return json({ kind: "invalid" }, 404);
    const device = new URL(req.url).searchParams.get("device");
    const view = await redeemGhostLink(token, device);
    const status = view.kind === "invalid" ? 404 : view.kind === "used" ? 410 : 200;
    return json(view, status);
  } catch (e) {
    return handleError(e);
  }
}
