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

/*
 * ---------------------------------------------------------------------------
 * Gamefowl domain (backend Milestone 3 — GamefowlResource)
 * -------------------------------------------------------------------------
 */

/** Sex values exactly as the backend `gamefowls.sex` column stores them. */
export type GamefowlSex = "male" | "female" | "unknown";

/**
 * Computed server-side from date_of_birth on every request (Gamefowl::age
 * accessor) so it can never go stale. Null when the birth date is unknown.
 */
export interface GamefowlAge {
  years: number;
  months: number;
}

/**
 * Shape returned by the backend's GamefowlResource on owner-facing
 * endpoints. Dates are plain "YYYY-MM-DD" strings, timestamps ISO 8601.
 * `user_id` is deliberately absent — ownership never crosses accounts.
 */
export interface Gamefowl {
  id: number;
  name: string;
  breed: string | null;
  date_of_birth: string | null;
  age: GamefowlAge | null;
  sex: GamefowlSex;
  color: string | null;
  weight: number | null;
  date_acquired: string | null;
  notes: string | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

/** Paginator meta block the backend embeds under `data.pagination`. */
export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

/** `data` payload of GET /gamefowls. */
export interface GamefowlListData {
  items: Gamefowl[];
  pagination: PaginationMeta;
}

/** `data` payload of single-gamefowl GET / POST / PUT endpoints. */
export interface GamefowlShowData {
  gamefowl: Gamefowl;
}

/**
 * Writable profile fields sent to POST /gamefowls and PUT /gamefowls/{id}
 * (snake_case on the wire). `is_active` is update-only; the backend forces
 * it true on create and ignores `user_id` in payloads.
 */
export type GamefowlPayload = Omit<
  Gamefowl,
  "id" | "age" | "is_active" | "created_at" | "updated_at"
>;

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
