import { describe, expect, it } from "vitest";
import { p256 } from "@noble/curves/nist.js";
import { buildAuthMessage, parseAuthMessage, prefixedMessageBytes } from "@/lib/auth/message";
import { pubkeyCalldata, verifySignedMessage } from "@/lib/auth/verify";
import { bytesToHex } from "@/lib/crypto/random";

const ADMIN = "0x04a1b2c3";

function signAs(secretKey: Uint8Array, message: string) {
  const publicKey = p256.getPublicKey(secretKey, false);
  const signature = p256.sign(prefixedMessageBytes(message), secretKey, { prehash: true });
  return { address: ADMIN, message, signature: bytesToHex(signature), publicKey: bytesToHex(publicKey) };
}

describe("sign-in with cavos (parte pura)", () => {
  const sk = p256.utils.randomSecretKey();
  const now = 1_800_000_000_000;

  it("arma y parsea el mensaje", () => {
    const m = buildAuthMessage("ghost-links", 12n, now);
    expect(m).toBe(`qmt:v1:ghost-links:12:${now}`);
    expect(parseAuthMessage(m)).toEqual({ action: "ghost-links", groupId: 12n, issuedAt: now });
    expect(parseAuthMessage("hola")).toBeNull();
  });

  it("acepta una firma válida y normaliza la dirección", () => {
    const payload = signAs(sk, buildAuthMessage("emails", 3n, now));
    const out = verifySignedMessage(payload, "emails", 3n, now + 1000);
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.address).toBe("0x" + "04a1b2c3".padStart(64, "0"));
      expect(pubkeyCalldata(out.publicKey)).toHaveLength(4);
    }
  });

  it("rechaza acción o grupo distintos, firma vencida, o firma de otra llave", () => {
    const payload = signAs(sk, buildAuthMessage("emails", 3n, now));
    expect(verifySignedMessage(payload, "ghost-links", 3n, now).ok).toBe(false);
    expect(verifySignedMessage(payload, "emails", 4n, now).ok).toBe(false);
    expect(verifySignedMessage(payload, "emails", 3n, now + 6 * 60 * 1000).ok).toBe(false);
    const other = p256.utils.randomSecretKey();
    const forged = { ...payload, publicKey: bytesToHex(p256.getPublicKey(other, false)) };
    expect(verifySignedMessage(forged, "emails", 3n, now).ok).toBe(false);
    expect(verifySignedMessage(null, "emails", 3n, now).ok).toBe(false);
    expect(verifySignedMessage({ ...payload, signature: "zz" }, "emails", 3n, now).ok).toBe(false);
  });

  it("acepta firmas con s alto (webcrypto no normaliza)", () => {
    const message = buildAuthMessage("emails", 3n, now);
    const sig = p256.sign(prefixedMessageBytes(message), sk, { prehash: true, lowS: false });
    // forzamos s alto: s' = n - s
    const r = BigInt("0x" + bytesToHex(sig.subarray(0, 32)));
    const s = BigInt("0x" + bytesToHex(sig.subarray(32, 64)));
    const n = p256.Point.Fn.ORDER;
    const high = n - s;
    const hex = (v: bigint) => v.toString(16).padStart(64, "0");
    const payload = { address: ADMIN, message, signature: hex(r) + hex(high), publicKey: bytesToHex(p256.getPublicKey(sk, false)) };
    expect(verifySignedMessage(payload, "emails", 3n, now).ok).toBe(true);
  });
});
