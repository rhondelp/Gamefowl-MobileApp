/**
 * File: utils/format.ts
 *
 * Purpose:
 *   Small display formatters shared across gamefowl screens. Kept out of
 *   components so cards, details, lists, and forms render identical text
 *   for the same underlying data.
 */

import type { GamefowlAge } from "../types/api";

/**
 * Human age label from the backend-computed {years, months} accessor.
 * A bird born this month reports 0y/0m — shown as "Under 1 month".
 */
export function formatAge(age: GamefowlAge | null | undefined): string {
  if (!age) return "Unknown age";
  const { years, months } = age;
  if (years === 0 && months === 0) return "Under 1 month";
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? "yr" : "yrs"}`);
  if (months > 0) parts.push(`${months} mo`);
  return parts.join(" ");
}

/**
 * Backend dates arrive as plain "YYYY-MM-DD". Appending T00:00:00 makes JS
 * parse it as LOCAL midnight so the calendar day cannot shift a day across
 * timezones (a bare "2026-08-22" would be parsed as UTC).
 */
export function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "—";
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Full ISO timestamps (assessment created_at, timeline occurred_at) carry
 * their own time component and parse safely as-is.
 */
export function formatDateTime(isoTimestamp: string | null | undefined): string {
  if (!isoTimestamp) return "—";
  const date = new Date(isoTimestamp);
  if (Number.isNaN(date.getTime())) return isoTimestamp;
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Today's date as "YYYY-MM-DD" in LOCAL time (for form defaults). */
export function todayDateString(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Backend sends weight as a float in kg (or null when never recorded). */
export function formatWeight(weightKg: number | null | undefined): string {
  return weightKg === null || weightKg === undefined ? "—" : `${weightKg} kg`;
}
