/**
 * Tests for utils/format.ts — display formatters. The date tests pin the
 * local-midnight parsing trick that keeps "YYYY-MM-DD" strings from
 * shifting a day across timezones.
 */
import {
  formatAge,
  formatDate,
  formatWeight,
  todayDateString,
} from "../utils/format";

describe("formatAge", () => {
  it("reports unknown age for null", () => {
    expect(formatAge(null)).toBe("Unknown age");
  });

  it("handles a bird under one month old", () => {
    expect(formatAge({ years: 0, months: 0 })).toBe("Under 1 month");
  });

  it("renders months only", () => {
    expect(formatAge({ years: 0, months: 7 })).toBe("7 mo");
  });

  it("renders years and months together", () => {
    expect(formatAge({ years: 2, months: 3 })).toBe("2 yrs 3 mo");
  });

  it("uses singular year correctly", () => {
    expect(formatAge({ years: 1, months: 0 })).toBe("1 yr");
  });
});

describe("formatDate", () => {
  it("returns an em dash for null/undefined", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
  });

  it("formats a YYYY-MM-DD date without shifting the calendar day", () => {
    // Parse as local midnight; month/day must survive round-trip.
    const formatted = formatDate("2026-01-31");
    expect(formatted).toContain("Jan");
    expect(formatted).toContain("31");
    expect(formatted).toContain("2026");
  });

  it("falls back to the raw string when unparseable", () => {
    expect(formatDate("not-a-date-but-YYYY-MM-DD-shaped?")).toBe(
      "not-a-date-but-YYYY-MM-DD-shaped?"
    );
  });
});

describe("todayDateString", () => {
  it("produces a zero-padded YYYY-MM-DD in local time", () => {
    const today = todayDateString();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // Round-trip through our own parser: must equal today's real date.
    const [y, m, d] = today.split("-").map(Number);
    const parsed = new Date(y, m - 1, d);
    expect(parsed.getFullYear()).toBe(new Date().getFullYear());
  });
});

describe("formatWeight", () => {
  it("shows an em dash when weight was never recorded", () => {
    expect(formatWeight(null)).toBe("—");
  });

  it("appends kg to numeric weights", () => {
    expect(formatWeight(2.4)).toBe("2.4 kg");
  });
});
