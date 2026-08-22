/**
 * File: contexts/authState.ts
 *
 * Purpose:
 *   Pure auth state machine, extracted from AuthContext (Milestone 13) so
 *   its transitions are unit-testable without React or SecureStore.
 *
 *   Three phases of auth state drive which navigation stack renders:
 *     loading      bootstrap still running
 *     signedOut    show Login/Register
 *     signedIn     show the main tabs
 */

import type { AuthUser } from "../types/api";

export type AuthStatus = "loading" | "signedOut" | "signedIn";

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  /**
   * Bearer token kept in memory alongside the user so data screens can
   * authorize API calls without re-reading SecureStore per request.
   */
  token: string | null;
  /**
   * True right after a mid-session 401 forced a sign-out. LoginScreen
   * surfaces this as a clear explanation instead of an unexplained form.
   */
  sessionExpired: boolean;
}

export type AuthAction =
  | { type: "SIGNED_OUT" }
  | { type: "SIGNED_IN"; user: AuthUser; token: string }
  | { type: "SESSION_EXPIRED" };

export const INITIAL_AUTH_STATE: AuthState = {
  status: "loading",
  user: null,
  token: null,
  sessionExpired: false,
};

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SIGNED_IN":
      return {
        status: "signedIn",
        user: action.user,
        token: action.token,
        sessionExpired: false,
      };
    case "SIGNED_OUT":
      return { status: "signedOut", user: null, token: null, sessionExpired: false };
    case "SESSION_EXPIRED":
      return { status: "signedOut", user: null, token: null, sessionExpired: true };
    default:
      return state;
  }
}
