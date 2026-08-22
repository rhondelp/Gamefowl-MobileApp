/**
 * File: contexts/AuthContext.tsx
 *
 * Purpose:
 *   Single source of truth for authentication state:
 *     - status: 'loading' (bootstrapping) | 'signedOut' | 'signedIn'
 *     - user: the authenticated profile (null when signed out)
 *   and the four actions screens need: login, register, logout, bootstrap.
 *
 * Design notes (kept deliberately simple):
 *   - Context + useReducer, no Redux/Zustand — auth is the only global
 *     mutable state in this app so far; adding a state library for it alone
 *     would be unjustified complexity.
 *   - The TOKEN is persisted in SecureStore (services/storage.ts); the USER
 *     object is never persisted. On every launch we re-validate the stored
 *     token against GET /auth/me, which both proves the token still works
 *     and refreshes the profile from the server.
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import * as authService from "../services/api/auth";
import { deleteToken, getToken, saveToken } from "../services/storage";
import { setUnauthorizedHandler } from "../services/api/client";
import {
  authReducer,
  INITIAL_AUTH_STATE,
  type AuthState,
} from "./authState";

interface AuthContextValue extends AuthState {
  /** Validate a possibly-stored token against /auth/me on app launch. */
  bootstrap: () => Promise<void>;
  /** Login with credentials; throws ApiError for the screen to display. */
  login: (email: string, password: string) => Promise<void>;
  /** Register a new owner account (backend returns a token immediately). */
  register: (input: {
    name: string;
    email: string;
    password: string;
    passwordConfirmation: string;
  }) => Promise<void>;
  /** Revoke the server-side token and clear local storage. */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Wrap the component tree once (in App.tsx) and consume via useAuth().
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // status starts at 'loading': RootNavigator shows the Splash screen until
  // the bootstrap effect below decides signedIn vs signedOut.
  const [state, dispatch] = useReducer(authReducer, INITIAL_AUTH_STATE);

  /**
   * Central session-expiry wiring (Milestone 13): ANY authenticated request
   * that comes back 401 means the stored token died server-side. The API
   * client calls this handler exactly once per failure; we clear the token
   * and flip to signedOut — RootNavigator swaps to Login everywhere, and
   * LoginScreen explains why via `sessionExpired`.
   */
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void deleteToken().finally(() => {
        dispatch({ type: "SESSION_EXPIRED" });
      });
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  /**
   * App-launch check: if SecureStore has a token, ask the backend who we are.
   * Valid -> signed in. Invalid/expired/unreachable-with-401 -> sign out.
   */
  const bootstrap = async () => {
    try {
      const token = await getToken();
      if (!token) {
        dispatch({ type: "SIGNED_OUT" });
        return;
      }

      try {
        const data = await authService.me(token);
        dispatch({ type: "SIGNED_IN", user: data.user, token });
      } catch {
        // Token invalid or revoked server-side: discard it locally.
        await deleteToken();
        dispatch({ type: "SIGNED_OUT" });
      }
    } catch {
      // Storage failure should never brick the app — fall back to login.
      dispatch({ type: "SIGNED_OUT" });
    }
  };

  /**
   * Login flow: call API, persist token, store user in state.
   * Errors bubble to the calling screen (ApiError) for inline display.
   */
  const login = async (email: string, password: string) => {
    const data = await authService.login(email, password);
    await saveToken(data.token);
    dispatch({ type: "SIGNED_IN", user: data.user, token: data.token });
  };

  /**
   * Registration flow: backend creates the account AND returns a token,
   * so registering is equivalent to logging in afterwards.
   */
  const register = async (input: {
    name: string;
    email: string;
    password: string;
    passwordConfirmation: string;
  }) => {
    const data = await authService.register({
      name: input.name,
      email: input.email,
      password: input.password,
      password_confirmation: input.passwordConfirmation,
    });
    await saveToken(data.token);
    dispatch({ type: "SIGNED_IN", user: data.user, token: data.token });
  };

  /**
   * Logout: revoke server-side first (best effort), then always clear local
   * state + storage so the UI lands on Login even if the network fails.
   */
  const logout = async () => {
    const token = await getToken();
    try {
      if (token) await authService.logout(token);
    } catch {
      // Server unreachable — clearing locally is still correct behavior.
    } finally {
      await deleteToken();
      dispatch({ type: "SIGNED_OUT" });
    }
  };

  // Kick off bootstrap exactly once when the provider mounts.
  useEffect(() => {
    void bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({ ...state, bootstrap, login, register, logout }), [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook for consuming auth state/actions. Throws if used outside the
 * provider — catches wiring mistakes at development time instead of
 * producing mysterious undefineds later.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an <AuthProvider>.");
  }
  return context;
}
