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
import React from "react";
import { Text, TextInput, View } from "react-native";

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secure?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address";
  /** When present, the field renders with red border + message below. */
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
  error = null,
}: TextFieldProps) {
  const borderColor = error ? "border-alert" : "border-gray-300";

  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-medium text-gray-700">{label}</Text>
      <TextInput
        className={`h-12 rounded-xl border ${borderColor} bg-white px-4 text-base text-gray-900`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        secureTextEntry={secure}
        autoCapitalize={autoCapitalize}
        autoComplete="off"
        keyboardType={keyboardType}
      />
      {error ? <Text className="mt-1 text-sm text-alert">{error}</Text> : null}
    </View>
  );
}
