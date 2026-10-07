import "server-only";
import { hexToBytes } from "@/lib/crypto/random";
import { publicKeyOf } from "@/lib/crypto/sealedbox";

/** variables privadas del servidor. todas de servicios con plan gratis. */
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`falta la variable ${name}`);
  return v;
}

export const serverEnv = {
  get starknetAddress() {
    return required("SERVER_STARKNET_ADDRESS");
  },
  get starknetPrivateKey() {
    return required("SERVER_STARKNET_PRIVATE_KEY");
  },
  get encSecretKey(): Uint8Array {
    const sk = hexToBytes(required("SERVER_ENC_PRIVATE_KEY"));
    if (sk.length !== 32) throw new Error("SERVER_ENC_PRIVATE_KEY debe tener 32 bytes en hex");
    return sk;
  },
  get encPublicKey(): Uint8Array {
    return publicKeyOf(this.encSecretKey);
  },
  get resendApiKey() {
    return process.env.RESEND_API_KEY ?? "";
  },
  get resendFrom() {
    return process.env.RESEND_FROM ?? "quien me toco <onboarding@resend.dev>";
  },
  get upstashUrl() {
    return process.env.UPSTASH_REDIS_REST_URL ?? "";
  },
  get upstashToken() {
    return process.env.UPSTASH_REDIS_REST_TOKEN ?? "";
  },
  get appUrl() {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  },
};
