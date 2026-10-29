"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/session";
import { GoogleLoginButton } from "@/components/auth/GoogleLoginButton";
import { AppHeader, Page } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { Field, TextArea, CurrencyField, type Currency } from "@/components/ui/Field";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api/client";
import { copy } from "@/lib/copy/es-CR";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/format";

interface FormState {
  name: string;
  when: string;
  place: string;
  budgetMax: string;
  currency: Currency;
  rules: string;
}

function defaultWhen(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  d.setHours(19, 0, 0, 0);
  return toDatetimeLocalValue(Math.floor(d.getTime() / 1000));
}

export function CreateGroupScreen({ repeatFromId }: { repeatFromId: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const { data: session, isPending } = useSession();
  const isAuthenticated = Boolean(session?.user);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "",
    when: defaultWhen(),
    place: "",
    budgetMax: "10000",
    currency: "CRC",
    rules: "",
  });

  useEffect(() => {
    if (!repeatFromId || !isAuthenticated) return;
    void api<{ group: { name: string; place: string; budgetMax: number; currency: string; rules: string; eventAt: number } }>(
      `/api/groups/${repeatFromId}`,
    )
      .then((res) => {
        const g = res.group;
        const d = new Date(g.eventAt * 1000);
        d.setFullYear(d.getFullYear() + 1);
        setForm({
          name: g.name,
          when: toDatetimeLocalValue(Math.floor(d.getTime() / 1000)),
          place: g.place,
          budgetMax: String(g.budgetMax || 10000),
          currency: (g.currency as Currency) || "CRC",
          rules: g.rules,
        });
      })
      .catch(() => undefined);
  }, [repeatFromId, isAuthenticated]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      const eventAt = fromDatetimeLocalValue(form.when);
      const created = await api<{ id: string }>("/api/groups", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          eventAt: new Date(eventAt * 1000).toISOString(),
          place: form.place.trim(),
          budgetMin: 0,
          budgetMax: Number(form.budgetMax) || 0,
          currency: form.currency,
          rules: form.rules.trim(),
        }),
      });
      router.replace(`/g/${created.id}/admin?nuevo=1`);
    } catch {
      toast.show(copy.common.error, "error");
      setBusy(false);
    }
  };

  if (isPending) {
    return (
      <Page className="items-center justify-center">
        <Spinner className="size-8 text-ink-soft" />
      </Page>
    );
  }

  if (!isAuthenticated) {
    return (
      <Page>
        <AppHeader backHref="/" title={copy.create.title} />
        <p className="mb-6 text-pretty text-ink-soft">{copy.auth.needLogin}</p>
        <GoogleLoginButton callbackURL="/nuevo" />
      </Page>
    );
  }

  return (
    <Page>
      <AppHeader backHref="/dashboard" title={copy.create.title} />
      <form className="flex flex-col gap-5 pb-10" onSubmit={(e) => void submit(e)}>
        <Field
          label={copy.create.name}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
          maxLength={120}
        />
        <Field
          label={copy.create.when}
          type="datetime-local"
          value={form.when}
          onChange={(e) => setForm((f) => ({ ...f, when: e.target.value }))}
          required
        />
        <Field
          label={copy.create.place}
          value={form.place}
          onChange={(e) => setForm((f) => ({ ...f, place: e.target.value }))}
          maxLength={200}
        />
        <CurrencyField
          label={copy.create.budgetMax}
          value={form.budgetMax}
          currency={form.currency}
          onChange={(budgetMax) => setForm((f) => ({ ...f, budgetMax }))}
          onCurrencyChange={(currency) => setForm((f) => ({ ...f, currency }))}
        />
        <TextArea
          label={copy.create.rules}
          value={form.rules}
          onChange={(e) => setForm((f) => ({ ...f, rules: e.target.value }))}
          rows={3}
          maxLength={2000}
        />
        <Button type="submit" size="lg" fullWidth disabled={busy || !form.name.trim()} loading={busy}>
          {copy.create.submit}
        </Button>
      </form>
    </Page>
  );
}
