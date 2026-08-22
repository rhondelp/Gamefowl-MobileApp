/**
 * File: components/ui/ErrorState.tsx
 *
 * Purpose:
 *   Standard whole-screen error block with a retry action, used whenever a
 *   data fetch fails (project UI rule: every data screen has an explicit
 *   error state — never a silent blank area).
 */
import React from "react";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View className="items-center rounded-2xl border border-red-200 bg-red-50 px-6 py-8">
      <Ionicons name="cloud-offline-outline" size={28} color="#b3401f" />
      <Text className="mt-3 text-center text-sm text-alert">{message}</Text>
      {onRetry ? (
        <Text
          onPress={onRetry}
          accessibilityRole="button"
          className="mt-4 rounded-xl border border-alert px-4 py-2 text-sm font-semibold text-alert"
        >
          Try Again
        </Text>
      ) : null}
    </View>
  );
}
