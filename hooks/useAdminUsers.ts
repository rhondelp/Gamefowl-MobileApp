/**
 * File: hooks/useAdminUsers.ts
 *
 * Purpose:
 *   Paginated admin user-list state with role/status filters. Same pattern
 *   as useGamefowls; filter changes reload page 1. Note the backend's
 *   ?status= filter only supports "inactive" — "active" is the default
 *   listing, so the UI's Active chip simply clears the param.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import type { AdminUser } from "../types/admin";
import { ApiError } from "../services/api/client";
import * as adminApi from "../services/api/admin";
import { useAuth } from "../contexts/AuthContext";

export interface AdminUserFilters {
  /** undefined = all roles (no ?role= param). */
  role?: "owner" | "admin";
  /** undefined = active listing; "inactive" shows soft-deleted accounts. */
  status?: "inactive";
}

interface UseAdminUsersResult {
  users: AdminUser[];
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

export function useAdminUsers(filters: AdminUserFilters): UseAdminUsersResult {
  const { token } = useAuth();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestRef = useRef(0);

  // Primitives keep callback identity stable across renders.
  const { role, status } = filters;

  const fetchPage = useCallback(
    async (page: number, mode: FetchMode) => {
      if (!token) return;
      const seq = ++requestRef.current;

      if (mode === "initial") setLoading(true);
      else if (mode === "refresh") setRefreshing(true);
      else setLoadingMore(true);

      try {
        const data = await adminApi.listUsers(token, page, { role, status });
        if (seq !== requestRef.current) return;

        setTotal(data.pagination.total);
        setUsers((prev) => {
          if (mode !== "more") return data.items;
          const seen = new Set(prev.map((u) => u.id));
          return [...prev, ...data.items.filter((u) => !seen.has(u.id))];
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
    [token, role, status]
  );

  useEffect(() => {
    void fetchPage(1, "initial");
  }, [fetchPage]);

  const reload = useCallback(() => void fetchPage(1, "initial"), [fetchPage]);
  const refresh = useCallback(() => void fetchPage(1, "refresh"), [fetchPage]);

  const loadMore = useCallback(() => {
    if (loading || refreshing || loadingMore || !total) return;
    if (users.length >= total) return;
    void fetchPage(Math.floor(users.length / 15) + 1, "more");
  }, [loading, refreshing, loadingMore, users.length, total, fetchPage]);

  return { users, total, loading, refreshing, loadingMore, error, reload, refresh, loadMore };
}
