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
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
  type AndroidNativeProps,
} from "@react-native-community/datetimepicker";

import { formatDate } from "../../utils/format";
import { elevation } from "./elevation";

export interface DatePickerFieldProps {
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
  // Mirrors TextField: error outranks the open/focused state.
  const borderColor = error
    ? "border-alert bg-critical-soft"
    : iosOpen
      ? "border-brand-600 bg-surface-card"
      : "border-gray-300 bg-surface-card";

  const openAndroid = () => {
    // Android fires this once per selection in default mode — a dialog,
    // matching platform convention. No visible component to mount.
    // onValueChange only fires on an actual pick, so dismissing leaves the
    // current value alone without needing an onDismiss handler.
    const open: AndroidNativeProps["onValueChange"] = (_event, selected) => {
      onChange(toIso(selected));
    };
    DateTimePickerAndroid.open({
      value: value ? toDate(value) : new Date(),
      mode: "date",
      display: "default",
      onValueChange: open,
      maximumDate,
    });
  };

  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-sm font-medium text-ink-secondary">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatDate(value) : placeholder}`}
        onPress={() => (Platform.OS === "android" ? openAndroid() : setIosOpen((p) => !p))}
        className={`flex-row items-center rounded-control border-2 ${borderColor} px-4 py-3`}
        style={({ pressed }) => [{ minHeight: 48 }, pressed ? { opacity: 0.9 } : null]}
      >
        <Text
          className={`flex-1 text-base ${value ? "text-ink-primary" : "text-ink-tertiary"}`}
        >
          {value ? formatDate(value) : placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={18} color="#215838" />
      </Pressable>
      {error ? (
        <View className="mt-1.5 flex-row items-center">
          <Ionicons name="alert-circle" size={14} color="#b3401f" />
          <Text className="ml-1 flex-1 text-sm text-alert">{error}</Text>
        </View>
      ) : null}

      {Platform.OS === "ios" && iosOpen ? (
        <View className="mt-2 rounded-control bg-surface-card p-3" style={elevation.card}>
          <DateTimePicker
            value={value ? toDate(value) : new Date()}
            mode="date"
            display="spinner"
            maximumDate={maximumDate}
            onValueChange={(_event, selected) => onChange(toIso(selected))}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => setIosOpen(false)}
            style={({ pressed }) => [{ minHeight: 44 }, pressed ? { opacity: 0.9 } : null]}
            className="items-center justify-center rounded-control bg-brand-600 active:bg-brand-700"
          >
            <Text className="text-sm font-semibold text-white">Done</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
