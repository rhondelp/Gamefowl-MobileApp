/**
 * File: components/ui/FormError.tsx
 *
 * Purpose:
 *   Banner for WHOLE-FORM errors (e.g. "Invalid credentials.", "Too many
 *   attempts") — distinct from TextField's per-field errors.
 */
import React from "react";
import { Text, View } from "react-native";

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <View className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
      <Text className="text-sm text-alert">{message}</Text>
    </View>
  );
}
