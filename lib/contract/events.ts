import { hash, num } from "starknet";
import { getContractAddress, getProvider } from "./client";

/**
 * busca la tx que emitió un evento del grupo (DrawPublished / Revealed) para enlazar al
 * explorador. todo on-chain: no depende del kv. el bloque de despliegue acota la búsqueda.
 */
export interface FoundEvent {
  transactionHash: string;
  blockNumber: number;
}

function deployBlock(): number {
  const v = Number(process.env.NEXT_PUBLIC_CONTRACT_DEPLOY_BLOCK ?? 0);
  return Number.isFinite(v) && v > 0 ? v : 0;
}

export async function findGroupEvent(eventName: "DrawPublished" | "Revealed", groupId: bigint): Promise<FoundEvent | null> {
  const provider = getProvider();
  const selector = hash.getSelectorFromName(eventName);
  try {
    const res = await provider.getEvents({
      address: getContractAddress(),
      from_block: { block_number: deployBlock() },
      to_block: "latest",
      keys: [[selector], [num.toHex(groupId)]],
      chunk_size: 10,
    });
    const ev = res.events?.[0];
    if (!ev) return null;
    return { transactionHash: ev.transaction_hash, blockNumber: Number(ev.block_number ?? 0) };
  } catch {
    return null;
  }
}
