/**
 * Tests for components/assessment/scoreTiers.ts — match-score tier logic.
 * Boundaries matter: 70 crosses to strong, 40 crosses to moderate.
 */
import { scoreTier, tierBarColor } from "../components/assessment/scoreTiers";

describe("scoreTier", () => {
  it("classifies below 40 as weak", () => {
    expect(scoreTier(0)).toBe("weak");
    expect(scoreTier(39)).toBe("weak");
  });

  it("classifies 40-69 as moderate", () => {
    expect(scoreTier(40)).toBe("moderate");
    expect(scoreTier(69)).toBe("moderate");
  });

  it("classifies 70+ as strong", () => {
    expect(scoreTier(70)).toBe("strong");
    expect(scoreTier(100)).toBe("strong");
  });
});

describe("tierBarColor", () => {
  it("maps each tier to its brand/amber/gray color", () => {
    expect(tierBarColor("strong")).toBe("#276a43");
    expect(tierBarColor("moderate")).toBe("#d97706");
    expect(tierBarColor("weak")).toBe("#9ca3af");
  });
});
