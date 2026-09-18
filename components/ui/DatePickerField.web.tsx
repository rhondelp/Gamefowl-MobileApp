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
import React, { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
  // Focus is local presentation state only — it never leaves this component.
  const [focused, setFocused] = useState(false);
  // Mirrors TextField: error outranks focus.
  const borderColor = error
    ? "border-alert bg-critical-soft"
    : focused
      ? "border-brand-600 bg-surface-card"
      : "border-gray-300 bg-surface-card";

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
      <Text className="mb-1.5 text-sm font-medium text-ink-secondary">{label}</Text>
      <View
        className={`h-12 flex-row items-center rounded-control border-2 ${borderColor} px-4`}
      >
        <TextInput
          accessibilityLabel={`${label} date, formatted as year, month, day`}
          className="flex-1 text-base text-ink-primary"
          value={value}
          onChangeText={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          maxLength={10}
        />
        <Ionicons name="calendar-outline" size={18} color="#215838" />
      </View>
      {hint ? (
        <View className="mt-1.5 flex-row items-center">
          <Ionicons name="information-circle-outline" size={14} color="#6b7280" />
          <Text className="ml-1 flex-1 text-xs text-ink-tertiary">{hint}</Text>
        </View>
      ) : null}
      {error ? (
        <View className="mt-1.5 flex-row items-center">
          <Ionicons name="alert-circle" size={14} color="#b3401f" />
          <Text className="ml-1 flex-1 text-sm text-alert">{error}</Text>
        </View>
      ) : null}
    </View>
  );
}
