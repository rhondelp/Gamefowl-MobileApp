/**
 * File: types/admin.ts
 *
 * Purpose:
 *   TypeScript mirrors of the backend's ADMIN-facing contracts (backend
 *   Milestones 4 + 8): dashboard aggregates, user management, and the
 *   knowledge-base CRUD surfaces owners never see.
 *
 * Shape notes verified against backend source:
 *   - Knowledge-base lists are FLAT (`{ items }`, unpaginated) and include
 *     deactivated rows flagged by is_active.
 *   - The users list IS paginated; its ?status= filter supports only
 *     "inactive" (the default listing is active accounts).
 *   - Rule weight is an integer 1–5 (DiseaseSymptomRule::WEIGHT_MIN/MAX).
 *   - DELETE on diseases/symptoms/recommendations = deactivate
 *     (is_active:false). Rules alone are hard-deleted (engine config).
 */

import type {
  DiseaseSeverity,
  PaginationMeta,
  SymptomSeverity,
} from "./api";

/* ----------------------------- Dashboard ------------------------------- */

export interface DashboardCountRow {
  id: number;
  name: string;
  count: number;
}

export interface RecentAssessmentRow {
  id: number;
  gamefowl_id: number;
  gamefowl_name: string;
  owner_id: number;
  top_possible_disease: { id: number; name: string } | null;
  match_score: number | null;
  assessed_at: string | null;
}

/** `data` payload of GET /admin/dashboard. */
export interface DashboardStats {
  total_users: number;
  /** { owner?: n, admin?: n } — roles absent when count is zero. */
  users_by_role: Record<string, number>;
  users_by_active_status: { active: number; inactive: number };
  total_gamefowls: number;
  total_assessments: number;
  most_frequently_reported_symptoms: DashboardCountRow[];
  most_frequently_suggested_diseases: (Omit<DashboardCountRow, "count"> & {
    suggestion_count: number;
  })[];
  recent_assessments: RecentAssessmentRow[];
}

/* -------------------------------- Users -------------------------------- */

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: "owner" | "admin";
  created_at?: string | null;
  updated_at?: string | null;
  is_active: boolean;
  deleted_at: string | null;
}

export interface AdminUsersListData {
  items: AdminUser[];
  pagination: PaginationMeta;
}

export interface AdminUserDetail extends AdminUser {
  gamefowl_count: number | null;
  health_assessment_count: number | null;
}

export interface AdminUserShowData {
  user: AdminUserDetail;
}

export interface AdminUserUpdatePayload {
  role?: "owner" | "admin";
  /** "inactive" soft-deletes the account; "active" restores it. */
  status?: "active" | "inactive";
}

/* ------------------------------ Diseases ------------------------------- */

/** One weighted rule attached to a disease (from the pivot snapshot). */
export interface DiseaseRuleRow {
  rule_id: number;
  symptom_id: number;
  symptom_name: string;
  weight: number;
}

/** Owner-facing shape of a linked recommendation (id/title/content/category). */
export interface LinkedRecommendation {
  id: number;
  title: string;
  content: string;
  category: string;
}

export interface AdminDisease {
  id: number;
  name: string;
  description: string | null;
  severity: DiseaseSeverity;
  general_info: string | null;
  recommended_action: string | null;
  prevention_info: string | null;
  vet_warning: string | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  rules: DiseaseRuleRow[];
  recommendations: LinkedRecommendation[];
}

export interface AdminDiseaseListData {
  items: AdminDisease[];
}

export interface AdminDiseaseShowData {
  disease: AdminDisease;
}

/** Body for POST /admin/diseases and PUT /admin/diseases/{id}. */
export interface AdminDiseasePayload {
  name: string;
  description: string;
  severity: DiseaseSeverity;
  general_info: string | null;
  recommended_action: string;
  prevention_info: string | null;
  vet_warning: string | null;
}

export interface AdminDiseaseUpdatePayload extends Partial<AdminDiseasePayload> {
  /** Sending true reactivates a deactivated disease. */
  is_active?: boolean;
}

/* ------------------------------ Symptoms ------------------------------- */

export interface AdminSymptom {
  id: number;
  name: string;
  description: string | null;
  category: string;
  severity: SymptomSeverity;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AdminSymptomListData {
  items: AdminSymptom[];
}

export interface AdminSymptomShowData {
  symptom: AdminSymptom;
}

export interface AdminSymptomPayload {
  name: string;
  description: string | null;
  category: string;
  severity: SymptomSeverity;
}

export interface AdminSymptomUpdatePayload extends Partial<AdminSymptomPayload> {
  is_active?: boolean;
}

/* --------------------------- Recommendations --------------------------- */

export const RECOMMENDATION_CATEGORIES = [
  "hygiene",
  "isolation",
  "nutrition",
  "monitoring",
  "medication",
  "vaccination",
  "environment",
] as const;

export type RecommendationCategory = (typeof RECOMMENDATION_CATEGORIES)[number];

export interface AdminRecommendation {
  id: number;
  title: string;
  content: string;
  category: RecommendationCategory;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AdminRecommendationListData {
  items: AdminRecommendation[];
}

export interface AdminRecommendationShowData {
  recommendation: AdminRecommendation;
}

export interface AdminRecommendationPayload {
  title: string;
  content: string;
  category: RecommendationCategory;
}

export interface AdminRecommendationUpdatePayload
  extends Partial<AdminRecommendationPayload> {
  is_active?: boolean;
}

/* -------------------------------- Rules -------------------------------- */

/** Body of POST /admin/rules (weight must be an integer within 1–5). */
export interface RuleAttachPayload {
  disease_id: number;
  symptom_id: number;
  weight: number;
}

export interface RuleData {
  id: number;
  disease_id: number;
  symptom_id: number;
  weight: number;
}

export interface RuleShowData {
  rule: RuleData;
}
