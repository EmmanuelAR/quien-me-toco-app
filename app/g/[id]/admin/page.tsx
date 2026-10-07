import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminScreen } from "@/components/screens/AdminScreen";
import { copy } from "@/lib/copy/es-CR";

export const metadata: Metadata = { title: copy.admin.title };

export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ nuevo?: string }>;
}) {
  const { id } = await params;
  const { nuevo } = await searchParams;
  if (!/^\d+$/.test(id)) notFound();
  return <AdminScreen groupId={BigInt(id)} justCreated={nuevo === "1"} />;
}
