import { describe, expect, it } from "vitest";
import { generateKeyPair, open, revealAad, seal, slotAad } from "@/lib/crypto/sealedbox";
import {
  commitment,
  decodeRevealPackage,
  decodeSlip,
  encodeRevealPackage,
  encodeSlip,
  randomSalt,
  verifyCommitment,
} from "@/lib/crypto/commitments";
import { emailCommit, isValidEmail, newEmailNonce, normalizeEmail, verifyEmailCommit } from "@/lib/crypto/email";
import { bigIntToBytes, bytesToBigInt, fromBase64Url, randomInt, toBase64Url } from "@/lib/crypto/random";

const P = 2n ** 251n + 17n * 2n ** 192n + 1n;

describe("sealed box x25519", () => {
  it("cifra y descifra con la llave correcta", () => {
    const kp = generateKeyPair();
    const aad = slotAad(7n, 2);
    const msg = new TextEncoder().encode("te tocó ana");
    const box = seal(kp.publicKey, msg, aad);
    expect(box[0]).toBe(1);
    expect(box.length).toBe(1 + 32 + 24 + msg.length + 16);
    expect(new TextDecoder().decode(open(kp.secretKey, box, aad))).toBe("te tocó ana");
  });

  it("falla con otra llave, otra casilla o si lo tocan", () => {
    const a = generateKeyPair();
    const b = generateKeyPair();
    const aad = slotAad(7n, 2);
    const box = seal(a.publicKey, new Uint8Array([1, 2, 3]), aad);
    expect(() => open(b.secretKey, box, aad)).toThrow();
    expect(() => open(a.secretKey, box, slotAad(7n, 3))).toThrow();
    const tampered = new Uint8Array(box);
    tampered[tampered.length - 1] ^= 1;
    expect(() => open(a.secretKey, tampered, aad)).toThrow();
  });

  it("dos sobres del mismo mensaje son distintos (llave efímera y nonce)", () => {
    const kp = generateKeyPair();
    const aad = revealAad(1n);
    const m = new Uint8Array([9]);
    expect(seal(kp.publicKey, m, aad)).not.toEqual(seal(kp.publicKey, m, aad));
  });
});

describe("commitments poseidon", () => {
  it("verifica y es sensible a cada parámetro", () => {
    const salt = randomSalt();
    expect(salt).toBeLessThan(P);
    const c = commitment(42n, 3, 5, salt);
    expect(verifyCommitment(42n, 3, 5, salt, c)).toBe(true);
    expect(verifyCommitment(42n, 3, 4, salt, c)).toBe(false);
    expect(verifyCommitment(42n, 2, 5, salt, c)).toBe(false);
    expect(verifyCommitment(43n, 3, 5, salt, c)).toBe(false);
    expect(verifyCommitment(42n, 3, 5, salt + 1n, c)).toBe(false);
  });

  it("coincide con un vector conocido de poseidon_hash_span (para comparar con cairo)", () => {
    // poseidon_hash_span([1, 2, 3, 4]) — mismo valor que calcula el contrato
    const c = commitment(1n, 2, 3, 4n);
    expect(c.toString(16)).toMatchInlineSnapshot(`"26e3ad8b876e02bc8a4fc43dad40a8f81a6384083cabffa190bcf40d512ae1d"`);
  });

  it("codifica y decodifica el papelito y el paquete de revelación", () => {
    const salt = randomSalt();
    const slip = decodeSlip(encodeSlip({ receiver: 300, salt }));
    expect(slip).toEqual({ receiver: 300, salt });
    const pkg = { receivers: [1, 2, 0], salts: [randomSalt(), randomSalt(), randomSalt()] };
    expect(decodeRevealPackage(encodeRevealPackage(pkg))).toEqual(pkg);
    expect(() => decodeSlip(new Uint8Array(3))).toThrow();
  });
});

describe("email commit", () => {
  it("normaliza, valida y verifica", () => {
    expect(normalizeEmail("  Abuela@Gmail.com ")).toBe("abuela@gmail.com");
    expect(isValidEmail("abuela@gmail.com")).toBe(true);
    expect(isValidEmail("abuela@gmail")).toBe(false);
    const nonce = newEmailNonce();
    const c = emailCommit("Abuela@Gmail.com", nonce);
    expect(c.length).toBe(32);
    expect(verifyEmailCommit("abuela@gmail.com", nonce, c)).toBe(true);
    expect(verifyEmailCommit("otra@gmail.com", nonce, c)).toBe(false);
    expect(verifyEmailCommit("abuela@gmail.com", newEmailNonce(), c)).toBe(false);
  });
});

describe("random helpers", () => {
  it("randomInt queda en rango", () => {
    for (let i = 0; i < 1000; i++) {
      const v = randomInt(7);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(7);
    }
    expect(randomInt(1)).toBe(0);
    expect(() => randomInt(0)).toThrow(RangeError);
  });

  it("bigint <-> bytes y base64url van y vuelven", () => {
    const v = 123456789012345678901234567890n;
    expect(bytesToBigInt(bigIntToBytes(v, 32))).toBe(v);
    expect(() => bigIntToBytes(2n ** 256n, 32)).toThrow(RangeError);
    const bytes = new Uint8Array([0, 1, 2, 250, 251, 252, 253, 254, 255]);
    expect(fromBase64Url(toBase64Url(bytes))).toEqual(bytes);
  });
});
