/**
 * File: services/api/auth.ts
 *
 * Purpose:
 *   Authentication-specific API calls, one function per backend endpoint.
 *   Screens and AuthContext call THESE — never fetch() directly — so all
 *   endpoint paths/shapes live in one file that mirrors routes/api.php.
 *
 * Endpoints used (backend Milestone 2):
 *   POST /auth/login     { email, password }              -> { user, token }
 *   POST /auth/register  { name,email,password,
 *                          password_confirmation }        -> { user, token }
 *   GET  /auth/me        Bearer required                  -> { user }
 *   POST /auth/logout    Bearer required                  -> revokes token
 *
 * Backend Milestone 10 added a public forgot-password flow used by the
 * Milestone 17 mobile entry point. The actual reset happens outside the
 * app on a backend-hosted web page reached from the email's link.
 *   POST /auth/forgot-password  { email }                 -> 2xx always
 */

import type {
  AuthSuccessData,
  MeData,
  PasswordChangePayload,
  ProfileUpdateData,
  ProfileUpdatePayload,
} from "../../types/api";
import { request } from "./client";

/** Exchange email/password for a Sanctum token + user profile. */
export async function login(email: string, password: string): Promise<AuthSuccessData> {
  return request<AuthSuccessData>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

/**
 * Create an account. The backend logs the user in immediately (returns a
 * token), so no separate login call is needed after registering.
 */
export async function register(input: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}): Promise<AuthSuccessData> {
  return request<AuthSuccessData>("/auth/register", {
    method: "POST",
    body: input,
  });
}

/** Validate a stored token and get the current profile. Used at app boot. */
export async function me(token: string): Promise<MeData> {
  return request<MeData>("/auth/me", { token });
}

/** Revoke the current token server-side. Fire-and-forget friendly. */
export async function logout(token: string): Promise<void> {
  await request<null>("/auth/logout", { method: "POST", token });
}

/**
 * Ask the backend to email a password-reset link to `email` (Backend M10).
 *
 * Deliberately does NOT inspect the response body beyond "did it succeed":
 * the backend returns the same 2xx envelope whether or not the email is
 * registered, and the mobile UI must mirror that — any client-side
 * differentiation would leak account presence. A 2xx flips the screen to
 * a neutral confirmation; a real failure (network down / 5xx) surfaces as
 * a retryable error and leaves the form mounted.
 *
 * Public endpoint, no token; the central 401-expiry hook in client.ts is
 * guarded by `!hadToken` so it won't fire here.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await request<null>("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

/**
 * Update the signed-in user's own name/email (Backend Milestone 9).
 * Returns the fresh profile so callers can update local auth state.
 */
export async function updateProfile(
  token: string,
  payload: ProfileUpdatePayload
): Promise<ProfileUpdateData> {
  return request<ProfileUpdateData>("/auth/me", {
    method: "PATCH",
    body: payload,
    token,
  });
}

/**
 * Change the signed-in user's password. Current session stays valid; the
 * backend revokes all OTHER tokens. Message-only response (no data).
 */
export async function changePassword(
  token: string,
  payload: PasswordChangePayload
): Promise<void> {
  await request<null>("/auth/me/password", { method: "PUT", body: payload, token });
}
