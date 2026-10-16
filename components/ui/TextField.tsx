/**
 * File: components/ui/TextField.tsx
 *
 * Purpose:
 *   Labeled text input with inline validation error. Every form field in the
 *   app renders through this component so spacing, colors, and error display
 *   stay identical across screens.
 *
 * Error sources combined into one line:
 *   - client-side checks (e.g. "Password must be at least 8 characters")
 *   - server-side field errors mapped from the backend envelope
 */
import React, { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { text } from "./palette";

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secure?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "numeric" | "decimal-pad";
  /** Grows into a multi-line input (e.g. notes fields). */
  multiline?: boolean;
  /** Hard character cap mirroring backend length rules. */
  maxLength?: number;
  error?: string | null;
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secure = false,
  autoCapitalize = "none",
  keyboardType = "default",
  multiline = false,
  maxLength,
  error = null,
}: TextFieldProps) {
  // Focus and reveal are local presentation state only — neither leaves this
  // component, and neither changes what the field submits.
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // Error outranks focus so a field never looks "fine" while it's invalid.
  const borderColor = error
    ? "border-alert bg-critical-soft"
    : focused
      ? "border-brand-600 bg-surface-card"
      : "border-gray-300 bg-surface-card";

  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-sm font-medium text-ink-secondary">{label}</Text>
      {/* The border lives on the wrapper so the reveal toggle can sit inside
          it; multiline grows the wrapper and top-aligns both children. */}
      <View
        className={`flex-row rounded-control border-2 ${borderColor} px-4 ${
          multiline ? "items-start py-3" : "items-center"
        }`}
        style={multiline ? { minHeight: 96 } : { minHeight: 48 }}
      >
        <TextInput
          className="flex-1 text-base text-ink-primary"
          style={
            multiline
              ? { textAlignVertical: "top", minHeight: 72 }
              : { paddingVertical: 12 }
          }
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
          placeholder={placeholder}
          // Tertiary ink (~4.9:1 on white) — #9ca3af washed out outdoors.
          placeholderTextColor={text.tertiary}
          secureTextEntry={secure && !revealed}
          autoCapitalize={autoCapitalize}
          autoComplete="off"
          keyboardType={keyboardType}
          multiline={multiline}
          maxLength={maxLength}
        />
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Hide password" : "Show password"}
            accessibilityState={{ selected: revealed }}
            onPress={() => setRevealed((prev) => !prev)}
            // A real 44×44 box (not just hitSlop) so the target is reliable;
            // the negative margin keeps the icon where the px-4 padding put it.
            style={({ pressed }) => [
              { width: 44, height: 44, marginRight: -12, alignItems: "center", justifyContent: "center" },
              pressed ? { opacity: 0.6 } : null,
            ]}
          >
            <Ionicons
              name={revealed ? "eye-off-outline" : "eye-outline"}
              size={19}
              color="#6b7280"
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <View className="mt-1.5 flex-row items-center">
          <Ionicons name="alert-circle" size={14} color="#b3401f" />
          <Text className="ml-1 flex-1 text-sm text-alert">{error}</Text>
        </View>
      ) : null}
    </View>
  );
}
