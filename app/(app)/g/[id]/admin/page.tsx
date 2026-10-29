import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminScreen } from "@/components/screens/AdminScreen";
import { copy } from "@/lib/copy/es-CR";

export const metadata: Metadata = { title: copy.admin.title };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nuevo?: string }>;
}) {
  const { id } = await params;
  const { nuevo } = await searchParams;
  if (!UUID_RE.test(id)) notFound();
  return <AdminScreen groupId={id} justCreated={nuevo === "1"} />;
}
