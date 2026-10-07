"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readExclusions, readGroup, readParticipants } from "@/lib/contract/reads";
import type { Exclusion, Group, Participant } from "@/lib/contract/types";

export interface GroupData {
  group: Group;
  participants: Participant[];
  exclusions: Exclusion[];
}

async function fetchGroupData(groupId: bigint, withExclusions: boolean): Promise<GroupData> {
  const [group, participants, exclusions] = await Promise.all([
    readGroup(groupId),
    readParticipants(groupId),
    withExclusions ? readExclusions(groupId) : Promise.resolve([] as Exclusion[]),
  ]);
  return { group, participants, exclusions };
}

/**
 * lee el grupo de la cadena desde el navegador (rpc público, sin pasar por el servidor)
 * y lo refresca cada tanto o cuando la pestaña vuelve a estar visible.
 */
export function useGroup(groupId: bigint | null, opts: { pollMs?: number; withExclusions?: boolean } = {}) {
  const { pollMs = 10_000, withExclusions = false } = opts;
  const [data, setData] = useState<GroupData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const inFlight = useRef(false);

  const refresh = useCallback(() => {
    if (groupId === null || inFlight.current) return Promise.resolve();
    inFlight.current = true;
    return fetchGroupData(groupId, withExclusions)
      .then((d) => {
        setData(d);
        setError(null);
        setNotFound(false);
      })
      .catch((e: unknown) => {
        const message = e instanceof Error ? e.message : String(e);
        if (/no such group/i.test(message)) setNotFound(true);
        else setError(message);
      })
      .finally(() => {
        inFlight.current = false;
      });
  }, [groupId, withExclusions]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), pollMs);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh, pollMs]);

  const loading = data === null && error === null && !notFound;
  return { data, error, loading, notFound, refresh };
}

/** espera (poll) hasta que el grupo cumpla una condición, con tope de tiempo */
export async function waitForGroup(groupId: bigint, predicate: (g: Group) => boolean, timeoutMs = 180_000): Promise<Group> {
  const started = Date.now();
  for (;;) {
    const g = await readGroup(groupId);
    if (predicate(g)) return g;
    if (Date.now() - started > timeoutMs) throw new Error("timeout");
    await new Promise((r) => setTimeout(r, 3000));
  }
}
