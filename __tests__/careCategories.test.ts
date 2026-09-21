/**
 * Tests for components/assessment/careCategories.ts — the icon beside each
 * care recommendation on the result cards. Every backend category
 * (mirrored in types/admin.ts) needs its own icon; anything else falls back.
 */
import { careCategoryIcon } from "../components/assessment/careCategories";
import { RECOMMENDATION_CATEGORIES } from "../types/admin";

describe("careCategoryIcon", () => {
  it("gives every backend category its own distinct icon", () => {
    const icons = RECOMMENDATION_CATEGORIES.map(careCategoryIcon);

    expect(icons).not.toContain("clipboard");
    expect(new Set(icons).size).toBe(RECOMMENDATION_CATEGORIES.length);
  });

  it("maps known categories", () => {
    expect(careCategoryIcon("hygiene")).toBe("sparkles");
    expect(careCategoryIcon("medication")).toBe("medical");
  });

  it("falls back to a generic icon for categories added later", () => {
    expect(careCategoryIcon("biosecurity")).toBe("clipboard");
    expect(careCategoryIcon("")).toBe("clipboard");
  });
});
