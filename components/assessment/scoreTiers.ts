/**
 * File: components/assessment/scoreTiers.ts
 *
 * Purpose:
 *   Pure match-score tiering shared by the badge, the result cards, and the
 *   timeline. Kept dependency-free so it is trivially unit-testable.
 *
 * Tiers communicate match strength at a glance (UX spec: score must be
 * visual, not just a number):
 *   >= 70  strong signal   -> solid brand green
 *   40-69  moderate signal -> amber
 *   < 40   weak signal     -> neutral gray
 */

export type ScoreTier = "strong" | "moderate" | "weak";

export function scoreTier(score: number): ScoreTier {
  if (score >= 70) return "strong";
  if (score >= 40) return "moderate";
  return "weak";
}

/** Bar/badge color for a tier (hex, not Tailwind, for inline styles). */
export function tierBarColor(tier: ScoreTier): string {
  if (tier === "strong") return "#276a43"; // brand-600
  if (tier === "moderate") return "#d97706"; // amber-600
  return "#9ca3af"; // gray-400
}
