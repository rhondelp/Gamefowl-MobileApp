/**
 * Tests for utils/validation.ts — the client-side mirrors of the backend
 * Form Request rules. These pin the exact messages users see inline.
 */
import {
  isFutureDateString,
  validateGamefowlForm,
  validateHealthRecordForm,
} from "../utils/validation";
import { todayDateString } from "../utils/format";

const validGamefowl = {
  name: "Mang Tasoy",
  breed: "",
  date_of_birth: "",
  sex: "unknown" as const,
  color: "",
  weight: "",
  date_acquired: "",
  notes: "",
};

describe("validateGamefowlForm", () => {
  it("accepts a minimal valid payload (only a name)", () => {
    expect(validateGamefowlForm(validGamefowl)).toEqual({});
  });

  it("requires a name", () => {
    const errors = validateGamefowlForm({ ...validGamefowl, name: "   " });
    expect(errors.name).toBe("Name is required.");
  });

  it("rejects future dates of birth", () => {
    const nextYear = new Date().getFullYear() + 1;
    const errors = validateGamefowlForm({
      ...validGamefowl,
      date_of_birth: `${nextYear}-01-01`,
    });
    expect(errors.date_of_birth).toBe("Date cannot be in the future.");
  });

  it("rejects malformed dates with format guidance", () => {
    const errors = validateGamefowlForm({
      ...validGamefowl,
      date_acquired: "31/12/2026",
    });
    expect(errors.date_acquired).toBe("Use the YYYY-MM-DD format.");
  });

  it("bounds weight to the backend's 0-20 kg range", () => {
    const tooHeavy = validateGamefowlForm({ ...validGamefowl, weight: "300" });
    expect(tooHeavy.weight).toBe("Weight must be between 0 and 20 kg.");

    const notANumber = validateGamefowlForm({ ...validGamefowl, weight: "heavy" });
    expect(notANumber.weight).toBe("Weight must be a number.");

    expect(validateGamefowlForm({ ...validGamefowl, weight: "2.4" })).toEqual({});
  });
});

const validRecord = {
  type: "weight_check" as const,
  title: "Monthly weigh-in",
  notes: "",
  weight: "",
  recordedAt: todayDateString(),
};

describe("validateHealthRecordForm", () => {
  it("accepts a valid record dated today", () => {
    expect(validateHealthRecordForm(validRecord)).toEqual({});
  });

  it("requires a title", () => {
    const errors = validateHealthRecordForm({ ...validRecord, title: "" });
    expect(errors.title).toBe("Title is required.");
  });

  it("allows backdating but rejects future event dates", () => {
    // Backdated: fine.
    const backdated = validateHealthRecordForm({
      ...validRecord,
      recordedAt: "2026-01-01",
    });
    expect(backdated.recorded_at).toBeUndefined();

    // Future: rejected.
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const futureIso = `${nextMonth.getFullYear()}-${String(
      nextMonth.getMonth() + 1
    ).padStart(2, "0")}-15`;
    const future = validateHealthRecordForm({
      ...validRecord,
      recordedAt: futureIso,
    });
    expect(future.recorded_at).toBe("Date cannot be in the future.");
  });

  it("validates weight only for weight_check records", () => {
    const asWeightCheck = validateHealthRecordForm({
      ...validRecord,
      weight: "300",
    });
    expect(asWeightCheck.weight).toBe("Weight must be between 0 and 20 kg.");

    // Same stray value ignored for a general note.
    const asNote = validateHealthRecordForm({
      ...validRecord,
      type: "general_note",
      weight: "300",
    });
    expect(asNote.weight).toBeUndefined();
  });
});

describe("isFutureDateString", () => {
  it("is false for today (before_or_equal semantics)", () => {
    expect(isFutureDateString(todayDateString())).toBe(false);
  });
});
