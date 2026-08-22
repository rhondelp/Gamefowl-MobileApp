/**
 * File: services/api/gamefowls.ts
 *
 * Purpose:
 *   Gamefowl-profile API calls, one function per backend endpoint
 *   (backend Milestone 3). All paths and payload shapes mirror
 *   routes/api.php + GamefowlResource so screens never hardcode URLs.
 *
 * Endpoints used:
 *   GET  /gamefowls        -> { items, pagination }  active-only by default;
 *                                                     ?include_inactive=1 adds retired birds
 *   POST /gamefowls        -> { gamefowl }           201; user_id assigned server-side
 *   GET  /gamefowls/{id}   -> { gamefowl }
 *   PUT  /gamefowls/{id}   -> { gamefowl }           partial update incl. is_active toggle
 */

import type {
  GamefowlListData,
  GamefowlPayload,
  GamefowlShowData,
} from "../../types/api";
import { request } from "./client";

/**
 * Paginated list of the caller's birds (backend pages at 15, newest first).
 * Query string is assembled manually — React Native does not ship a global
 * URLSearchParams to lean on.
 */
export async function list(
  token: string,
  page = 1,
  includeInactive = false
): Promise<GamefowlListData> {
  const query = includeInactive ? `?page=${page}&include_inactive=1` : `?page=${page}`;
  return request<GamefowlListData>(`/gamefowls${query}`, { token });
}

/** Fetch one bird. Another owner's id yields the same generic 404 as unknown. */
export async function show(token: string, id: number): Promise<GamefowlShowData> {
  return request<GamefowlShowData>(`/gamefowls/${id}`, { token });
}

/** Create a bird for the logged-in owner. Backend forces is_active = true. */
export async function create(
  token: string,
  payload: GamefowlPayload
): Promise<GamefowlShowData> {
  return request<GamefowlShowData>("/gamefowls", {
    method: "POST",
    body: payload,
    token,
  });
}

/**
 * Update any subset of profile fields. Deactivation/retirement also flows
 * through here as `PUT { is_active: false }` (reactivation with true) — that
 * is the backend's documented owner-facing mechanism; DELETE exists only as
 * a soft-delete safeguard and is intentionally not surfaced in the UI.
 */
export async function update(
  token: string,
  id: number,
  payload: Partial<GamefowlPayload> & { is_active?: boolean }
): Promise<GamefowlShowData> {
  return request<GamefowlShowData>(`/gamefowls/${id}`, {
    method: "PUT",
    body: payload,
    token,
  });
}
