/**
 * File: types/api.ts
 *
 * Purpose:
 *   TypeScript mirrors of the backend's JSON contracts (see the Laravel
 *   repo's bootstrap/app.php error rendering + each controller/resource).
 *   Keeping these shapes in one place means the compiler catches mismatches
 *   between what the API returns and what our screens expect.
 *
 * The backend envelope (every endpoint, success or failure):
 *   { success: boolean, message: string, data?: T, errors?: Record<string, string[]> }
 */

/** Role values exactly as the backend `users.role` column stores them. */
export type UserRole = "owner" | "admin";

/** Shape returned by UserResource on the backend (password never included). */
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

/** `data` payload of successful login/register responses. */
export interface AuthSuccessData {
  user: AuthUser;
  /** Sanctum bearer token — store in SecureStore, never AsyncStorage. */
  token: string;
}

/** `data` payload of GET /auth/me. */
export interface MeData {
  user: AuthUser;
}

/** Per-field validation messages, e.g. { email: ["Invalid credentials."] }. */
export type FieldErrors = Record<string, string[]>;

/** Successful backend response. */
export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

/** Failed backend response (validation, auth, not-found...). */
export interface ApiFailure {
  success: false;
  message: string;
  errors?: FieldErrors;
}

/** Anything the API can return. */
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
