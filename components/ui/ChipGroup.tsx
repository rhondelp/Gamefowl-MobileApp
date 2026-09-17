/**
 * File: components/ui/ChipGroup.tsx
 *
 * Purpose:
 *   Labeled single-select chip row used for enum-style context questions
 *   (duration / appetite / activity level). Chips instead of free text so
 *   only values valid against the backend enum can ever be submitted.
 *   Selection is OPTIONAL — passing undefined sends nothing, matching the
 *   backend's `sometimes|nullable` semantics.
 */
import React from "react";
import { Pressable, Text, View } from "react-native";

interface ChipGroupProps<T extends string> {
  label: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  /** Shown after the label when the field may be left empty. */
  hint?: string;
}

export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
  hint,
}: ChipGroupProps<T>) {
  return (
    <View className="mb-4">
      <View className="mb-2 flex-row items-baseline">
        <Text className="text-sm font-medium text-gray-700">{label}</Text>
        {hint ? <Text className="ml-1 text-xs text-gray-500">{hint}</Text> : null}
      </View>
      <View className="flex-row flex-wrap">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              // minHeight keeps every chip at the 44pt touch minimum even
              // though the label is only ~20pt tall.
              style={({ pressed }) => [
                { minHeight: 44 },
                pressed ? { transform: [{ scale: 0.97 }], opacity: 0.9 } : null,
              ]}
              className={`mr-2 mb-2 items-center justify-center rounded-full border-2 px-4 ${
                selected
                  ? "border-brand-600 bg-brand-600"
                  : "border-gray-300 bg-white active:bg-brand-50"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  selected ? "text-white" : "text-gray-700"
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
