"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { AppGroup } from "@/lib/app/types";

function normalize(raw: Record<string, unknown>): AppGroup {
  const eventAtRaw = raw.eventAt;
  const eventAt =
    typeof eventAtRaw === "number"
      ? eventAtRaw
      : Math.floor(new Date(String(eventAtRaw)).getTime() / 1000);
  return { ...(raw as unknown as AppGroup), eventAt };
}

export function useGroup(groupId: string | null, opts?: { pollMs?: number }) {
  const [data, setData] = useState<AppGroup | null>(null);
  const [error, setError] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(Boolean(groupId));

  const refresh = useCallback(async () => {
    if (!groupId) return;
    try {
      const res = await api<{ group: Record<string, unknown> }>(`/api/groups/${groupId}`);
      setData(normalize(res.group));
      setNotFound(false);
      setError(false);
    } catch (e) {
      const status = (e as { status?: number }).status;
      if (status === 404) setNotFound(true);
      else setError(true);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    setLoading(Boolean(groupId));
    void refresh();
  }, [refresh, groupId]);

  useEffect(() => {
    if (!groupId || !opts?.pollMs) return;
    const t = window.setInterval(() => void refresh(), opts.pollMs);
    return () => window.clearInterval(t);
  }, [groupId, opts?.pollMs, refresh]);

  return { data, loading, notFound, error, refresh };
}
