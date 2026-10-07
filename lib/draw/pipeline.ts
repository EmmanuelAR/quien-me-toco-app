import { commitment, encodeRevealPackage, encodeSlip, randomSalt } from "@/lib/crypto/commitments";
import { revealAad, seal, slotAad } from "@/lib/crypto/sealedbox";

/**
 * la parte pura del sorteo, después de calcular la permutación:
 * sellos, papelitos cifrados para cada quien y el paquete sellado para el servidor.
 * separada del servidor para poder probarla sin red.
 */
export interface DrawRecipient {
  /** llave x25519 de quien regala; para los sin cuenta se usa la del servidor */
  encPubkey: Uint8Array;
  isGhost: boolean;
}

export interface DrawArtifacts {
  salts: bigint[];
  commitments: bigint[];
  ciphertexts: Uint8Array[];
  sealedReveal: Uint8Array;
}

export function buildDrawArtifacts(
  groupId: bigint,
  recipients: DrawRecipient[],
  receivers: number[],
  serverPub: Uint8Array,
  saltSource: () => bigint = randomSalt,
): DrawArtifacts {
  if (recipients.length !== receivers.length) throw new Error("pipeline: largos distintos");
  const salts = receivers.map(() => saltSource());
  const commitments = receivers.map((r, i) => commitment(groupId, i, r, salts[i]));
  const ciphertexts = receivers.map((r, i) => {
    const recipientPub = recipients[i].isGhost ? serverPub : recipients[i].encPubkey;
    return seal(recipientPub, encodeSlip({ receiver: r, salt: salts[i] }), slotAad(groupId, i));
  });
  const sealedReveal = seal(serverPub, encodeRevealPackage({ receivers, salts }), revealAad(groupId));
  return { salts, commitments, ciphertexts, sealedReveal };
}
