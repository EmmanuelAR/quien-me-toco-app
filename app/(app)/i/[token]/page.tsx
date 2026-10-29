import type { Metadata } from "next";
import { InviteScreen } from "@/components/screens/InviteScreen";
import { copy } from "@/lib/copy/es-CR";

type Params = Promise<{ token: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { token } = await params;
  return {
    title: copy.app.name,
    description: "Te invitaron a un amigo secreto. Apuntate aquí.",
    openGraph: { title: copy.app.name, description: "Te invitaron a un amigo secreto.", type: "website" },
  };
}

export default async function InvitePage({ params }: { params: Params }) {
  const { token } = await params;
  return <InviteScreen token={decodeURIComponent(token)} />;
}
