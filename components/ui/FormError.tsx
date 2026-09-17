/**
 * File: components/ui/FormError.tsx
 *
 * Purpose:
 *   Banner for WHOLE-FORM errors (e.g. "Invalid credentials.", "Too many
 *   attempts") — distinct from TextField's per-field errors.
 */
import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      className="mb-4 flex-row items-start rounded-xl border border-red-200 bg-red-50 px-4 py-3"
    >
      <Ionicons name="alert-circle" size={18} color="#b3401f" />
      <Text className="ml-2 flex-1 text-sm leading-5 text-alert">{message}</Text>
    </View>
  );
}
