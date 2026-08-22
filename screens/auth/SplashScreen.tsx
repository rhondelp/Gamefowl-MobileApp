/**
 * File: screens/auth/SplashScreen.tsx
 *
 * Purpose:
 *   Shown while AuthContext.bootstrap() checks SecureStore for a stored
 *   token and validates it against GET /auth/me. Once that resolves, the
 *   RootNavigator switches to the auth stack or the main app — this screen
 *   itself has no interactivity.
 */
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";

export function SplashScreen() {
  return (
    <View className="items-center justify-center flex-1 bg-brand-600">
      <Text className="text-4xl font-bold tracking-widest text-white">GAMEFOWL</Text>
      <Text className="mt-2 text-sm text-brand-100">Early Bird Disease Monitoring</Text>
      <ActivityIndicator color="#ffffff" className="mt-8" />
    </View>
  );
}

