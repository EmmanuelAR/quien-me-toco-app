import { ParticipantScreen } from "@/components/screens/ParticipantScreen";
import { notFound } from "next/navigation";

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  return <ParticipantScreen groupId={BigInt(id)} />;
}
