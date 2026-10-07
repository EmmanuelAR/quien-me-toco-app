import { CallData, Contract, RpcProvider, type Abi } from "starknet";
import abiJson from "./abi.json";
import { publicEnv } from "@/lib/env";

export const abi = abiJson as Abi;

let provider: RpcProvider | null = null;

/** el rpc público de zan responde -32011 cuando se le pide demasiado en un segundo */
export function rpcResponseIsRateLimited(status: number, body: string): boolean {
  if (status === 429) return true;
  return body.includes("-32011") || body.includes("cu limit exceeded") || body.includes("Request too fast");
}

const RATE_LIMIT_ATTEMPTS = 6;

async function fetchWithRateLimitRetry(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  for (let attempt = 0; attempt < RATE_LIMIT_ATTEMPTS; attempt++) {
    const res = await fetch(input, init);
    const body = await res.text();
    if (!rpcResponseIsRateLimited(res.status, body) || attempt === RATE_LIMIT_ATTEMPTS - 1) {
      const headers = new Headers(res.headers);
      headers.delete("content-encoding");
      headers.delete("content-length");
      return new Response(body, { status: res.status, statusText: res.statusText, headers });
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
  }
  throw new Error("rpc sin respuesta");
}

/** proveedor de solo lectura (navegador y servidor) */
export function getProvider(): RpcProvider {
  if (!provider) provider = new RpcProvider({ nodeUrl: publicEnv.rpcUrl, baseFetch: fetchWithRateLimitRetry });
  return provider;
}

export function getContractAddress(): string {
  if (!publicEnv.contractAddress) {
    throw new Error("falta NEXT_PUBLIC_CONTRACT_ADDRESS");
  }
  return publicEnv.contractAddress;
}

let contract: Contract | null = null;

export function getContract(): Contract {
  if (!contract) {
    contract = new Contract({ abi, address: getContractAddress(), providerOrAccount: getProvider() });
  }
  return contract;
}

export const callData = new CallData(abi);
