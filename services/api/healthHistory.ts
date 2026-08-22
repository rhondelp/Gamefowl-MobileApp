/**
 * File: services/api/healthHistory.ts
 *
 * Purpose:
 *   Read/summarize endpoints for one bird's health over time, plus manual
 *   logbook records (backend Milestone 7). All paths mirror routes/api.php.
 *
 * Endpoints used:
 *   GET  /gamefowls/{id}/health-history   -> { items, pagination } (merged,
 *                                            newest first; NO last_page —
 *                                            infer from items.length < total)
 *   GET  /gamefowls/{id}/health-status    -> derived label + context
 *   GET  /gamefowls/{id}/health-records   -> paginated records list
 *   POST /gamefowls/{id}/health-records   -> { record } (201)
 *
 * Records are create/list ONLY server-side — no show/update/delete routes
 * exist, so none are exposed here either.
 */

import type {
  HealthHistoryData,
  HealthRecordPayload,
  HealthRecordShowData,
  HealthRecordsListData,
  HealthStatusSummary,
} from "../../types/api";
import { request } from "./client";

/** Merged timeline page (assessments summarized + manual records). */
export async function history(
  token: string,
  gamefowlId: number,
  page = 1
): Promise<HealthHistoryData> {
  return request<HealthHistoryData>(
    `/gamefowls/${gamefowlId}/health-history?page=${page}`,
    { token }
  );
}

/** Current derived status label + supporting context. Display-only data. */
export async function status(
  token: string,
  gamefowlId: number
): Promise<HealthStatusSummary> {
  return request<HealthStatusSummary>(`/gamefowls/${gamefowlId}/health-status`, {
    token,
  });
}

/** Paginated list of the bird's manual records, newest recorded_at first.
 *  per_page is backend-capped at 100. */
export async function listRecords(
  token: string,
  gamefowlId: number,
  page = 1,
  perPage = 15
): Promise<HealthRecordsListData> {
  return request<HealthRecordsListData>(
    `/gamefowls/${gamefowlId}/health-records?page=${page}&per_page=${perPage}`,
    { token }
  );
}

/** Create a manual record; backend defaults recorded_at to today when null. */
export async function addRecord(
  token: string,
  gamefowlId: number,
  payload: HealthRecordPayload
): Promise<HealthRecordShowData> {
  return request<HealthRecordShowData>(
    `/gamefowls/${gamefowlId}/health-records`,
    { method: "POST", body: payload, token }
  );
}
