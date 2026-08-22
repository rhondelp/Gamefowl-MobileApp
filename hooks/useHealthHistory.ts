/**
 * File: hooks/useHealthHistory.ts
 *
 * Purpose:
 *   Paginated merged-timeline state for one bird (assessments + manual
 *   records), powering the Health History screen. Mirrors the useGamefowls
 *   pattern EXCEPT the "more pages?" rule: the backend's merged-feed
 *   pagination carries NO last_page, so we infer from items.length < total.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import type { HealthHistoryEntry } from "../types/api";
import { ApiError } from "../services/api/client";
import * as healthHistoryApi from "../services/api/healthHistory";
import { useAuth } from "../contexts/AuthContext";

interface UseHealthHistoryResult {
  entries: HealthHistoryEntry[];
  /** Server-reported total merged rows across all pages. */
  total: number;
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  reload: () => void;
  refresh: () => void;
  loadMore: () => void;
}

type FetchMode = "initial" | "refresh" | "more";

/** Stable identity for a timeline row (ids are type-scoped server-side). */
function entryKey(entry: HealthHistoryEntry): string {
  return entry.type === "assessment"
    ? `a-${entry.assessment_id}`
    : `r-${entry.record_id}`;
}

export function useHealthHistory(gamefowlId: number): UseHealthHistoryResult {
  const { token } = useAuth();

  const [entries, setEntries] = useState<HealthHistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Monotonic request id: stale responses never overwrite fresher data.
  const requestRef = useRef(0);

  const fetchPage = useCallback(
    async (page: number, mode: FetchMode) => {
      if (!token) return;
      const seq = ++requestRef.current;

      if (mode === "initial") setLoading(true);
      else if (mode === "refresh") setRefreshing(true);
      else setLoadingMore(true);

      try {
        const data = await healthHistoryApi.history(token, gamefowlId, page);
        if (seq !== requestRef.current) return;

        setTotal(data.pagination.total);
        setEntries((prev) => {
          if (mode !== "more") return data.items;
          // New logbook entries can shift page boundaries between requests;
          // de-dupe by the composite key so appends stay correct.
          const seen = new Set(prev.map(entryKey));
          return [
            ...prev,
            ...data.items.filter((item) => !seen.has(entryKey(item))),
          ];
        });
        setError(null);
      } catch (err) {
        if (seq !== requestRef.current) return;
        if (mode !== "refresh") {
          setError(
            err instanceof ApiError
              ? err.message
              : "Something went wrong. Please try again."
          );
        }
      } finally {
        if (seq === requestRef.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [token, gamefowlId]
  );

  useEffect(() => {
    void fetchPage(1, "initial");
  }, [fetchPage]);

  const reload = useCallback(() => void fetchPage(1, "initial"), [fetchPage]);
  const refresh = useCallback(() => void fetchPage(1, "refresh"), [fetchPage]);

  const loadMore = useCallback(() => {
    if (loading || refreshing || loadingMore) return;
    // No last_page exists for this feed — compare against the total.
    if (entries.length >= total) return;
    void fetchPage(entries.length > 0 ? Math.floor(entries.length / 15) + 1 : 1, "more");
  }, [loading, refreshing, loadingMore, entries.length, total, fetchPage]);

  return { entries, total, loading, refreshing, loadingMore, error, reload, refresh, loadMore };
}
