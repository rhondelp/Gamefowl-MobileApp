/**
 * File: screens/DashboardScreen.tsx
 *
 * Purpose:
 *   PLACEHOLDER main screen for Milestone 9. Its only jobs:
 *     1. Prove the auth flow end-to-end — it can only be reached when
 *        signed in, and it shows the real user's name from GET /auth/me.
 *     2. Provide a working Logout button (with confirmation dialog) that
 *        returns the user to Login via auth-state change.
 *
 *   Real dashboard content (bird list, health summaries) arrives in
 *   Milestone 10+; do not add feature screens here yet.
 */
import React from "react";
import { Alert, Text, View } from "react-native";
import { Screen } from "../components/ui/Screen";
import { Button } from "../components/ui/Button";
import { useAuth } from "../contexts/AuthContext";

export function DashboardScreen() {
  const { user, logout } = useAuth();

  /**
   * Confirmation dialog first (project rule: confirm important actions),
   * then logout. Auth state flips to signedOut, which swaps the navigator
   * back to Login automatically.
   */
  const confirmLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: () => void logout() },
    ]);
  };

  return (
    <Screen>
      <View className="flex-1 justify-between">
        <View className="mt-6">
          <Text className="text-xs font-semibold uppercase tracking-widest text-brand-500">
            Welcome back
          </Text>
          <Text className="mt-1 text-2xl font-bold text-gray-900">{user?.name}</Text>
          {/* Role chip: proves /auth/me returned a real profile after boot. */}
          <View className="mt-2 self-start rounded-full bg-brand-100 px-3 py-1">
            <Text className="text-xs font-medium capitalize text-brand-700">{user?.role}</Text>
          </View>

          <View className="mt-8 rounded-2xl border border-dashed border-gray-300 p-5">
            <Text className="text-sm text-gray-500">
              Your gamefowl list and health summaries will appear here in an
              upcoming milestone.
            </Text>
          </View>
        </View>

        <View className="mb-4">
          <Button label="Log Out" variant="danger" onPress={confirmLogout} />
        </View>
      </View>
    </Screen>
  );
}
