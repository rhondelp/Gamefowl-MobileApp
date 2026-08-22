/**
 * File: components/ui/Button.tsx
 *
 * Purpose:
 *   The app's single button component. One place controls touch target
 *   size, colors, and disabled/loading states for every screen.
 *
 * Variants:
 *   - primary: solid brand green (main actions)
 *   - outline: bordered, transparent fill (secondary actions like links)
 *   - danger:  warm red (destructive, e.g. Logout on Dashboard)
 *
 * `loading` replaces the label with a spinner and disables presses so a
 * double-tap can't fire two login/register requests.
 */
import React from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "danger";
  /** Shows spinner + blocks interaction while a request is in flight. */
  loading?: boolean;
}

export function Button({ label, onPress, variant = "primary", loading = false }: ButtonProps) {
  const container =
    variant === "primary"
      ? "bg-brand-600 active:bg-brand-700"
      : variant === "danger"
        ? "bg-alert active:opacity-90"
        : "border border-brand-600 bg-transparent active:bg-brand-50";

  const textColor =
    variant === "outline" ? "text-brand-600" : "text-white";

  return (
    <Pressable
      accessibilityRole="button"
      className={`h-12 items-center justify-center rounded-xl ${container} ${
        loading ? "opacity-70" : ""
      }`}
      disabled={loading}
      onPress={onPress}
    >
      {loading ? (
        // White spinner reads well on both the filled and danger variants;
        // outline keeps its own colored spinner.
        <ActivityIndicator color={variant === "outline" ? "#2e7d4f" : "#ffffff"} />
      ) : (
        <Text className={`text-base font-semibold ${textColor}`}>{label}</Text>
      )}
    </Pressable>
  );
}
