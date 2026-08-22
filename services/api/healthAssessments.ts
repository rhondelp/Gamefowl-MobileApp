/**
 * File: services/api/healthAssessments.ts
 *
 * Purpose:
 *   The diagnostic flow's API calls (backend Milestone 6). Assessments are
 *   append-only immutable records — submit and read only; no update/delete
 *   endpoints exist server-side, so none are exposed here either.
 *
 * Endpoints used:
 *   POST /gamefowls/{id}/health-assessments -> HealthAssessmentDetail (201)
 *   GET  /health-assessments/{id}           -> HealthAssessmentDetail
 */

import type {
  HealthAssessmentDetail,
  HealthAssessmentSubmission,
} from "../../types/api";
import { request } from "./client";

/** Submit observed symptoms; backend scores, persists, returns full record. */
export async function submit(
  token: string,
  gamefowlId: number,
  payload: HealthAssessmentSubmission
): Promise<HealthAssessmentDetail> {
  return request<HealthAssessmentDetail>(
    `/gamefowls/${gamefowlId}/health-assessments`,
    { method: "POST", body: payload, token }
  );
}

/** Full detail of one assessment (ranked results + explanations + disclaimer). */
export async function show(
  token: string,
  assessmentId: number
): Promise<HealthAssessmentDetail> {
  return request<HealthAssessmentDetail>(
    `/health-assessments/${assessmentId}`,
    { token }
  );
}
