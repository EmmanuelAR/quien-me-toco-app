import type { Metadata } from "next";
import { CreateGroupScreen } from "@/components/screens/CreateGroupScreen";
import { copy } from "@/lib/copy/es-CR";

export const metadata: Metadata = { title: copy.create.title };

export default async function NewGroupPage({ searchParams }: { searchParams: Promise<{ desde?: string }> }) {
  const { desde } = await searchParams;
  const repeatFromId = desde && /^\d+$/.test(desde) ? BigInt(desde) : null;
  return <CreateGroupScreen repeatFromId={repeatFromId} />;
}
