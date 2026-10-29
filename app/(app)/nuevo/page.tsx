import type { Metadata } from "next";
import { CreateGroupScreen } from "@/components/screens/CreateGroupScreen";
import { copy } from "@/lib/copy/es-CR";

export const metadata: Metadata = { title: copy.create.title };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function NewGroupPage({ searchParams }: { searchParams: Promise<{ desde?: string }> }) {
  const { desde } = await searchParams;
  const repeatFromId = desde && UUID_RE.test(desde) ? desde : null;
  return <CreateGroupScreen repeatFromId={repeatFromId} />;
}
