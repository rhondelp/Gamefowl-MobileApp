/**
 * File: components/ui/EmptyState.tsx
 *
 * Purpose:
 *   Standard "nothing here yet" block used by Dashboard and My Gamefowl.
 *   One component keeps empty states consistent (project UI rule: every
 *   data screen has explicit loading/empty/error states).
 */
import React from "react";
import { Image, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  /** Optional branded artwork shown instead of the plain icon circle. */
  image?: number;
  title: string;
  message?: string;
  /** When provided, renders a call-to-action button under the message. */
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "paw-outline",
  image,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="items-center rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-10">
      {image ? (
        <Image source={image} style={{ width: 96, height: 96, resizeMode: "contain" }} />
      ) : (
        <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-50">
          <Ionicons name={icon} size={28} color="#2e7d4f" />
        </View>
      )}
      <Text className="mt-4 text-base font-semibold text-gray-900">{title}</Text>
      {message ? (
        <Text className="mt-1 text-center text-sm text-gray-500">{message}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Text
          onPress={onAction}
          accessibilityRole="button"
          className="mt-5 rounded-xl bg-brand-600 px-5 py-3 text-base font-semibold text-white"
        >
          {actionLabel}
        </Text>
      ) : null}
    </View>
  );
}
