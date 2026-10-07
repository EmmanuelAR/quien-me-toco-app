import { CallData, Contract, RpcProvider, type Abi } from "starknet";
import abiJson from "./abi.json";
import { publicEnv } from "@/lib/env";

export const abi = abiJson as Abi;

let provider: RpcProvider | null = null;

/** proveedor de solo lectura (navegador y servidor) */
export function getProvider(): RpcProvider {
  if (!provider) provider = new RpcProvider({ nodeUrl: publicEnv.rpcUrl });
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
