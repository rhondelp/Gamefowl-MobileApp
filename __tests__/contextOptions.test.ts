/**
 * Tests for components/assessment/contextOptions.ts — enum label helpers
 * used by assessment + history displays. Values must stay aligned with the
 * backend model constants.
 */
import {
  activityLabel,
  appetiteLabel,
  durationLabel,
} from "../components/assessment/contextOptions";

describe("durationLabel", () => {
  it("maps every backend duration value to a human label", () => {
    expect(durationLabel("less_than_1_day")).toBe("< 1 day");
    expect(durationLabel("more_than_a_week")).toBe("> a week");
  });

  it("falls back to an em dash for null/unknown", () => {
    expect(durationLabel(null)).toBe("—");
  });
});

describe("appetiteLabel / activityLabel", () => {
  it("maps known enum values", () => {
    expect(appetiteLabel("none")).toBe("None");
    expect(activityLabel("lethargic")).toBe("Lethargic");
  });

  it("falls back for missing values", () => {
    expect(appetiteLabel(undefined)).toBe("—");
    expect(activityLabel(null)).toBe("—");
  });
});
