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

/*
 * ---------------------------------------------------------------------------
 * Knowledge base (backend Milestone 4 — SymptomResource / DiseaseResource)
 * -------------------------------------------------------------------------
 */

/** Symptom severities exactly as the backend stores them. */
export type SymptomSeverity = "mild" | "moderate" | "severe";

/**
 * Owner-facing symptom shape (the assessment checklist item). Rule weights
 * are never exposed here — they stay admin-only on the backend.
 */
export interface Symptom {
  id: number;
  name: string;
  description: string | null;
  category: string;
  severity: SymptomSeverity;
}

/** `data` payload of GET /symptoms?grouped=1 — category -> symptoms. */
export interface SymptomGroupsData {
  groups: Record<string, Symptom[]>;
}

/** Disease severities include `critical` (drives vet-warning gating). */
export type DiseaseSeverity = "mild" | "moderate" | "severe" | "critical";

/**
 * Owner-facing disease shape (GET /diseases/{id}). Educational content used
 * to enrich assessment results with recommended actions/prevention tips.
 */
export interface DiseaseInfo {
  id: number;
  name: string;
  description: string | null;
  severity: DiseaseSeverity;
  general_info: string | null;
  recommended_action: string | null;
  prevention_info: string | null;
  vet_warning: string | null;
}

/*
 * ---------------------------------------------------------------------------
 * Health assessments (backend Milestone 6)
 * -------------------------------------------------------------------------
 */

export type AssessmentDuration =
  | "less_than_1_day"
  | "1_to_3_days"
  | "4_to_7_days"
  | "more_than_a_week";

export type AssessmentAppetite = "normal" | "reduced" | "none";

export type AssessmentActivity = "normal" | "reduced" | "lethargic";

/**
 * Body of POST /gamefowls/{id}/health-assessments. Age/sex snapshots are
 * intentionally absent: the backend fills them from the live bird when
 * omitted, which avoids stale client data.
 */
export interface HealthAssessmentSubmission {
  symptom_ids: number[];
  duration_of_symptoms?: AssessmentDuration | null;
  appetite?: AssessmentAppetite | null;
  activity_level?: AssessmentActivity | null;
  additional_notes?: string | null;
}

/** One ranked engine output line (HealthAssessmentResultResource). */
export interface AssessmentResultItem {
  rank: number;
  /** Snapshot wording: a possible condition, never a diagnosis. */
  possible_disease: { id: number; name: string };
  match_score: number;
  /** Plain symptom-name lists frozen at submission time. */
  matched_symptoms: string[];
  missing_symptoms: string[];
  severity_at_assessment: DiseaseSeverity;
  vet_warning_at_assessment: string | null;
}

/** Snapshot of one submitted symptom (name frozen at submission time). */
export interface SubmittedSymptomRef {
  id: number;
  name: string;
}

/**
 * Full assessment record — response of both the create endpoint and
 * GET /health-assessments/{id}. Everything except ids is immutable.
 */
export interface HealthAssessmentDetail {
  id: number;
  gamefowl_id: number;
  age_at_assessment: string | null;
  sex_at_assessment: GamefowlSex | null;
  duration_of_symptoms: AssessmentDuration | null;
  appetite: AssessmentAppetite | null;
  activity_level: AssessmentActivity | null;
  additional_notes: string | null;
  submitted_symptoms: SubmittedSymptomRef[];
  results: AssessmentResultItem[];
  disclaimer: string;
  created_at?: string | null;
}

/*
 * ---------------------------------------------------------------------------
 * Health history & manual records (backend Milestone 7)
 * -------------------------------------------------------------------------
 */

/** Manual logbook entry types (HealthRecord::TYPES). */
export type HealthRecordType =
  | "vet_visit"
  | "weight_check"
  | "general_note"
  | "vaccination";

/** One human-entered logbook entry (HealthRecordResource). */
export interface HealthRecord {
  id: number;
  type: HealthRecordType;
  title: string;
  notes: string | null;
  /** Event date chosen by the owner ("YYYY-MM-DD"); may be backdated. */
  recorded_at: string;
  weight: number | null;
  created_at?: string | null;
}

export interface HealthRecordsListData {
  items: HealthRecord[];
  pagination: PaginationMeta;
}

/** `data` payload of POST /gamefowls/{id}/health-records (201). */
export interface HealthRecordShowData {
  record: HealthRecord;
}

/** Body of POST /gamefowls/{id}/health-records. */
export interface HealthRecordPayload {
  type: HealthRecordType;
  title: string;
  notes: string | null;
  /** "YYYY-MM-DD" or null — the backend defaults to today when omitted. */
  recorded_at: string | null;
  weight: number | null;
}

/** Derived labels from the backend's documented rule chain — display only. */
export type HealthStatusLabel =
  | "healthy"
  | "needs_attention"
  | "stale"
  | "no_data";

/**
 * `data` payload of GET /gamefowls/{id}/health-status. The client renders
 * these values verbatim; derivation never happens app-side.
 */
export interface HealthStatusSummary {
  status: HealthStatusLabel;
  recent_window_days: number;
  based_on: {
    assessment_id: number;
    assessed_at: string | null;
    top_possible_disease: { id: number; name: string };
    match_score: number;
  } | null;
  days_since_last_assessment: number | null;
  latest_health_record: HealthRecord | null;
  disclaimer: string;
}

/**
 * One merged-timeline row. NOTE the backend uses TYPE-SPECIFIC id keys
 * (`assessment_id` vs `record_id`) and different occurred_at precision
 * (ISO timestamp vs plain date) — mirrored exactly here.
 */
export type HealthHistoryEntry =
  | {
      type: "assessment";
      assessment_id: number;
      occurred_at: string;
      top_possible_disease: { id: number; name: string } | null;
      match_score: number | null;
      severity_at_assessment: DiseaseSeverity | null;
    }
  | {
      type: "health_record";
      record_id: number;
      occurred_at: string;
      record_type: HealthRecordType;
      title: string;
      weight: number | null;
    };

/**
 * `data` payload of GET /gamefowls/{id}/health-history. Unlike other lists,
 * the backend's merged-feed pagination carries NO last_page — clients infer
 * more pages from items.length < total.
 */
export interface HealthHistoryData {
  items: HealthHistoryEntry[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
  };
}

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
