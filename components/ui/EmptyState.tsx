/**
 * File: components/ui/EmptyState.tsx
 *
 * Purpose:
 *   Standard "nothing here yet" block used by Dashboard and My Gamefowl.
 *   One component keeps empty states consistent (project UI rule: every
 *   data screen has explicit loading/empty/error states).
 */
import React from "react";
import { Pressable, Text, View } from "react-native";

import { elevation } from "./elevation";
import {
  EmptyIllustration,
  type EmptyIllustrationVariant,
} from "./EmptyIllustration";

interface EmptyStateProps {
  /** Which line illustration to show — see EmptyIllustration. */
  variant?: EmptyIllustrationVariant;
  title: string;
  message?: string;
  /** When provided, renders a call-to-action button under the message. */
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  variant = "flock",
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    // No dashed box: whitespace and the illustration carry the state now.
    <View className="items-center px-6 py-12">
      <EmptyIllustration variant={variant} />
      <Text className="mt-5 text-lg font-semibold text-ink-primary">{title}</Text>
      {message ? (
        <Text className="mt-2 text-center text-sm leading-5 text-ink-secondary">
          {message}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          className="mt-6 h-12 items-center justify-center rounded-control bg-brand-600 px-5 active:bg-brand-700"
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
