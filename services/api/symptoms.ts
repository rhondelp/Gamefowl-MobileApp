/**
 * File: services/api/symptoms.ts
 *
 * Purpose:
 *   Owner-facing knowledge-base reads for symptoms (backend Milestone 4).
 *   Used by the assessment checklist screen; active symptoms only, rule
 *   weights never exposed.
 *
 * Endpoints used:
 *   GET /symptoms?grouped=1 -> { groups: Record<category, Symptom[]> }
 */

import type { SymptomGroupsData } from "../../types/api";
import { request } from "./client";

/**
 * Active symptoms grouped by category (backend orders by category then
 * name, so the checklist renders in a stable order with zero client work).
 */
export async function listGrouped(token: string): Promise<SymptomGroupsData> {
  return request<SymptomGroupsData>("/symptoms?grouped=1", { token });
}
