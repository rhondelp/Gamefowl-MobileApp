/**
 * File: screens/profile/ProfileScreen.tsx
 *
 * Purpose:
 *   Placeholder Profile/Settings tab for Milestone 10 — shows the signed-in
 *   account and hosts Log Out (with confirmation dialog, moved here from
 *   the old placeholder Dashboard so Dashboard stays a clean monitoring
 *   surface). Real settings/preferences arrive in a later milestone.
 */
import React from "react";
import { Alert, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../contexts/AuthContext";

export function ProfileScreen() {
  const { user, logout } = useAuth();

  const confirmLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: () => void logout() },
    ]);
  };

  return (
    <Screen>
      <View className="mt-6 items-center">
        {/* Monogram avatar */}
        <View className="h-20 w-20 items-center justify-center rounded-full bg-brand-100">
          <Text className="text-2xl font-bold text-brand-700">
            {user?.name?.charAt(0).toUpperCase() ?? "?"}
          </Text>
        </View>
        <Text className="mt-3 text-xl font-bold text-gray-900">{user?.name}</Text>
        <Text className="text-sm text-gray-500">{user?.email}</Text>
        <View className="mt-2 rounded-full bg-brand-100 px-3 py-1">
          <Text className="text-xs font-medium capitalize text-brand-700">
            {user?.role}
          </Text>
        </View>

        <View className="mt-8 w-full items-center rounded-2xl border border-dashed border-gray-300 p-5">
          <Ionicons name="settings-outline" size={24} color="#9ca3af" />
          <Text className="mt-2 text-center text-sm text-gray-500">
            Settings and preferences will appear here in an upcoming milestone.
          </Text>
        </View>
      </View>

      <View className="mt-auto mb-4">
        <Button label="Log Out" variant="danger" onPress={confirmLogout} />
      </View>
    </Screen>
  );
}
