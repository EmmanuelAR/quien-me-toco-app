"use client";

import { useCallback, useState } from "react";
import { useCavos } from "@cavos/kit/react";
import type { Call } from "starknet";
import { getProvider } from "@/lib/contract/client";

export type WriteStatus = "idle" | "signing" | "pending" | "done" | "error";

export type WriteErrorKind =
  | "rejected"
  | "device_approval"
  | "paymaster"
  | "network"
  | "wallet_deploy"
  | "bad_invite"
  | "unknown";

export function categorizeError(e: unknown): WriteErrorKind {
  const msg = e instanceof Error ? e.message.toLowerCase() : String(e).toLowerCase();

  if (/rejected|cancel|denied|abort/i.test(msg)) return "rejected";
  if (/device.?approval|not.?approved|unauthorized.?device/i.test(msg)) return "device_approval";
  if (/paymaster|sponsor|fee.?estimation|insufficient/i.test(msg)) return "paymaster";
  if (/network|fetch|timeout|connection|econnrefused/i.test(msg)) return "network";
  if (/deploy|account.?not.?found|undeployed/i.test(msg)) return "wallet_deploy";
  if (/bad.?invite|invite.?code/i.test(msg)) return "bad_invite";

  return "unknown";
}

/**
 * escribe en el contrato con la wallet de cavos (gas pagado por el paymaster) y
 * espera a que la cadena acepte la tx. el usuario nunca ve fees ni firmas.
 */
export function useWrite() {
  const { execute, walletStatus, isAuthenticated } = useCavos();
  const [status, setStatus] = useState<WriteStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<WriteErrorKind | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const write = useCallback(
    async (calls: Call | Call[]): Promise<string> => {
      setError(null);
      setErrorKind(null);
      setStatus("signing");
      try {
        const list = Array.isArray(calls) ? calls : [calls];
        const { transactionHash } = await execute(
          list.map((c) => ({
            contractAddress: c.contractAddress,
            entrypoint: c.entrypoint,
            calldata: (c.calldata ?? []) as string[],
          })),
          { fee: "sponsored" },
        );
        setTxHash(transactionHash);
        setStatus("pending");
        await getProvider().waitForTransaction(transactionHash, { retryInterval: 2500 });
        setStatus("done");
        return transactionHash;
      } catch (e) {
        setStatus("error");
        const message = e instanceof Error ? e.message : String(e);
        const kind = categorizeError(e);
        setError(message);
        setErrorKind(kind);
        console.error("[useWrite] transaction failed:", { kind, message, error: e });
        throw e;
      }
    },
    [execute],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setErrorKind(null);
    setTxHash(null);
  }, []);

  return {
    write,
    status,
    error,
    errorKind,
    txHash,
    reset,
    busy: status === "signing" || status === "pending",
    canWrite: isAuthenticated && !walletStatus.needsDeviceApproval,
    needsDeviceApproval: walletStatus.needsDeviceApproval,
    walletDeployed: !walletStatus.isUndeployed,
  };
}
