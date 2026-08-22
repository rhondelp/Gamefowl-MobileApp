/**
 * File: services/api/admin.ts
 *
 * Purpose:
 *   Every admin-only API call in one module, one function per backend
 *   endpoint (backend Milestones 4 + 8). Mirrors routes/api.php exactly.
 *   A non-admin calling any of these receives 403 Forbidden from the
 *   backend — the UI additionally hides the whole section by role.
 *
 * Envelope notes (verified against controllers):
 *   - /admin/dashboard returns a FLAT stats object under `data`.
 *   - /admin/users is paginated; ?role= and ?status=inactive are the only
 *     filters (default listing = active accounts).
 *   - Knowledge-base lists are flat { items } including inactive rows.
 *   - DELETE on diseases/symptoms/recommendations = deactivate.
 */

import type {
  AdminDiseaseListData,
  AdminDiseasePayload,
  AdminDiseaseShowData,
  AdminDiseaseUpdatePayload,
  AdminRecommendationListData,
  AdminRecommendationPayload,
  AdminRecommendationShowData,
  AdminRecommendationUpdatePayload,
  AdminSymptomListData,
  AdminSymptomPayload,
  AdminSymptomShowData,
  AdminSymptomUpdatePayload,
  AdminUserShowData,
  AdminUsersListData,
  AdminUserUpdatePayload,
  AdminUser,
  DashboardStats,
  RuleAttachPayload,
  RuleShowData,
} from "../../types/admin";
import { request } from "./client";

/* ------------------------------ Dashboard ------------------------------ */

export async function dashboard(token: string): Promise<DashboardStats> {
  return request<DashboardStats>("/admin/dashboard", { token });
}

/* -------------------------------- Users -------------------------------- */

export interface UserFilters {
  role?: "owner" | "admin";
  /** Backend only supports "inactive" here (default lists active users). */
  status?: "inactive";
}

export async function listUsers(
  token: string,
  page: number,
  filters: UserFilters = {}
): Promise<AdminUsersListData> {
  const params = [`page=${page}`];
  if (filters.role) params.push(`role=${filters.role}`);
  if (filters.status) params.push(`status=${filters.status}`);
  return request<AdminUsersListData>(`/admin/users?${params.join("&")}`, {
    token,
  });
}

export async function showUser(token: string, id: number): Promise<AdminUserShowData> {
  return request<AdminUserShowData>(`/admin/users/${id}`, { token });
}

export async function updateUser(
  token: string,
  id: number,
  payload: AdminUserUpdatePayload
): Promise<{ user: AdminUser }> {
  return request(`/admin/users/${id}`, { method: "PATCH", body: payload, token });
}

/** Deactivate another account. Self-targeting is rejected 409 server-side. */
export async function deactivateUser(token: string, id: number): Promise<void> {
  await request<null>(`/admin/users/${id}`, { method: "DELETE", token });
}

/* ------------------------------- Diseases ------------------------------ */

export async function listDiseases(token: string): Promise<AdminDiseaseListData> {
  return request<AdminDiseaseListData>("/admin/diseases", { token });
}

export async function showDisease(token: string, id: number): Promise<AdminDiseaseShowData> {
  return request<AdminDiseaseShowData>(`/admin/diseases/${id}`, { token });
}

export async function createDisease(
  token: string,
  payload: AdminDiseasePayload
): Promise<AdminDiseaseShowData> {
  return request<AdminDiseaseShowData>("/admin/diseases", {
    method: "POST",
    body: payload,
    token,
  });
}

export async function updateDisease(
  token: string,
  id: number,
  payload: AdminDiseaseUpdatePayload
): Promise<AdminDiseaseShowData> {
  return request<AdminDiseaseShowData>(`/admin/diseases/${id}`, {
    method: "PUT",
    body: payload,
    token,
  });
}

/** Deactivate (is_active=false) — never a hard delete on the backend. */
export async function deactivateDisease(token: string, id: number): Promise<void> {
  await request<null>(`/admin/diseases/${id}`, { method: "DELETE", token });
}

/* ------------------------- Disease <-> rules --------------------------- */

export async function attachRule(
  token: string,
  payload: RuleAttachPayload
): Promise<RuleShowData> {
  return request<RuleShowData>("/admin/rules", {
    method: "POST",
    body: payload,
    token,
  });
}

/** Change only the weight of an existing rule. */
export async function updateRuleWeight(
  token: string,
  ruleId: number,
  weight: number
): Promise<RuleShowData> {
  return request<RuleShowData>(`/admin/rules/${ruleId}`, {
    method: "PUT",
    body: { weight },
    token,
  });
}

/**
 * Remove a rule entirely. Rules are the documented exception to the
 * deactivate-everything convention: they are engine configuration, not
 * history (past assessments keep their snapshots).
 */
export async function detachRule(token: string, ruleId: number): Promise<void> {
  await request<null>(`/admin/rules/${ruleId}`, { method: "DELETE", token });
}

/* ------------------- Disease <-> recommendation links ------------------ */

export async function attachRecommendation(
  token: string,
  diseaseId: number,
  recommendationId: number
): Promise<void> {
  await request(`/admin/diseases/${diseaseId}/recommendations`, {
    method: "POST",
    body: { recommendation_id: recommendationId },
    token,
  });
}

/** Idempotent on the backend: detaching an already-detached link succeeds. */
export async function detachRecommendation(
  token: string,
  diseaseId: number,
  recommendationId: number
): Promise<void> {
  await request(
    `/admin/diseases/${diseaseId}/recommendations/${recommendationId}`,
    { method: "DELETE", token }
  );
}

/* ------------------------------- Symptoms ------------------------------ */

export async function listSymptoms(token: string): Promise<AdminSymptomListData> {
  return request<AdminSymptomListData>("/admin/symptoms", { token });
}

export async function createSymptom(
  token: string,
  payload: AdminSymptomPayload
): Promise<AdminSymptomShowData> {
  return request<AdminSymptomShowData>("/admin/symptoms", {
    method: "POST",
    body: payload,
    token,
  });
}

export async function updateSymptom(
  token: string,
  id: number,
  payload: AdminSymptomUpdatePayload
): Promise<AdminSymptomShowData> {
  return request<AdminSymptomShowData>(`/admin/symptoms/${id}`, {
    method: "PUT",
    body: payload,
    token,
  });
}

export async function deactivateSymptom(token: string, id: number): Promise<void> {
  await request<null>(`/admin/symptoms/${id}`, { method: "DELETE", token });
}

/* ---------------------------- Recommendations -------------------------- */

export async function listRecommendations(
  token: string
): Promise<AdminRecommendationListData> {
  return request<AdminRecommendationListData>("/admin/recommendations", { token });
}

export async function createRecommendation(
  token: string,
  payload: AdminRecommendationPayload
): Promise<AdminRecommendationShowData> {
  return request<AdminRecommendationShowData>("/admin/recommendations", {
    method: "POST",
    body: payload,
    token,
  });
}

export async function updateRecommendation(
  token: string,
  id: number,
  payload: AdminRecommendationUpdatePayload
): Promise<AdminRecommendationShowData> {
  return request<AdminRecommendationShowData>(`/admin/recommendations/${id}`, {
    method: "PUT",
    body: payload,
    token,
  });
}

export async function deactivateRecommendation(
  token: string,
  id: number
): Promise<void> {
  await request<null>(`/admin/recommendations/${id}`, {
    method: "DELETE",
    token,
  });
}
