/**
 * File: components/assessment/SymptomSelectItem.tsx
 *
 * Purpose:
 *   One tappable row of the assessment checklist: a check circle, the
 *   symptom name, its optional description, and a small severity dot.
 *   Pure controlled component — selection state lives in the screen.
 */
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
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
    <TouchableOpacity
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={symptom.name}
      onPress={() => onToggle(symptom.id)}
      className={`mb-2 flex-row items-start rounded-xl border px-3 py-3 ${
        selected ? "border-brand-600 bg-brand-50" : "border-gray-200 bg-white"
      }`}
    >
      <View
        className={`mr-3 mt-0.5 h-6 w-6 items-center justify-center rounded-full border ${
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
          <Text className="mt-0.5 text-xs leading-4 text-gray-500" numberOfLines={2}>
            {symptom.description}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
