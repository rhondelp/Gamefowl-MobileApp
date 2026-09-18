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
import { tone } from "./status";

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      className="mb-4 flex-row items-start rounded-control px-4 py-3"
      style={{ backgroundColor: tone("critical").soft }}
    >
      <Ionicons name="alert-circle" size={18} color="#b3401f" />
      <Text
        className="ml-2 flex-1 text-sm leading-5"
        style={{ color: tone("critical").text }}
      >
        {message}
      </Text>
    </View>
  );
}
