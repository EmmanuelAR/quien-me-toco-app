import type { Metadata } from "next";
import { InviteScreen } from "@/components/screens/InviteScreen";
import { slugToInviteCode } from "@/lib/contract/calls";
import { readGroupSafe } from "@/lib/contract/reads";
import { copy } from "@/lib/copy/es-CR";
import { formatDate } from "@/lib/format";

type Params = Promise<{ id: string; code: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const group = /^\d+$/.test(id) ? await readGroupSafe(BigInt(id)).catch(() => null) : null;
  if (!group) return { title: copy.app.name };
  const title = copy.invite.title(group.name);
  const description = `amigo secreto el ${formatDate(group.eventAt, { timeZone: "America/Costa_Rica" })}. apuntate aquí.`;
  return {
    title,
    description,
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function InvitePage({ params }: { params: Params }) {
  const { id, code } = await params;
  const groupId = /^\d+$/.test(id) ? BigInt(id) : 0n;
  return <InviteScreen groupId={groupId} inviteCode={slugToInviteCode(code)} />;
}
