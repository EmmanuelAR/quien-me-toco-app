export type GroupStatus = "open" | "closed" | "drawn" | "revealed";

export const MIN_PARTICIPANTS = 3;
export const OPEN_JOIN_CAP = 200;

export interface Wishlist {
  ideas: string;
  sizes: string;
  links: string;
}

export const emptyWishlist: Wishlist = { ideas: "", sizes: "", links: "" };

export interface AppMember {
  id: string;
  name: string;
  email?: string | null;
  userId?: string | null;
  wishlist: Wishlist;
  /** true si el caller puede ver el contenido de wishlist */
  wishlistVisible?: boolean;
  /** hay texto en ideas/sizes/links (aunque el contenido no se exponga) */
  wishlistFilled?: boolean;
}

export interface AppExclusion {
  aId: string;
  bId: string;
}

export interface AppGroup {
  id: string;
  name: string;
  eventAt: number; // unix seconds
  place: string;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  rules: string;
  status: GroupStatus;
  archived: boolean;
  inviteToken?: string;
  isOwner: boolean;
  myMemberId: string | null;
  members: AppMember[];
  exclusions: AppExclusion[];
  participantCount: number;
  /** solo local/preview: permite botón de personas de prueba */
  testTools?: boolean;
  sourceGroupId?: string | null;
  avoidPrevious?: boolean;
  /** admin: se puede revelar hoy (día del evento en CR) */
  canReveal?: boolean;
}

export interface MyGroupSummary {
  id: string;
  name: string;
  eventAt: number;
  place: string;
  status: GroupStatus;
  role: "owner" | "member" | "both";
  archived: boolean;
  inviteToken?: string;
  participantCount: number;
}
