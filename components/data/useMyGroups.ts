"use client";

import { useCallback, useEffect, useState } from "react";
import { readGroup, readGroupsOfAdmin, readGroupsOfParticipant } from "@/lib/contract/reads";
import type { Group } from "@/lib/contract/types";

export interface MyGroup {
  group: Group;
  isAdmin: boolean;
  isParticipant: boolean;
}

async function fetchMyGroups(address: string): Promise<MyGroup[]> {
  const [asAdmin, asParticipant] = await Promise.all([readGroupsOfAdmin(address), readGroupsOfParticipant(address)]);
  const ids = Array.from(new Set([...asAdmin, ...asParticipant].map((g) => g.toString()))).map((s) => BigInt(s));
  const loaded = await Promise.all(
    ids.map(async (id) => ({
      group: await readGroup(id),
      isAdmin: asAdmin.includes(id),
      isParticipant: asParticipant.includes(id),
    })),
  );
  loaded.sort((a, b) => b.group.eventAt - a.group.eventAt);
  return loaded;
}

/** los grupos de esta cuenta, como admin y como participante (puede estar en varios) */
export function useMyGroups(address: string | null) {
  const [state, setState] = useState<{ address: string | null; groups: MyGroup[] | null }>({ address: null, groups: null });

  const refresh = useCallback(() => {
    if (!address) return Promise.resolve();
    return fetchMyGroups(address)
      .then((groups) => setState({ address, groups }))
      .catch(() => setState({ address, groups: [] }));
  }, [address]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const groups = address && state.address === address ? state.groups : null;
  return { groups, loading: Boolean(address) && groups === null, refresh };
}
