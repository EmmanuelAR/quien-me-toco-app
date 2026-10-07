import { describe, expect, it } from "vitest";
import { assign } from "@/lib/draw/assign";
import { buildDrawArtifacts } from "@/lib/draw/pipeline";
import { generateKeyPair, open, revealAad, slotAad } from "@/lib/crypto/sealedbox";
import { decodeRevealPackage, decodeSlip, verifyCommitment } from "@/lib/crypto/commitments";
import { seededRng } from "@/lib/crypto/random";

/**
 * el sorteo completo, como lo hace el servidor, pero sin red:
 * permutación → sellos → papelitos cifrados → cada quien abre solo el suyo →
 * el servidor abre el paquete y los sellos coinciden.
 */
describe("pipeline del sorteo", () => {
  const groupId = 77n;
  const server = generateKeyPair();
  const people = [
    { name: "ana", kp: generateKeyPair(), isGhost: false },
    { name: "beto", kp: generateKeyPair(), isGhost: false },
    { name: "carla", kp: generateKeyPair(), isGhost: false },
    { name: "abuela", kp: null, isGhost: true },
    { name: "dani", kp: generateKeyPair(), isGhost: false },
  ];
  const recipients = people.map((p) => ({
    encPubkey: p.kp?.publicKey ?? new Uint8Array(32),
    isGhost: p.isGhost,
  }));
  const receivers = assign({ n: people.length, pairs: [[0, 1]] }, { rng: seededRng(5) })!;
  const art = buildDrawArtifacts(groupId, recipients, receivers, server.publicKey);

  it("cada quien abre solo su papelito y coincide con su sello", () => {
    people.forEach((p, i) => {
      if (p.isGhost) return;
      const slip = decodeSlip(open(p.kp!.secretKey, art.ciphertexts[i], slotAad(groupId, i)));
      expect(slip.receiver).toBe(receivers[i]);
      expect(slip.receiver).not.toBe(i);
      expect(verifyCommitment(groupId, i, slip.receiver, slip.salt, art.commitments[i])).toBe(true);
      // no puede abrir el de otro
      const other = (i + 1) % people.length;
      expect(() => open(p.kp!.secretKey, art.ciphertexts[other], slotAad(groupId, other))).toThrow();
    });
  });

  it("el papelito de la abuela lo abre el servidor (link privado)", () => {
    const ghostIdx = people.findIndex((p) => p.isGhost);
    const slip = decodeSlip(open(server.secretKey, art.ciphertexts[ghostIdx], slotAad(groupId, ghostIdx)));
    expect(slip.receiver).toBe(receivers[ghostIdx]);
  });

  it("el paquete sellado reconstruye la permutación y los salts", () => {
    const pkg = decodeRevealPackage(open(server.secretKey, art.sealedReveal, revealAad(groupId)));
    expect(pkg.receivers).toEqual(receivers);
    pkg.receivers.forEach((r, i) => {
      expect(verifyCommitment(groupId, i, r, pkg.salts[i], art.commitments[i])).toBe(true);
    });
    // la admin (sin la llave del servidor) no puede abrirlo
    expect(() => open(people[0].kp!.secretKey, art.sealedReveal, revealAad(groupId))).toThrow();
  });

  it("los sellos no revelan nada sin el salt: cambiar el receptor rompe la verificación", () => {
    expect(verifyCommitment(groupId, 0, (receivers[0] + 1) % people.length, art.salts[0], art.commitments[0])).toBe(false);
  });
});
