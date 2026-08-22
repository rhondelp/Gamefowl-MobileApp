/**
 * File: hooks/useGamefowl.ts
 *
 * Purpose:
 *   Single-bird fetch state shared by Gamefowl Details and Edit Gamefowl.
 *   `load(silent)` lets screens refetch quietly on focus (so an Edit or a
 *   Deactivate/Reactivate elsewhere is reflected immediately) while still
 *   showing a real spinner the first time data arrives.
 */

import { useCallback, useRef, useState } from "react";

import type { Gamefowl } from "../types/api";
import { ApiError } from "../services/api/client";
import * as gamefowlsApi from "../services/api/gamefowls";
import { useAuth } from "../contexts/AuthContext";

interface UseGamefowlResult {
  gamefowl: Gamefowl | null;
  loading: boolean;
  error: string | null;
  /**
   * Fetch/re-fetch the bird. silent=true skips the spinner when content is
   * already on screen (focus revalidation); false forces it (retry).
   */
  load: (silent?: boolean) => Promise<void>;
}

export function useGamefowl(gamefowlId: number): UseGamefowlResult {
  const { token } = useAuth();

  const [gamefowl, setGamefowl] = useState<Gamefowl | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Whether a successful fetch ever completed — decides spinner behavior.
  const hasLoadedRef = useRef(false);

  const load = useCallback(
    async (silent = false) => {
      if (!token) return;

      try {
        if (!silent || !hasLoadedRef.current) setLoading(true);
        const data = await gamefowlsApi.show(token, gamefowlId);
        setGamefowl(data.gamefowl);
        setError(null);
        hasLoadedRef.current = true;
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "Something went wrong. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [token, gamefowlId]
  );

  return { gamefowl, loading, error, load };
}
