/**
 * File: services/storage.ts
 *
 * Purpose:
 *   Thin wrappers around expo-secure-store for the Sanctum token.
 *
 * Why SecureStore (and not AsyncStorage):
 *   The token is a credential. SecureStore encrypts values at rest using
 *   the OS keystore/keychain; AsyncStorage writes plain text to disk, which
 *   would expose the token on rooted/backed-up devices. Project rule: never
 *   store credentials in AsyncStorage.
 *
 * Only the token is persisted — the user object is re-fetched via
 * GET /auth/me at app start so stale profile data can't survive restarts.
 */

import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "gamefowl_auth_token";

/** Persist the Sanctum token for future launches. */
export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

/**
 * Read the stored token, or null when absent/failed.
 * Failures are swallowed deliberately: a broken secure store should send
 * the user to login, not crash the splash screen.
 */
export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Remove the token (logout / invalidated session). */
export async function deleteToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Nothing to clean up — safe to ignore.
  }
}
