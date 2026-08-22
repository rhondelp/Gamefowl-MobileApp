/**
 * File: services/api/client.ts
 *
 * Purpose:
 *   Small typed wrapper around fetch for talking to the Laravel backend.
 *   Every network call in the app goes through here so that:
 *     - the base URL lives in ONE place (env-configurable),
 *     - the Authorization header is attached consistently,
 *     - backend error envelopes become a single typed ApiError screens can
 *       render (banner message + per-field errors).
 *
 * Why fetch instead of axios:
 *   fetch is built into React Native — zero extra dependency, and this app
 *   only needs JSON + headers, which fetch handles fine. Axios would add
 *   bundle weight without buying anything we need.
 */

import type { ApiResponse, FieldErrors } from "../../types/api";

/**
 * Base URL of the Laravel API, e.g. "http://192.168.1.10:8000/api/v1".
 * Expo inlines EXPO_PUBLIC_* variables from .env at bundle time — no extra
 * library needed.
 *
 * Which value to use while developing:
 * - iOS Simulator:  http://localhost:8000/api/v1
 * - Android Emulator: http://10.0.2.2:8000/api/v1 (10.0.2.2 = host machine)
 * - Physical device via Expo Go: your PC's LAN IP, e.g. http://192.168.1.x:8000/api/v1
 */
export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

/**
 * A failed request, normalized so UI code never has to parse raw responses.
 * - `message`: human-readable banner text.
 * - `fieldErrors`: per-field messages from the backend's `errors` object
 *   (e.g. errors.email[0] under a TextInput).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors?: FieldErrors;

  constructor(status: number, message: string, fieldErrors?: FieldErrors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

interface RequestOptions {
  /** HTTP verb; defaults to GET. */
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** JSON-serializable request body (sent as application/json). */
  body?: unknown;
  /** Sanctum token; when present it is sent as Authorization: Bearer <t>. */
  token?: string | null;
}

/**
 * Perform one API call and return the parsed `data` payload on success,
 * or throw ApiError on any failure.
 *
 * Error handling notes:
 * - The backend always answers {success,message,...}; non-JSON bodies can
 *   still occur (e.g. the rate limiter's plain-text 429), so JSON parsing
 *   is wrapped and falls back to a status-based message.
 * - fetch() itself only rejects on NETWORK failure (server unreachable) —
 *   HTTP errors still resolve, which is why we branch on res.ok ourselves.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token } = options;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    // fetch rejects on DNS/connection failures — give the user something
    // actionable instead of a cryptic TypeError.
    throw new ApiError(
      0,
      "Cannot reach the server. Check your connection and that the API is running."
    );
  }

  // Some endpoints answer with plain text; guard JSON parsing accordingly.
  const raw = await response.text();
  let payload: ApiResponse<unknown> | null = null;
  try {
    payload = raw ? (JSON.parse(raw) as ApiResponse<unknown>) : null;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || payload.success === false) {
    throw new ApiError(
      response.status,
      payload?.success === false ? payload.message : fallbackMessage(response.status),
      payload?.success === false ? payload.errors : undefined
    );
  }

  return payload.data as T;
}

/** Sensible copy when the backend did not send a parseable JSON envelope. */
function fallbackMessage(status: number): string {
  if (status === 429) return "Too many attempts. Please wait a minute and try again.";
  if (status >= 500) return "The server had a problem. Please try again later.";
  if (status === 404) return "Not found.";
  if (status === 401) return "Your session has expired. Please log in again.";
  return `Request failed (${status}).`;
}
