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
