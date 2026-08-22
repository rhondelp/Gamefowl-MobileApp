/**
 * File: components/ui/Screen.tsx
 *
 * Purpose:
 *   Shared page container. Wraps every screen so padding, background, and
 *   keyboard behavior are consistent without each screen repeating layout
 *   classes.
 *
 * scroll=true wraps content in KeyboardAvoidingView + ScrollView — required
 * for Login/Register so the submit button stays reachable when the keyboard
 * opens on small devices.
 */
import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenProps {
  children: React.ReactNode;
  /** Use for forms; adds keyboard avoidance + scrolling. */
  scroll?: boolean;
}

export function Screen({ children, scroll = false }: ScreenProps) {
  // Insets keep content clear of notches/home indicators.
  const insets = useSafeAreaInsets();

  if (scroll) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-gray-50"
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      className="flex-1 bg-gray-50 px-6"
    >
      {children}
    </View>
  );
}
