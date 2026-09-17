/**
 * File: components/ui/EmptyState.tsx
 *
 * Purpose:
 *   Standard "nothing here yet" block used by Dashboard and My Gamefowl.
 *   One component keeps empty states consistent (project UI rule: every
 *   data screen has explicit loading/empty/error states).
 */
import React from "react";
import { Image, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { elevation } from "./elevation";

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
        // Layered disc: the tint ring lifts the icon off a plain white card.
        <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-50">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-100">
            <Ionicons name={icon} size={26} color="#215838" />
          </View>
        </View>
      )}
      <Text className="mt-4 text-lg font-semibold text-gray-900">{title}</Text>
      {message ? (
        <Text className="mt-1.5 text-center text-sm leading-5 text-gray-500">{message}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          className="mt-5 h-12 items-center justify-center rounded-xl bg-brand-600 px-5 active:bg-brand-700"
          style={({ pressed }) => [
            elevation.card,
            pressed ? { transform: [{ scale: 0.98 }], opacity: 0.9 } : null,
          ]}
        >
          <Text className="text-base font-semibold text-white">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
