"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { MyGroupSummary } from "@/lib/app/types";

export interface MyGroup {
  group: MyGroupSummary;
  isAdmin: boolean;
  isParticipant: boolean;
}

export function useMyGroups(enabled: boolean) {
  const [groups, setGroups] = useState<MyGroup[] | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setGroups(null);
      return;
    }
    try {
      const data = await api<{ groups: MyGroupSummary[] }>("/api/me/groups");
      setGroups(
        data.groups.map((g) => ({
          group: g,
          isAdmin: g.role === "owner" || g.role === "both",
          isParticipant: g.role === "member" || g.role === "both",
        })),
      );
    } catch {
      setGroups([]);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { groups, loading: enabled && groups === null, refresh };
}
