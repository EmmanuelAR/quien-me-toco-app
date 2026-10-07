import "server-only";
import { Account, type Call } from "starknet";
import { getProvider } from "@/lib/contract/client";
import { serverEnv } from "./env";
import { withLock } from "./lock";

/**
 * la cuenta del servidor en sepolia (openzeppelin, creada con sncast).
 * paga su propio gas con strk del faucet: gratis. es el `operator` del contrato.
 */
let account: Account | null = null;

export function getServerAccount(): Account {
  if (!account) {
    account = new Account({
      provider: getProvider(),
      address: serverEnv.starknetAddress,
      signer: serverEnv.starknetPrivateKey,
    });
  }
  return account;
}

export interface ServerTxResult {
  transactionHash: string;
}

/**
 * manda una tx desde la cuenta del servidor y espera a que la cadena la acepte.
 * serializada con un lock para no chocar nonces entre funciones concurrentes.
 */
export async function sendServerTx(calls: Call | Call[]): Promise<ServerTxResult> {
  return withLock("server-tx", 150, async () => {
    const acc = getServerAccount();
    const { transaction_hash } = await acc.execute(Array.isArray(calls) ? calls : [calls]);
    await getProvider().waitForTransaction(transaction_hash, { retryInterval: 3000 });
    return { transactionHash: transaction_hash };
  });
}
