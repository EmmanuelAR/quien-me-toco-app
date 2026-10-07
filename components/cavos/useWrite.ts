"use client";

import { useCallback, useState } from "react";
import { useCavos } from "@cavos/kit/react";
import type { Call } from "starknet";
import { getProvider } from "@/lib/contract/client";

export type WriteStatus = "idle" | "signing" | "pending" | "done" | "error";

/**
 * escribe en el contrato con la wallet de cavos (gas pagado por el paymaster) y
 * espera a que la cadena acepte la tx. el usuario nunca ve fees ni firmas.
 */
export function useWrite() {
  const { execute, walletStatus, isAuthenticated } = useCavos();
  const [status, setStatus] = useState<WriteStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const write = useCallback(
    async (calls: Call | Call[]): Promise<string> => {
      setError(null);
      setStatus("signing");
      try {
        const list = Array.isArray(calls) ? calls : [calls];
        const { transactionHash } = await execute(
          list.map((c) => ({
            contractAddress: c.contractAddress,
            entrypoint: c.entrypoint,
            calldata: (c.calldata ?? []) as string[],
          })),
          { fee: "sponsored" }, // el paymaster de cavos paga; el usuario nunca ve gas
        );
        setTxHash(transactionHash);
        setStatus("pending");
        await getProvider().waitForTransaction(transactionHash, { retryInterval: 2500 });
        setStatus("done");
        return transactionHash;
      } catch (e) {
        setStatus("error");
        const message = e instanceof Error ? e.message : String(e);
        setError(message);
        throw e;
      }
    },
    [execute],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setTxHash(null);
  }, []);

  return {
    write,
    status,
    error,
    txHash,
    reset,
    busy: status === "signing" || status === "pending",
    canWrite: isAuthenticated && !walletStatus.needsDeviceApproval,
    needsDeviceApproval: walletStatus.needsDeviceApproval,
  };
}
