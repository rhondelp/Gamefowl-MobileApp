/**
 * File: screens/profile/ProfileScreen.tsx
 *
 * Purpose:
 *   Combined Profile & Settings screen (Milestone 15 polish). Sections:
 *
 *     - Account: name / email / role — READ-ONLY by design: the backend's
 *       auth API (register/login/logout/me) exposes no profile-update
 *       endpoint, so an edit flow would have nothing to call.
 *     - About: app version (read straight from app.json — zero extra deps)
 *       and the veterinary disclaimer as a persistent reference rather than
 *       a once-seen mid-flow notice.
 *     - Log Out with the established confirmation dialog.
 *
 *   Deliberately EXCLUDED settings (nothing invented for its own sake):
 *     - Theme toggle — no dark theme exists in this app.
 *     - Notification preferences — no notification system exists.
 */
import React, { useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { showToast } from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";
import type { ProfileStackScreenProps } from "../../navigation/types";

type Props = ProfileStackScreenProps<"ProfileMain">;

// Keep in sync with app.json "expo.version" (Metro cannot bundle app.json
// itself — Expo CLI reserves it as build config).
const APP_VERSION = "1.0.0";

/** The exact wording the backend attaches to every assessment/status. */
const DISCLAIMER_TEXT =
  "This assessment is generated from reported symptoms and is not a confirmed " +
  "veterinary diagnosis. Always consult a licensed veterinarian for confirmation " +
  "and treatment, especially for severe or critical findings.";

export function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const confirmLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: () => {
          showToast("Logged out.");
          void logout();
        },
      },
    ]);
  };

  return (
    <Screen>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Account header */}
        <View className="mt-4 items-center">
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
        </View>

        {/* Account self-service (Milestone 16 — Backend M9 endpoints). */}
        <View className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <MenuRow
            icon="person-outline"
            label="Edit profile"
            sub="Update your name and email"
            onPress={() => navigation.navigate("EditProfile")}
          />
          <MenuRow
            icon="lock-closed-outline"
            label="Change password"
            sub="Signs out your other devices"
            onPress={() => navigation.navigate("ChangePassword")}
            last
          />
        </View>

        {/* About */}
        <Text className="mb-2 mt-7 text-xs font-semibold uppercase tracking-widest text-brand-600">
          About
        </Text>
        <View className="rounded-2xl border border-gray-200 bg-white px-4 py-1">
          <View className="items-center py-3">
            <Image
              source={require("../../assets/images/main_logo.png")}
              style={{ width: 88, height: 88, resizeMode: "contain" }}
            />
          </View>
          <View className="flex-row items-center border-t border-gray-100 py-3">
            <Ionicons name="information-circle-outline" size={18} color="#276a43" />
            <Text className="ml-3 flex-1 text-sm text-gray-700">App version</Text>
            <Text className="text-sm font-medium text-gray-900">{APP_VERSION}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: showDisclaimer }}
            onPress={() => setShowDisclaimer((prev) => !prev)}
            className={`flex-row items-center py-3 ${
              showDisclaimer ? "border-t border-gray-100" : ""
            }`}
          >
            <Ionicons name="medkit-outline" size={18} color="#276a43" />
            <Text className="ml-3 flex-1 text-sm text-gray-700">
              Veterinary consultation notice
            </Text>
            <Ionicons
              name={showDisclaimer ? "chevron-up" : "chevron-down"}
              size={15}
              color="#9ca3af"
            />
          </Pressable>
          {showDisclaimer ? (
            <View className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5">
              <Text className="text-xs leading-4 text-amber-800">
                {DISCLAIMER_TEXT}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Preferences placeholder note keeps expectations honest without
            inventing dead toggles. */}
        <Text className="mb-2 mt-6 text-xs font-semibold uppercase tracking-widest text-brand-600">
          Preferences
        </Text>
        <View className="items-start rounded-2xl border border-dashed border-gray-300 bg-white p-4">
          <Text className="text-xs leading-4 text-gray-500">
            More preferences will appear here in future releases. This app
            intentionally ships only settings it can actually honor today.
          </Text>
        </View>

        <View className="mt-8">
          <Button label="Log Out" variant="danger" onPress={confirmLogout} />
        </View>

        <Text className="mt-6 self-center text-[11px] text-gray-400">
          GAMEFOWL · Early Bird Disease Monitoring
        </Text>
      </ScrollView>
    </Screen>
  );
}

/** Tappable settings row: icon + label + chevron (matches Admin dashboard). */
function MenuRow({
  icon,
  label,
  sub,
  onPress,
  last = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={`flex-row items-center px-4 py-3.5 active:bg-brand-50 ${
        last ? "" : "border-b border-gray-100"
      }`}
    >
      <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-100">
        <Ionicons name={icon} size={17} color="#276a43" />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-sm font-semibold text-gray-900">{label}</Text>
        <Text className="text-xs text-gray-500">{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
    </Pressable>
  );
}
