/** tipos espejo del contrato (contracts/src/types.cairo) ya decodificados para la app */

export const GroupStatus = {
  Open: 0,
  Closed: 1,
  DrawRequested: 2,
  Drawn: 3,
  RevealRequested: 4,
  Revealed: 5,
} as const;

export type GroupStatusValue = (typeof GroupStatus)[keyof typeof GroupStatus];

export interface Group {
  id: bigint;
  admin: string;
  name: string;
  eventAt: number; // unix seconds (utc)
  place: string;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  rules: string;
  expectedCount: number;
  inviteCode: bigint;
  previousGroupId: bigint;
  avoidPrevious: boolean;
  status: GroupStatusValue;
  drawnAt: number;
  revealedAt: number;
  participantCount: number;
}

export interface Participant {
  index: number;
  account: string; // "0x0" si es sin cuenta
  name: string;
  encPubkey: Uint8Array; // 32 bytes x25519
  emailCommit: Uint8Array; // 32 bytes sha256 (ceros si sin cuenta)
  isGhost: boolean;
}

export interface Wishlist {
  ideas: string;
  sizes: string;
  links: string; // uno por línea
}

export const emptyWishlist: Wishlist = { ideas: "", sizes: "", links: "" };

export interface Exclusion {
  a: number;
  b: number;
}

export interface Reveal {
  receivers: number[];
  salts: bigint[];
}
