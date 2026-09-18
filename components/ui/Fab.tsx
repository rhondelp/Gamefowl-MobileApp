/**
 * File: components/ui/Fab.tsx
 *
 * Purpose:
 *   Floating action button for a screen's single most important action.
 *   Anchored above the tab bar and clear of the home indicator.
 *
 *   Extended (label + icon) rather than icon-only: "Start Assessment" is not
 *   a universally understood glyph, and an unlabeled FAB would be a guess.
 */
import React from "react";
import { Pressable, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { elevation } from "./elevation";
import { tapMedium } from "./haptics";

interface FabProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}

export function Fab({ label, icon = "pulse", onPress }: FabProps) {
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        void tapMedium();
        onPress();
      }}
      style={({ pressed }) => [
        elevation.overlay,
        {
          position: "absolute",
          right: 20,
          bottom: insets.bottom + 20,
        },
        pressed ? { transform: [{ scale: 0.96 }], opacity: 0.95 } : null,
      ]}
      className="h-14 flex-row items-center rounded-full bg-brand-500 pl-5 pr-6 active:bg-brand-600"
    >
      <Ionicons name={icon} size={20} color="#ffffff" />
      <Text className="ml-2 text-sm font-semibold text-white">{label}</Text>
    </Pressable>
  );
}
