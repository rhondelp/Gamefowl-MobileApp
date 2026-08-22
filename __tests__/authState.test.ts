/**
 * Tests for contexts/authState.ts — the pure auth state machine that drives
 * which navigation stack renders. These pin every transition, including the
 * Milestone 13 SESSION_EXPIRED path.
 */
import {
  authReducer,
  INITIAL_AUTH_STATE,
} from "../contexts/authState";

const USER = { id: 1, name: "Rhondel", email: "r@example.com", role: "owner" as const };

describe("authReducer transitions", () => {
  it("starts in loading with no user or token", () => {
    expect(INITIAL_AUTH_STATE.status).toBe("loading");
    expect(INITIAL_AUTH_STATE.token).toBeNull();
    expect(INITIAL_AUTH_STATE.sessionExpired).toBe(false);
  });

  it("SIGNED_IN stores user + token and clears any expiry flag", () => {
    const expired = authReducer(INITIAL_AUTH_STATE, { type: "SESSION_EXPIRED" });
    expect(expired.sessionExpired).toBe(true);

    const signedIn = authReducer(expired, {
      type: "SIGNED_IN",
      user: USER,
      token: "tok",
    });
    expect(signedIn.status).toBe("signedIn");
    expect(signedIn.user).toEqual(USER);
    expect(signedIn.token).toBe("tok");
    expect(signedIn.sessionExpired).toBe(false);
  });

  it("SIGNED_OUT clears user, token, and expiry flag", () => {
    const signedIn = authReducer(INITIAL_AUTH_STATE, {
      type: "SIGNED_IN",
      user: USER,
      token: "tok",
    });
    const signedOut = authReducer(signedIn, { type: "SIGNED_OUT" });
    expect(signedOut).toEqual({
      status: "signedOut",
      user: null,
      token: null,
      sessionExpired: false,
    });
  });

  it("SESSION_EXPIRED signs out but leaves the explanatory flag set", () => {
    const signedIn = authReducer(INITIAL_AUTH_STATE, {
      type: "SIGNED_IN",
      user: USER,
      token: "tok",
    });
    const expired = authReducer(signedIn, { type: "SESSION_EXPIRED" });
    expect(expired.status).toBe("signedOut");
    expect(expired.token).toBeNull();
    expect(expired.user).toBeNull();
    expect(expired.sessionExpired).toBe(true);
  });

  it("ignores unknown actions (default branch)", () => {
    const signedIn = authReducer(INITIAL_AUTH_STATE, {
      type: "SIGNED_IN",
      user: USER,
      token: "tok",
    });
    expect(authReducer(signedIn, { type: "NOPE" } as never)).toBe(signedIn);
  });
});
