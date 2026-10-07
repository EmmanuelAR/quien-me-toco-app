import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VerifyScreen } from "@/components/screens/VerifyScreen";
import { copy } from "@/lib/copy/es-CR";

export const metadata: Metadata = { title: copy.verify.title };

export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  return <VerifyScreen groupId={BigInt(id)} />;
}
