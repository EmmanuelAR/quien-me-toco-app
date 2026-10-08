"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCavos } from "@cavos/kit/react";
import { LoginSheet } from "@/components/cavos/LoginSheet";
import { useWrite, categorizeError, type WriteErrorKind } from "@/components/cavos/useWrite";
import { AppHeader, Page } from "@/components/ui/AppHeader";
import { Button } from "@/components/ui/Button";
import { Field, TextArea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { calls, newInviteCode } from "@/lib/contract/calls";
import { readGroupSafe, readGroupsOfAdmin } from "@/lib/contract/reads";
import type { Group } from "@/lib/contract/types";
import { copy } from "@/lib/copy/es-CR";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "@/lib/format";
import { storeInviteCode } from "@/lib/invite-storage";
import { useAdminAuth } from "@/components/cavos/useAdminAuth";

function getErrorMessage(kind: WriteErrorKind | null, rawMessage: string): string {
  switch (kind) {
    case "rejected":
      return copy.common.errorRejected;
    case "device_approval":
      return copy.common.errorDeviceApproval;
    case "paymaster":
      return copy.common.errorPaymaster;
    case "network":
      return copy.common.errorNetwork;
    case "wallet_deploy":
      return copy.common.errorWalletDeploy;
    default:
      console.error("[CreateGroupScreen] unhandled error:", rawMessage);
      return copy.common.error;
  }
}

interface FormState {
  name: string;
  when: string;
  place: string;
  budgetMax: string;
  expected: string;
  rules: string;
}

function defaultWhen(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  d.setHours(19, 0, 0, 0);
  return toDatetimeLocalValue(Math.floor(d.getTime() / 1000));
}

function nextYear(eventAt: number): string {
  const d = new Date(eventAt * 1000);
  d.setFullYear(d.getFullYear() + 1);
  return toDatetimeLocalValue(Math.floor(d.getTime() / 1000));
}

export function CreateGroupScreen({ repeatFromId }: { repeatFromId: bigint | null }) {
  const router = useRouter();
  const toast = useToast();
  const { isAuthenticated, isLoading, address } = useCavos();
  const { write, busy, status, errorKind, canWrite, needsDeviceApproval, walletDeployed } = useWrite();
  const { authHeader } = useAdminAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [previous, setPrevious] = useState<Group | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "",
    when: defaultWhen(),
    place: "",
    budgetMax: "10000",
    expected: "6",
    rules: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (!repeatFromId) return;
    void readGroupSafe(repeatFromId).then((g) => {
      if (!g) return;
      setPrevious(g);
      setForm((f) => ({
        ...f,
        name: g.name,
        when: nextYear(g.eventAt),
        place: g.place,
        budgetMax: String(g.budgetMax),
        expected: String(g.expectedCount),
        rules: g.rules,
      }));
    });
  }, [repeatFromId]);

  const isRepeat = Boolean(previous);
  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = (): boolean => {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = copy.create.errors.name;
    const eventAt = fromDatetimeLocalValue(form.when);
    if (!Number.isFinite(eventAt) || eventAt * 1000 < Date.now()) next.when = copy.create.errors.date;
    const max = Number(form.budgetMax);
    if (!Number.isInteger(max) || max < 1) next.budgetMax = copy.create.errors.budget;
    const expected = Number(form.expected);
    if (!Number.isInteger(expected) || expected < 3) next.expected = copy.create.errors.expected;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !address) {
      setLoginOpen(true);
      return;
    }

    if (needsDeviceApproval) {
      router.push("/approve-device");
      return;
    }

    if (!canWrite) {
      toast.show(copy.common.errorDeviceApproval, "error");
      return;
    }

    if (!validate()) return;
    const inviteCode = newInviteCode();
    const eventAt = fromDatetimeLocalValue(form.when);
    try {
      const before = await readGroupsOfAdmin(address);
      const call =
        isRepeat && previous
          ? calls.cloneGroup(previous.id, eventAt, inviteCode)
          : calls.createGroup({
              name: form.name.trim(),
              eventAt,
              place: form.place.trim(),
              budgetMin: Number(form.budgetMax),
              budgetMax: Number(form.budgetMax),
              rules: form.rules.trim(),
              expectedCount: Number(form.expected),
              inviteCode,
            });

      if (!walletDeployed) {
        toast.show(copy.common.errorWalletDeploy, "neutral");
      }

      await write(call);
      // el id nuevo es el último de la lista de la admin
      let after = await readGroupsOfAdmin(address);
      for (let i = 0; i < 5 && after.length <= before.length; i++) {
        await new Promise((r) => setTimeout(r, 2000));
        after = await readGroupsOfAdmin(address);
      }
      const newId = after[after.length - 1];
      if (!newId || after.length <= before.length) throw new Error("no encontramos el grupo nuevo");

      const header = await authHeader("invite-code", newId);
      void storeInviteCode(newId, inviteCode, header);

      if (isRepeat && previous) {
        // aplicar los ajustes de nombre/lugar/presupuesto/reglas del formulario
        const changed =
          form.name.trim() !== previous.name ||
          form.place.trim() !== previous.place ||
          Number(form.budgetMax) !== previous.budgetMax ||
          Number(form.budgetMax) !== previous.budgetMin ||
          form.rules.trim() !== previous.rules;
        if (changed) {
          await write(
            calls.updateGroup(newId, {
              name: form.name.trim(),
              eventAt,
              place: form.place.trim(),
              budgetMin: Number(form.budgetMax),
              budgetMax: Number(form.budgetMax),
              rules: form.rules.trim(),
            }),
          );
        }
      }
      toast.show(copy.create.created, "ok");
      router.replace(`/g/${newId.toString()}/admin?nuevo=1`);
    } catch (err) {
      const errKind = errorKind ?? categorizeError(err);
      const message = getErrorMessage(errKind, err instanceof Error ? err.message : String(err));
      toast.show(message, "error");
    }
  };

  const title = useMemo(() => (isRepeat ? copy.create.repeatTitle : copy.create.title), [isRepeat]);

  return (
    <Page>
      <AppHeader backHref="/" title={title} />
      {isRepeat && previous && <p className="-mt-4 mb-10 text-sm text-pretty text-ink-soft">{copy.create.avoidPreviousOn}</p>}
      <form className="space-y-6 pb-12" onSubmit={(e) => void submit(e)} noValidate>
        <Field
          label={copy.create.name}
          placeholder={copy.create.namePlaceholder}
          value={form.name}
          onChange={set("name")}
          error={errors.name}
          maxLength={60}
          required
        />
        <Field
          label={copy.create.when}
          type="datetime-local"
          value={form.when}
          onChange={set("when")}
          error={errors.when}
          required
        />
        <Field label={copy.create.place} placeholder={copy.create.placePlaceholder} value={form.place} onChange={set("place")} maxLength={80} />
        <Field
          label={copy.create.budgetMax}
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          value={form.budgetMax}
          onChange={set("budgetMax")}
          error={errors.budgetMax}
          hint={!errors.budgetMax ? copy.create.budgetHint : undefined}
        />
        <Field
          label={copy.create.expected}
          type="number"
          inputMode="numeric"
          min={3}
          max={200}
          value={form.expected}
          onChange={set("expected")}
          error={errors.expected}
          hint={!errors.expected ? copy.create.expectedHint : undefined}
          disabled={isRepeat}
        />
        <TextArea label={copy.create.rules} placeholder={copy.create.rulesPlaceholder} value={form.rules} onChange={set("rules")} rows={2} maxLength={400} />

        <Button type="submit" size="lg" fullWidth loading={busy || (isLoading && !isAuthenticated)}>
          {busy ? (status === "pending" ? copy.common.txPending : copy.create.submitting) : isAuthenticated ? copy.create.submit : copy.auth.enter}
        </Button>
      </form>
      <LoginSheet open={loginOpen} onClose={() => setLoginOpen(false)} />
    </Page>
  );
}
