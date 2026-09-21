/**
 * File: components/assessment/careCategories.ts
 *
 * Purpose:
 *   Icon for each care-recommendation category in a result card's
 *   "Recommended care" list. Kept dependency-free so it is trivially
 *   unit-testable.
 *
 *   The category is always printed as a text tag too, so the icon is a
 *   scanning aid, never the only signal. Categories come from the backend's
 *   Recommendation::CATEGORIES (mirrored in types/admin.ts); that list is
 *   extensible, so an unknown value gets a generic icon instead of breaking
 *   the card.
 */

/** Ionicons glyph names used here (checked against the icon set by tsc). */
export type CareIconName =
  | "sparkles"
  | "exit"
  | "nutrition"
  | "eye"
  | "medical"
  | "shield-checkmark"
  | "leaf"
  | "clipboard";

export function careCategoryIcon(category: string): CareIconName {
  switch (category) {
    case "hygiene":
      return "sparkles";
    case "isolation":
      return "exit";
    case "nutrition":
      return "nutrition";
    case "monitoring":
      return "eye";
    case "medication":
      return "medical";
    case "vaccination":
      return "shield-checkmark";
    case "environment":
      return "leaf";
    default:
      return "clipboard";
  }
}
