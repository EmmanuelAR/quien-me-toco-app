export type GroupStatus = "open" | "closed" | "drawn" | "revealed";

export interface GroupRow {
  id: string;
  name: string;
  event_at: string;
  place: string;
  budget_min: number;
  budget_max: number;
  currency: string;
  rules: string;
  status: GroupStatus;
  owner_user_id: string;
  invite_token: string;
  archived: boolean;
  created_at: string;
  purge_after: string;
}

export interface MemberRow {
  id: string;
  group_id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  wishlist_ideas: string;
  wishlist_sizes: string;
  wishlist_links: string;
  created_at: string;
}

export interface ExclusionRow {
  group_id: string;
  a_id: string;
  b_id: string;
}

export interface AssignmentRow {
  group_id: string;
  giver_id: string;
  receiver_id: string;
}
