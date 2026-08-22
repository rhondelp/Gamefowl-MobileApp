/**
 * File: components/assessment/contextOptions.ts
 *
 * Purpose:
 *   Single source of the assessment's optional-context enum choices and
 *   their human labels. Values MUST stay identical to the backend model
 *   constants (HealthAssessment::DURATIONS / APPETITES / ACTIVITY_LEVELS) —
 *   anything else is rejected 422.
 */

import type {
  AssessmentActivity,
  AssessmentAppetite,
  AssessmentDuration,
} from "../../types/api";

export interface ContextOption<T extends string> {
  value: T;
  label: string;
}

export const DURATION_OPTIONS: ContextOption<AssessmentDuration>[] = [
  { value: "less_than_1_day", label: "< 1 day" },
  { value: "1_to_3_days", label: "1–3 days" },
  { value: "4_to_7_days", label: "4–7 days" },
  { value: "more_than_a_week", label: "> a week" },
];

export const APPETITE_OPTIONS: ContextOption<AssessmentAppetite>[] = [
  { value: "normal", label: "Normal" },
  { value: "reduced", label: "Reduced" },
  { value: "none", label: "None" },
];

export const ACTIVITY_OPTIONS: ContextOption<AssessmentActivity>[] = [
  { value: "normal", label: "Normal" },
  { value: "reduced", label: "Reduced" },
  { value: "lethargic", label: "Lethargic" },
];

/** Human label for a stored enum value (results screen / future history). */
function labelFor<T extends string>(
  options: ContextOption<T>[],
  value: T | null | undefined
): string {
  return options.find((o) => o.value === value)?.label ?? "—";
}

export function durationLabel(value: AssessmentDuration | null | undefined): string {
  return labelFor(DURATION_OPTIONS, value);
}
export function appetiteLabel(value: AssessmentAppetite | null | undefined): string {
  return labelFor(APPETITE_OPTIONS, value);
}
export function activityLabel(value: AssessmentActivity | null | undefined): string {
  return labelFor(ACTIVITY_OPTIONS, value);
}
