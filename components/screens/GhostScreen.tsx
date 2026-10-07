"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RevealCard } from "@/components/draw/RevealCard";
import { PayWithFollow } from "@/components/share/PayWithFollow";
import { AppHeader, Page } from "@/components/ui/AppHeader";
import { Spinner } from "@/components/ui/Spinner";
import { WishlistCard } from "@/components/ui/WishlistCard";
import { DetailList } from "./GroupSummary";
import type { Wishlist } from "@/lib/contract/types";
import { copy } from "@/lib/copy/es-CR";
import { capitalize, formatBudget, formatDate } from "@/lib/format";

type View =
  | { kind: "slip"; groupId: string; groupName: string; eventAt: number; place: string; budgetMin: number; budgetMax: number; currency: string; giverName: string; receiverName: string; receiverIndex: number; wishlist: Wishlist; deviceToken: string }
  | { kind: "revealed"; groupId: string }
  | { kind: "used" }
  | { kind: "invalid" }
  | { kind: "loading" }
  | { kind: "error" };

/**
 * el link privado de la abuela: un solo uso por url, pero este teléfono lo recuerda
 * (deviceToken en localStorage) para poder volver a mirar hasta el intercambio.
 */
export function GhostScreen({ token }: { token: string }) {
  const router = useRouter();
  const [view, setView] = useState<View>({ kind: "loading" });

  useEffect(() => {
    const storageKey = `qmt:ghost:${token}`;
    const device = localStorage.getItem(storageKey);
    const url = `/api/ghost/${encodeURIComponent(token)}${device ? `?device=${encodeURIComponent(device)}` : ""}`;
    void fetch(url)
      .then(async (res) => {
        const body = (await res.json()) as View;
        if (body.kind === "slip") localStorage.setItem(storageKey, body.deviceToken);
        setView(body);
      })
      .catch(() => setView({ kind: "error" }));
  }, [token]);

  useEffect(() => {
    if (view.kind === "revealed") router.replace(`/g/${view.groupId}/revelacion`);
  }, [view, router]);

  // la wishlist siempre actualizada: refrescar cada tanto
  useEffect(() => {
    if (view.kind !== "slip") return;
    const storageKey = `qmt:ghost:${token}`;
    const t = window.setInterval(() => {
      const device = localStorage.getItem(storageKey);
      if (!device) return;
      void fetch(`/api/ghost/${encodeURIComponent(token)}?device=${encodeURIComponent(device)}`)
        .then((r) => r.json())
        .then((b: View) => b.kind === "slip" && setView(b))
        .catch(() => undefined);
    }, 20_000);
    return () => window.clearInterval(t);
  }, [view.kind, token]);

  if (view.kind === "loading") {
    return (
      <Page className="items-center justify-center">
        <Spinner className="size-8 text-ink-soft" />
        <p className="mt-4 text-ink-soft">{copy.ghost.loading}</p>
      </Page>
    );
  }

  if (view.kind !== "slip") {
    const message =
      view.kind === "used" ? copy.ghost.used : view.kind === "invalid" ? copy.ghost.invalid : view.kind === "error" ? copy.common.error : copy.common.loading;
    return (
      <Page>
        <AppHeader backHref="/" />
        <p className="text-xl font-semibold text-balance">{message}</p>
      </Page>
    );
  }

  const details: Array<[string, string]> = [[copy.participant.when, capitalize(formatDate(view.eventAt, { withTime: true }))]];
  if (view.place) details.push([copy.participant.where, view.place]);
  details.push([copy.participant.budgetLabel, formatBudget(view.budgetMin, view.budgetMax, view.currency)]);

  return (
    <Page>
      <AppHeader title={view.groupName} subtitle={copy.ghost.hello(view.giverName)} />
      <div className="space-y-12 pb-12">
        <RevealCard receiverName={view.receiverName} sealedOk storageKey={`qmt:ghost-revealed:${token}`} />
        <WishlistCard title={copy.wishlist.theirs(view.receiverName)} wishlist={view.wishlist} live />
        <DetailList rows={details} />
        <PayWithFollow compact />
      </div>
    </Page>
  );
}
