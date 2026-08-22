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
 */

import type { AuthSuccessData, MeData } from "../../types/api";
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
