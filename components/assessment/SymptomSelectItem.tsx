/**
 * File: components/assessment/SymptomSelectItem.tsx
 *
 * Purpose:
 *   One tappable row of the assessment checklist: a check circle, the
 *   symptom name, its optional description, and a small severity dot.
 *   Pure controlled component — selection state lives in the screen.
 */
import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { Symptom, SymptomSeverity } from "../../types/api";

/** Small color cue mirroring how serious the sign tends to be. */
const SEVERITY_DOT: Record<SymptomSeverity, string> = {
  mild: "#22c55e", // green-500
  moderate: "#d97706", // amber-600
  severe: "#b3401f", // alert
};

interface SymptomSelectItemProps {
  symptom: Symptom;
  selected: boolean;
  onToggle: (id: number) => void;
}

export function SymptomSelectItem({ symptom, selected, onToggle }: SymptomSelectItemProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={symptom.name}
      onPress={() => onToggle(symptom.id)}
      // Border width stays constant and only its color changes, so toggling a
      // row never reflows the checklist.
      className={`mb-2 flex-row items-start rounded-xl border-2 px-3 py-3 ${
        selected
          ? "border-brand-600 bg-brand-50"
          : "border-gray-200 bg-white active:bg-gray-50"
      }`}
      style={({ pressed }) => [
        { minHeight: 56 },
        pressed ? { opacity: 0.85 } : null,
      ]}
    >
      <View
        className={`mr-3 mt-0.5 h-7 w-7 items-center justify-center rounded-full border-2 ${
          selected ? "border-brand-600 bg-brand-600" : "border-gray-300 bg-white"
        }`}
      >
        {selected ? (
          <Ionicons name="checkmark" size={16} color="#ffffff" />
        ) : null}
      </View>
      <View className="flex-1">
        <View className="flex-row items-center">
          {/* Severity cue sits before the name so scanning stays easy. */}
          <View
            className="mr-1.5 h-2 w-2 rounded-full"
            style={{ backgroundColor: SEVERITY_DOT[symptom.severity] }}
          />
          <Text
            className={`flex-shrink text-sm font-semibold ${
              selected ? "text-brand-700" : "text-gray-900"
            }`}
          >
            {symptom.name}
          </Text>
        </View>
        {symptom.description ? (
          <Text className="mt-1 text-xs leading-4 text-gray-500" numberOfLines={2}>
            {symptom.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
