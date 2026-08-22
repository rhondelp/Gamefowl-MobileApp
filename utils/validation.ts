/**
 * File: utils/validation.ts
 *
 * Purpose:
 *   Pure client-side validators mirroring the backend's Form Request rules,
 *   extracted here (Milestone 13) so they are unit-testable in isolation
 *   and shared rather than duplicated inside form components.
 *
 *   Both functions return a field->message map; an empty object means valid.
 */

import type { GamefowlSex, HealthRecordType } from "../types/api";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** True when the string parses as a real local calendar date. */
export function isValidDateString(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  return !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
}

/** True when the date is after today's LOCAL midnight. */
export function isFutureDateString(value: string): boolean {
  const input = new Date(`${value}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return input.getTime() > today.getTime();
}

/** Shared optional-date check: empty ok, format + realness + no future. */
function checkOptionalDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!DATE_PATTERN.test(trimmed)) return "Use the YYYY-MM-DD format.";
  if (!isValidDateString(trimmed)) return "Enter a real calendar date.";
  if (isFutureDateString(trimmed)) return "Date cannot be in the future.";
  return null;
}

/* ------------------------------------------------------------------------ */
/* Gamefowl profile form (mirrors Store/UpdateGamefowlRequest)              */
/* ------------------------------------------------------------------------ */

export interface GamefowlFormInput {
  name: string;
  breed: string;
  date_of_birth: string;
  sex: GamefowlSex;
  color: string;
  weight: string;
  date_acquired: string;
  notes: string;
}

export function validateGamefowlForm(
  values: GamefowlFormInput
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.name.trim()) errors.name = "Name is required.";
  else if (values.name.trim().length > 255)
    errors.name = "Name is too long (max 255).";

  if (values.breed.trim().length > 100)
    errors.breed = "Breed is too long (max 100).";
  if (values.color.trim().length > 100)
    errors.color = "Color is too long (max 100).";

  const dobError = checkOptionalDate(values.date_of_birth);
  if (dobError) errors.date_of_birth = dobError;

  const acquiredError = checkOptionalDate(values.date_acquired);
  if (acquiredError) errors.date_acquired = acquiredError;

  const weight = values.weight.trim();
  if (weight !== "") {
    const parsed = Number(weight);
    if (Number.isNaN(parsed)) errors.weight = "Weight must be a number.";
    else if (parsed < 0 || parsed > 20)
      errors.weight = "Weight must be between 0 and 20 kg.";
  }

  if (values.notes.trim().length > 2000)
    errors.notes = "Notes are too long (max 2000).";

  return errors;
}

/* ------------------------------------------------------------------------ */
/* Admin knowledge-base forms (mirror M4 Store/Update requests)             */
/* ------------------------------------------------------------------------ */

export interface AdminDiseaseFormInput {
  name: string;
  description: string;
  recommendedAction: string;
  generalInfo: string;
  preventionInfo: string;
  vetWarning: string;
}

/** Backend: name unique<=255, description<=2000, recommended_action<=2000,
 *  general_info<=5000, prevention_info<=2000, vet_warning<=1000. */
export function validateAdminDiseaseForm(
  values: AdminDiseaseFormInput
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.name.trim()) errors.name = "Name is required.";
  else if (values.name.trim().length > 255)
    errors.name = "Name is too long (max 255).";

  if (!values.description.trim())
    errors.description = "Description is required.";
  else if (values.description.trim().length > 2000)
    errors.description = "Description is too long (max 2000).";

  if (!values.recommendedAction.trim())
    errors.recommended_action = "Recommended action is required.";
  else if (values.recommendedAction.trim().length > 2000)
    errors.recommended_action =
      "Recommended action is too long (max 2000).";

  if (values.generalInfo.trim().length > 5000)
    errors.general_info = "General info is too long (max 5000).";
  if (values.preventionInfo.trim().length > 2000)
    errors.prevention_info = "Prevention info is too long (max 2000).";
  if (values.vetWarning.trim().length > 1000)
    errors.vet_warning = "Vet warning is too long (max 1000).";

  return errors;
}

export interface AdminSymptomFormInput {
  name: string;
  category: string;
  description: string;
}

/** Backend: name unique<=255, category<=100 required, description<=2000. */
export function validateAdminSymptomForm(
  values: AdminSymptomFormInput
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.name.trim()) errors.name = "Name is required.";
  else if (values.name.trim().length > 255)
    errors.name = "Name is too long (max 255).";

  if (!values.category.trim()) errors.category = "Category is required.";
  else if (values.category.trim().length > 100)
    errors.category = "Category is too long (max 100).";

  if (values.description.trim().length > 2000)
    errors.description = "Description is too long (max 2000).";

  return errors;
}

export interface AdminRecommendationFormInput {
  title: string;
  content: string;
}

/** Backend: title<=255 required, content<=5000 required. */
export function validateAdminRecommendationForm(
  values: AdminRecommendationFormInput
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.title.trim()) errors.title = "Title is required.";
  else if (values.title.trim().length > 255)
    errors.title = "Title is too long (max 255).";

  if (!values.content.trim()) errors.content = "Content is required.";
  else if (values.content.trim().length > 5000)
    errors.content = "Content is too long (max 5000).";

  return errors;
}

/* ------------------------------------------------------------------------ */
/* Health record form (mirrors StoreHealthRecordRequest)                    */
/* ------------------------------------------------------------------------ */

export interface HealthRecordFormInput {
  type: HealthRecordType;
  title: string;
  notes: string;
  /** Raw text input; only meaningful for weight checks. */
  weight: string;
  recordedAt: string;
}

export function validateHealthRecordForm(
  values: HealthRecordFormInput
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!values.title.trim()) errors.title = "Title is required.";
  else if (values.title.trim().length > 255)
    errors.title = "Title is too long (max 255).";

  if (values.notes.trim().length > 5000)
    errors.notes = "Notes are too long (max 5000).";

  const dateValue = values.recordedAt.trim();
  if (!DATE_PATTERN.test(dateValue)) {
    errors.recorded_at = "Use the YYYY-MM-DD format.";
  } else if (!isValidDateString(dateValue)) {
    errors.recorded_at = "Enter a real calendar date.";
  } else if (isFutureDateString(dateValue)) {
    // Backdating allowed; logging the future is not.
    errors.recorded_at = "Date cannot be in the future.";
  }

  // Weight applies only to weight checks in this form's UX.
  const weightValue = values.weight.trim();
  if (values.type === "weight_check" && weightValue !== "") {
    const parsed = Number(weightValue);
    if (Number.isNaN(parsed)) errors.weight = "Weight must be a number.";
    else if (parsed < 0 || parsed > 20)
      errors.weight = "Weight must be between 0 and 20 kg.";
  }

  return errors;
}
