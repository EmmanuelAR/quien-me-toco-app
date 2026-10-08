import type { Metadata } from "next";
import { GhostScreen } from "@/components/screens/GhostScreen";
import { copy } from "@/lib/copy/es-CR";

export const metadata: Metadata = { title: copy.ghost.title, robots: { index: false, follow: false } };

export default async function GhostPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <GhostScreen token={token} />;
}
