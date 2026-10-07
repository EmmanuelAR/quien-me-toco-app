/**
 * imprime las variables del servidor a partir de la cuenta sncast y genera la llave x25519.
 * uso: pnpm tsx scripts/print-server-env.ts [nombre-cuenta]
 * nunca imprime nada en logs de ci: es para copiar a .env.local y a vercel.
 */
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { generateKeyPair } from "../lib/crypto/sealedbox";
import { bytesToHex } from "../lib/crypto/random";

const accountName = process.argv[2] ?? "qmt-server";
const file = process.env.ACCOUNTS_FILE ?? join(homedir(), ".starknet_accounts", "starknet_open_zeppelin_accounts.json");

let address = "";
let privateKey = "";
if (existsSync(file)) {
  const data = JSON.parse(readFileSync(file, "utf8")) as Record<string, Record<string, { address: string; private_key: string }>>;
  const acc = data["alpha-sepolia"]?.[accountName];
  if (acc) {
    address = acc.address;
    privateKey = acc.private_key;
  } else {
    console.error(`# no encontré la cuenta "${accountName}" en ${file}`);
  }
} else {
  console.error(`# no existe ${file}; creá la cuenta con: sncast account create --network sepolia --name ${accountName}`);
}

const enc = generateKeyPair();

console.log(`# cuenta del servidor (starknet sepolia)`);
console.log(`SERVER_STARKNET_ADDRESS=${address}`);
console.log(`SERVER_STARKNET_PRIVATE_KEY=${privateKey}`);
console.log(`# llave x25519 del servidor (nueva; si ya tenés una en producción, no la cambiés)`);
console.log(`SERVER_ENC_PRIVATE_KEY=${bytesToHex(enc.secretKey)}`);
console.log(`NEXT_PUBLIC_SERVER_ENC_PUBKEY=${bytesToHex(enc.publicKey)}`);
