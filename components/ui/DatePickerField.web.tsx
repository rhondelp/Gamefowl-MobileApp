/**
 * File: components/ui/DatePickerField.web.tsx
 *
 * Purpose:
 *   WEB variant of DatePickerField. @react-native-community/datetimepicker
 *   has no web implementation, so the hosted web build falls back to a
 *   styled "YYYY-MM-DD" text input — the exact control this component used
 *   before Milestone 15. Validation still runs in utils/validation.ts, and
 *   the parent form's maximumDate rule is mirrored as a not-in-future check
 *   here so both platforms reject the same values.
 *
 * Metro resolves this file only for web bundles; native builds use
 * DatePickerField.native.tsx. No other file changes.
 */
import React from "react";
import { Text, TextInput, View } from "react-native";

interface DatePickerFieldProps {
  label: string;
  /** "YYYY-MM-DD" or "" / null for no selection. */
  value: string;
  onChange: (isoDate: string) => void;
  placeholder?: string;
  error?: string | null;
  /** Mirrors the native picker's ceiling (backend also validates). */
  maximumDate?: Date;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function DatePickerField({
  label,
  value,
  onChange,
  placeholder = "Select a date",
  error = null,
  maximumDate = new Date(),
}: DatePickerFieldProps) {
  const borderColor = error ? "border-alert" : "border-gray-300";

  const handleChange = (text: string) => {
    onChange(text);
  };

  // Live validity hint mirroring the native picker's future-date block.
  let hint: string | null = null;
  if (!error && DATE_PATTERN.test(value)) {
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) {
      hint = "Not a real calendar date.";
    } else if (parsed.getTime() > maximumDate.getTime()) {
      hint = `Date must be on or before ${maximumDate.toISOString().slice(0, 10)}.`;
    }
  }

  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-medium text-gray-700">{label}</Text>
      <TextInput
        accessibilityLabel={`${label} date, formatted as year, month, day`}
        className={`h-12 rounded-xl border ${borderColor} bg-white px-4 text-base text-gray-900`}
        value={value}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        maxLength={10}
      />
      {hint ? <Text className="mt-1 text-xs text-gray-500">{hint}</Text> : null}
      {error ? <Text className="mt-1 text-sm text-alert">{error}</Text> : null}
    </View>
  );
}
