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
import { tone } from "./status";

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View
      className="items-center rounded-card px-6 py-8"
      style={{ backgroundColor: tone("critical").soft }}
    >
      <View
        className="h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: tone("critical").solid }}
      >
        <Ionicons name="cloud-offline-outline" size={26} color="#ffffff" />
      </View>
      <Text className="mt-4 text-base font-semibold text-ink-primary">
        Something went wrong
      </Text>
      <Text
        className="mt-1 text-center text-sm leading-5"
        style={{ color: tone("critical").text }}
      >
        {message}
      </Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          accessibilityLabel="Try again"
          className="mt-4 h-11 flex-row items-center justify-center rounded-control border-2 border-alert px-4"
          style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}
        >
          <Ionicons name="refresh" size={15} color="#b3401f" />
          <Text className="ml-1.5 text-sm font-semibold text-alert">Try Again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
