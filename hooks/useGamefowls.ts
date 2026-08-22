/**
 * File: hooks/useGamefowls.ts
 *
 * Purpose:
 *   Owns every list-data concern for the owner's birds so the Dashboard and
 *   My Gamefowl screens stay pure UI: first-page load, pull-to-refresh,
 *   backend pagination ("load more"), and error handling that follows the
 *   project rule of explicit loading/empty/error states on data screens.
 *
 *   Screens re-run `refresh()` when they regain focus (see their
 *   useFocusEffect wiring) so edits/deactivations made elsewhere are picked
 *   up without a manual pull.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import type { Gamefowl, PaginationMeta } from "../types/api";
import { ApiError } from "../services/api/client";
import * as gamefowlsApi from "../services/api/gamefowls";
import { useAuth } from "../contexts/AuthContext";

interface UseGamefowlsResult {
  gamefowls: Gamefowl[];
  /** Paginator meta; null until the first successful response arrives. */
  pagination: PaginationMeta | null;
  /** First page in flight with nothing to render yet (full-screen spinner). */
  loading: boolean;
  /** Pull-to-refresh in flight (list stays visible underneath). */
  refreshing: boolean;
  /** Next-page request in flight (footer spinner). */
  loadingMore: boolean;
  error: string | null;
  /** Back to page 1 with full-screen spinner; used by retry buttons. */
  reload: () => void;
  /** Pull-to-refresh; keeps existing rows visible even if it fails. */
  refresh: () => void;
  /** Fetch the next page; no-op while busy or already on the last page. */
  loadMore: () => void;
}

type FetchMode = "initial" | "refresh" | "more";

export function useGamefowls(includeInactive = false): UseGamefowlsResult {
  const { token } = useAuth();

  const [gamefowls, setGamefowls] = useState<Gamefowl[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Monotonic id per request: a slow stale response must never overwrite
  // fresher data (e.g. after quickly toggling the inactive filter).
  const requestRef = useRef(0);

  const fetchPage = useCallback(
    async (page: number, mode: FetchMode) => {
      if (!token) return;
      const seq = ++requestRef.current;

      if (mode === "initial") setLoading(true);
      else if (mode === "refresh") setRefreshing(true);
      else setLoadingMore(true);

      try {
        const data = await gamefowlsApi.list(token, page, includeInactive);
        if (seq !== requestRef.current) return; // superseded by newer call

        setPagination(data.pagination);
        setGamefowls((prev) => {
          if (mode !== "more") return data.items;
          // Rows can shift pages between requests — de-dupe by id so an
          // append can never show the same bird twice.
          const seen = new Set(prev.map((bird) => bird.id));
          return [...prev, ...data.items.filter((bird) => !seen.has(bird.id))];
        });
        setError(null);
      } catch (err) {
        if (seq !== requestRef.current) return;
        // A failed background refresh keeps the current list on screen;
        // only surface the full-screen error when we have nothing to show.
        if (mode === "initial" || mode === "more") {
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
    [token, includeInactive]
  );

  // First load + automatic reload whenever auth or the filter changes.
  useEffect(() => {
    void fetchPage(1, "initial");
  }, [fetchPage]);

  const reload = useCallback(() => {
    void fetchPage(1, "initial");
  }, [fetchPage]);

  const refresh = useCallback(() => {
    void fetchPage(1, "refresh");
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (loading || refreshing || loadingMore || !pagination) return;
    if (pagination.current_page >= pagination.last_page) return;
    void fetchPage(pagination.current_page + 1, "more");
  }, [loading, refreshing, loadingMore, pagination, fetchPage]);

  return {
    gamefowls,
    pagination,
    loading,
    refreshing,
    loadingMore,
    error,
    reload,
    refresh,
    loadMore,
  };
}
