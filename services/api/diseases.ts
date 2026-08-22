/**
 * File: services/api/diseases.ts
 *
 * Purpose:
 *   Owner-facing knowledge-base reads for diseases (backend Milestone 4).
 *   The assessment Results screen uses `show` to enrich each ranked result
 *   with educational content (recommended action / prevention tips), which
 *   assessment snapshots deliberately do not embed.
 *
 * Endpoints used:
 *   GET /diseases/{id} -> DiseaseInfo (no rule weights, no is_active)
 */

import type { DiseaseInfo } from "../../types/api";
import { request } from "./client";

export async function show(token: string, id: number): Promise<DiseaseInfo> {
  return request<DiseaseInfo>(`/diseases/${id}`, { token });
}
