/**
 * File: components/ui/ErrorState.tsx
 *
 * Purpose:
 *   Standard whole-screen error block with a retry action, used whenever a
 *   data fetch fails (project UI rule: every data screen has an explicit
 *   error state — never a silent blank area).
 */
import React from "react";
import { Pressable, Text, View } from "react-native";
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
      <View className="h-14 w-14 items-center justify-center rounded-full bg-red-100">
        <Ionicons name="cloud-offline-outline" size={26} color="#b3401f" />
      </View>
      <Text className="mt-3 text-base font-semibold text-gray-900">
        Something went wrong
      </Text>
      <Text className="mt-1 text-center text-sm leading-5 text-alert">{message}</Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Try again"
          className="mt-4 h-11 flex-row items-center justify-center rounded-xl border-2 border-alert px-4 active:bg-red-100"
          style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}
        >
          <Ionicons name="refresh" size={15} color="#b3401f" />
          <Text className="ml-1.5 text-sm font-semibold text-alert">Try Again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
