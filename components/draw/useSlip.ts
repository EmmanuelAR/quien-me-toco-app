"use client";

import { useCallback, useEffect, useState } from "react";
import { useWrite } from "@/components/cavos/useWrite";
import { readCiphertext, readCommitments, readKeyVersions } from "@/lib/contract/reads";
import { calls } from "@/lib/contract/calls";
import { GroupStatus, type Group, type Participant } from "@/lib/contract/types";
import { decodeSlip, verifyCommitment } from "@/lib/crypto/commitments";
import { matchesOnChain, rotateKeyPair } from "@/lib/crypto/keys";
import { bytesToHex } from "@/lib/crypto/random";
import { open, slotAad } from "@/lib/crypto/sealedbox";

export type SlipState =
  | { kind: "loading" }
  | { kind: "ready"; receiver: number; sealedOk: boolean }
  | { kind: "no-key" }
  | { kind: "moving"; step: "rotating" | "reencrypting" | "waiting" }
  | { kind: "error"; message: string };

/** pide al servidor re-cifrar y espera a que la cadena tenga el cifrado nuevo */
async function reencryptAndWait(groupId: bigint, index: number, onStep: (s: "reencrypting" | "waiting") => void) {
  onStep("reencrypting");
  const res = await fetch(`/api/groups/${groupId}/reencrypt`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ index }),
  });
  if (!res.ok && res.status !== 409) throw new Error("no se pudo re-cifrar");
  onStep("waiting");
  for (let i = 0; i < 40; i++) {
    const v = await readKeyVersions(groupId, index);
    if (v.key <= v.ct) return;
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error("la cadena tardó demasiado");
}

/** abre el sobre con la llave local; devuelve el estado resultante (sin tocar react) */
async function openSlip(group: Group, me: Participant, account: string, onStep: (s: SlipState) => void): Promise<SlipState> {
  const kp = await matchesOnChain(account, me.encPubkey);
  if (!kp) return { kind: "no-key" };
  const versions = await readKeyVersions(group.id, me.index);
  if (versions.key > versions.ct) {
    await reencryptAndWait(group.id, me.index, (step) => onStep({ kind: "moving", step }));
  }
  const [ct, commitments] = await Promise.all([readCiphertext(group.id, me.index), readCommitments(group.id)]);
  const slip = decodeSlip(open(kp.secretKey, ct, slotAad(group.id, me.index)));
  const sealedOk = verifyCommitment(group.id, me.index, slip.receiver, slip.salt, commitments[me.index] ?? 0n);
  return { kind: "ready", receiver: slip.receiver, sealedOk };
}

/**
 * el papelito del participante: lee su sobre de la cadena y lo abre con la llave de
 * este teléfono. si la llave no está aquí (otro dispositivo), ofrece "traerlo":
 * rota la llave con cavos y pide al servidor que re-cifre.
 */
export function useSlip(group: Group | null, me: Participant | null, account: string | null) {
  const [state, setState] = useState<SlipState>({ kind: "loading" });
  const { write } = useWrite();

  // cambia cuando hay sorteo, cuando cambia la persona y cuando rota la llave en la cadena
  const key =
    group && me && account && group.status >= GroupStatus.Drawn
      ? `${group.id}:${me.index}:${group.status}:${bytesToHex(me.encPubkey)}`
      : "";

  const retry = useCallback(() => {
    if (!group || !me || !account) return Promise.resolve();
    return openSlip(group, me, account, setState)
      .then(setState)
      .catch((e: unknown) => setState({ kind: "error", message: e instanceof Error ? e.message : String(e) }));
  }, [group, me, account]);

  useEffect(() => {
    if (!key) return;
    void retry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  /** rota la llave en la cadena y pide re-cifrado */
  const moveHere = useCallback(() => {
    if (!group || !me || !account) return Promise.resolve();
    setState({ kind: "moving", step: "rotating" });
    return rotateKeyPair(account)
      .then((kp) => write(calls.rotateEncPubkey(group.id, me.index, kp.publicKey)))
      .then(() => reencryptAndWait(group.id, me.index, (step) => setState({ kind: "moving", step })))
      .then(() => retry())
      .catch((e: unknown) => setState({ kind: "error", message: e instanceof Error ? e.message : String(e) }));
  }, [group, me, account, write, retry]);

  return { state, retry, moveHere };
}
