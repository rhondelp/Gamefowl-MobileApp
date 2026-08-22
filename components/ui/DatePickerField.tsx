/**
 * File: components/ui/DatePickerField.tsx
 *
 * Purpose:
 *   Labeled date input backed by the platform's native picker
 *   (@react-native-community/datetimepicker), replacing the raw
 *   "YYYY-MM-DD" text inputs used since Milestone 10.
 *
 * Contract:
 *   - Value stays a plain "YYYY-MM-DD" string (or empty) — identical to
 *     what the text inputs produced, so every backend rule and validator
 *     in utils/validation.ts keeps working unchanged.
 *   - Android: pressing the field opens the native calendar dialog.
 *   - iOS: pressing expands an inline spinner with Confirm/Cancel.
 *   - maximumDate lets forms enforce not-in-future natively (DOB,
 *     acquired date, recorded_at all pass today).
 */
import React, { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
  type AndroidNativeProps,
} from "@react-native-community/datetimepicker";

import { formatDate } from "../../utils/format";

interface DatePickerFieldProps {
  label: string;
  /** "YYYY-MM-DD" or "" / null for no selection. */
  value: string;
  onChange: (isoDate: string) => void;
  placeholder?: string;
  error?: string | null;
  /** Blocks future dates in the picker itself (backend also validates). */
  maximumDate?: Date;
}

/** Parse "YYYY-MM-DD" as LOCAL midnight (never UTC-shifted). */
function toDate(iso: string): Date {
  if (!iso) return new Date();
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function toIso(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function DatePickerField({
  label,
  value,
  onChange,
  placeholder = "Select a date",
  error = null,
  maximumDate = new Date(),
}: DatePickerFieldProps) {
  const [iosOpen, setIosOpen] = useState(false);
  const borderColor = error ? "border-alert" : "border-gray-300";

  const openAndroid = () => {
    // Android fires onChange once per selection in default mode — a dialog,
    // matching platform convention. No visible component to mount.
    const open: AndroidNativeProps["onChange"] = (_event, selected) => {
      if (selected) onChange(toIso(selected));
    };
    DateTimePickerAndroid.open({
      value: value ? toDate(value) : new Date(),
      mode: "date",
      display: "default",
      onChange: open,
      maximumDate,
    });
  };

  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-medium text-gray-700">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatDate(value) : placeholder}`}
        onPress={() => (Platform.OS === "android" ? openAndroid() : setIosOpen((p) => !p))}
        className={`flex-row items-center rounded-xl border ${borderColor} bg-white px-4 py-3`}
      >
        <Text
          className={`flex-1 text-base ${value ? "text-gray-900" : "text-gray-400"}`}
        >
          {value ? formatDate(value) : placeholder}
        </Text>
        <Text className="text-brand-600">📅</Text>
      </Pressable>
      {error ? <Text className="mt-1 text-sm text-alert">{error}</Text> : null}

      {Platform.OS === "ios" && iosOpen ? (
        <View className="mt-2 rounded-xl border border-gray-200 bg-white p-3">
          <DateTimePicker
            value={value ? toDate(value) : new Date()}
            mode="date"
            display="spinner"
            maximumDate={maximumDate}
            onChange={(_event, selected) => {
              if (selected) onChange(toIso(selected));
            }}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => setIosOpen(false)}
            className="items-center rounded-xl bg-brand-600 py-2.5"
          >
            <Text className="text-sm font-semibold text-white">Done</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
