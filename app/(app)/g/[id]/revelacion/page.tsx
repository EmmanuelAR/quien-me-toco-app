import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FinalRevealScreen } from "@/components/screens/FinalRevealScreen";
import { copy } from "@/lib/copy/es-CR";

export const metadata: Metadata = { title: copy.finalReveal.sub };

export default async function RevealPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();
  return <FinalRevealScreen groupId={BigInt(id)} />;
}
