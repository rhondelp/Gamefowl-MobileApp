/**
 * File: screens/gamefowl/GamefowlDetailsScreen.tsx
 *
 * Purpose:
 *   Full profile view for one bird, plus the actions available today:
 *   Edit (navigates to the shared form pre-filled) and Deactivate /
 *   Reactivate (confirmation dialog first — destructive-action rule).
 *
 *   Deactivation uses `PUT { is_active: false }` — the backend's documented
 *   owner-facing retirement mechanism (reversible; history is kept). On
 *   success we pop back to the list/dashboard, which revalidates on focus,
 *   so the bird disappears from active lists immediately.
 *
 *   This screen is also the future entry point for health assessment and
 *   history flows (Milestone 11+); those actions will hang off the action
 *   area at the bottom.
 */
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { ErrorState } from "../../components/ui/ErrorState";
import { useAuth } from "../../contexts/AuthContext";
import { useGamefowl } from "../../hooks/useGamefowl";
import * as gamefowlsApi from "../../services/api/gamefowls";
import { ApiError } from "../../services/api/client";
import {
  formatAge,
  formatDate,
  formatWeight,
} from "../../utils/format";
import type { DashboardStackScreenProps } from "../../navigation/types";

type Props = DashboardStackScreenProps<"GamefowlDetails">;

export function GamefowlDetailsScreen({ route, navigation }: Props) {
  const { gamefowlId } = route.params;
  const { token } = useAuth();
  const { gamefowl, loading, error, load } = useGamefowl(gamefowlId);
  // Spinner on the action buttons while a deactivate/reactivate is running.
  const [actionBusy, setActionBusy] = useState(false);

  // Revalidate on every focus. `load(true)` is silent once content is on
  // screen; the very first call still spins because nothing is loaded yet
  // (handled inside the hook).
  useFocusEffect(
    useCallback(() => {
      void load(true);
    }, [load])
  );

  /** Confirmation dialog, then the reversible retirement call. */
  const confirmDeactivate = () => {
    if (!gamefowl || !token) return;
    Alert.alert(
      "Deactivate bird",
      `${gamefowl.name} will be moved to your inactive list. Its health history is kept and you can reactivate it later.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: () => void toggleActive(false),
        },
      ]
    );
  };

  const toggleActive = async (isActive: boolean) => {
    if (!token || !gamefowl) return;
    try {
      setActionBusy(true);
      await gamefowlsApi.update(token, gamefowl.id, { is_active: isActive });
      // Pop back so the list/dashboard can refresh on focus — per spec the
      // deactivated bird should no longer be in the active list.
      navigation.goBack();
    } catch (err) {
      Alert.alert(
        "Update failed",
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setActionBusy(false);
    }
  };

  if (loading && !gamefowl) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2e7d4f" />
          <Text className="mt-3 text-sm text-gray-500">Loading profile…</Text>
        </View>
      </Screen>
    );
  }

  if (error && !gamefowl) {
    return (
      <Screen>
        <ErrorState message={error} onRetry={() => void load()} />
      </Screen>
    );
  }

  if (!gamefowl) return null;

  return (
    <Screen>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 16 }}>
        {/* Identity header */}
        <View className="mt-2 flex-row items-center">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-100">
            <Text className="text-xl font-bold text-brand-700">
              {gamefowl.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-xl font-bold text-gray-900">{gamefowl.name}</Text>
            <Text className="text-sm text-gray-500">
              {gamefowl.breed?.trim() || "Breed not set"} · {formatAge(gamefowl.age)}
            </Text>
          </View>
          {/* Status chip */}
          <View
            className={`rounded-full px-3 py-1 ${
              gamefowl.is_active ? "bg-brand-100" : "bg-gray-100"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                gamefowl.is_active ? "text-brand-700" : "text-gray-500"
              }`}
            >
              {gamefowl.is_active ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>

        {/* Profile card */}
        <View className="mt-5 rounded-2xl border border-gray-200 bg-white px-4 py-2">
          <InfoRow label="Sex" value={gamefowl.sex} />
          <InfoRow label="Color" value={gamefowl.color} />
          <InfoRow label="Weight" value={formatWeight(gamefowl.weight)} />
          <InfoRow label="Age" value={formatAge(gamefowl.age)} />
          <InfoRow label="Date of birth" value={formatDate(gamefowl.date_of_birth)} last />
        </View>

        <View className="mt-4 rounded-2xl border border-gray-200 bg-white px-4 py-2">
          <InfoRow label="Date acquired" value={formatDate(gamefowl.date_acquired)} />
          <InfoRow label="Notes" value={gamefowl.notes?.trim() || "—"} multiline last />
        </View>

        {/* Actions */}
        <View className="mt-6">
          {/* Primary health action: the diagnostic flow (Milestone 11). */}
          <Button
            label="Start Health Assessment"
            onPress={() =>
              navigation.navigate("SymptomSelect", {
                gamefowlId: gamefowl.id,
                birdName: gamefowl.name,
              })
            }
          />
          <View className="mt-3">
            <Button
              label="Edit Profile"
              variant="outline"
              onPress={() =>
                navigation.navigate("EditGamefowl", { gamefowlId: gamefowl.id })
              }
            />
          </View>
          {gamefowl.is_active ? (
            <View className="mt-3">
              <Button
                label={actionBusy ? "Deactivating…" : "Deactivate"}
                variant="danger"
                loading={actionBusy}
                onPress={confirmDeactivate}
              />
            </View>
          ) : (
            <View className="mt-3">
              <Button
                label="Reactivate"
                loading={actionBusy}
                onPress={() => void toggleActive(true)}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

/** One label/value line inside a white card; hairline divider between rows. */
function InfoRow({
  label,
  value,
  multiline = false,
  last = false,
}: {
  label: string;
  value: string | null;
  multiline?: boolean;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-row py-3 ${last ? "" : "border-b border-gray-100"} ${
        multiline ? "items-start" : "items-center"
      }`}
    >
      <Text className="w-32 text-sm text-gray-500">{label}</Text>
      <Text
        className={`flex-1 text-sm font-medium text-gray-900 ${multiline ? "leading-5" : ""}`}
      >
        {value ?? "—"}
      </Text>
    </View>
  );
}
