/**
 * File: screens/gamefowl/GamefowlDetailsScreen.tsx
 *
 * Purpose:
 *   Full profile view for one bird — the hub for everything health-related:
 *     - Health Status card (M12): backend-derived label + last assessment /
 *       latest record context, displayed verbatim (never recomputed here)
 *     - Start Health Assessment (M11 flow) and Log Health Record actions
 *     - View Full History -> merged timeline screen
 *     - Edit Profile and the reversible Deactivate / Reactivate action
 *
 *   Deactivation uses `PUT { is_active: false }` — the backend's documented
 *   owner-facing retirement mechanism (reversible; history is kept). On
 *   success we pop back to the list/dashboard, which revalidates on focus,
 *   so the bird disappears from active lists immediately.
 */
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { ErrorState } from "../../components/ui/ErrorState";
import { HealthStatusBadge } from "../../components/history/HealthStatusBadge";
import { useAuth } from "../../contexts/AuthContext";
import { useGamefowl } from "../../hooks/useGamefowl";
import * as gamefowlsApi from "../../services/api/gamefowls";
import * as healthHistoryApi from "../../services/api/healthHistory";
import { ApiError } from "../../services/api/client";
import {
  formatAge,
  formatDate,
  formatWeight,
} from "../../utils/format";
import type { HealthStatusSummary } from "../../types/api";
import type { DashboardStackScreenProps } from "../../navigation/types";

type Props = DashboardStackScreenProps<"GamefowlDetails">;

export function GamefowlDetailsScreen({ route, navigation }: Props) {
  const { gamefowlId } = route.params;
  const { token } = useAuth();
  const { gamefowl, loading, error, load } = useGamefowl(gamefowlId);
  // Spinner on the action buttons while a deactivate/reactivate is running.
  const [actionBusy, setActionBusy] = useState(false);
  // Derived status summary (display-only; failures hide just the card).
  const [statusSummary, setStatusSummary] = useState<HealthStatusSummary | null>(null);

  /** Status fetch: silent once present, non-blocking on failure. */
  const loadStatus = useCallback(
    async (silent = false) => {
      if (!token) return;
      try {
        if (!silent) setStatusSummary(null);
        setStatusSummary(await healthHistoryApi.status(token, gamefowlId));
      } catch {
        // The bird profile stays usable even if status can't load right now;
        // next focus retries automatically.
      }
    },
    [token, gamefowlId]
  );

  // Revalidate both profile and status on every focus. `load(true)` is
  // silent once content is on screen; first calls still spin.
  useFocusEffect(
    useCallback(() => {
      void load(true);
      void loadStatus(true);
    }, [load, loadStatus])
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

        {/* Health Status card — displays the backend's derived summary. */}
        {statusSummary ? (
          <View className="mt-4 rounded-2xl border border-gray-200 bg-white px-4 py-3.5">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-gray-900">Health status</Text>
              <HealthStatusBadge status={statusSummary.status} />
            </View>

            {statusSummary.based_on ? (
              <Text className="mt-2 text-xs leading-5 text-gray-600">
                Top match:{" "}
                <Text className="font-semibold text-gray-800">
                  {statusSummary.based_on.top_possible_disease.name} ·{" "}
                  {statusSummary.based_on.match_score}%
                </Text>
                {statusSummary.days_since_last_assessment !== null
                  ? ` · assessed ${statusSummary.days_since_last_assessment} ${
                      statusSummary.days_since_last_assessment === 1 ? "day" : "days"
                    } ago`
                  : null}
              </Text>
            ) : statusSummary.status === "no_data" ? (
              <Text className="mt-2 text-xs leading-5 text-gray-500">
                No symptom assessments yet — start one below to establish a baseline.
              </Text>
            ) : null}

            {statusSummary.latest_health_record ? (
              <Text className="mt-1 text-xs leading-5 text-gray-600">
                Last record: {statusSummary.latest_health_record.title} ·{" "}
                {formatDate(statusSummary.latest_health_record.recorded_at)}
              </Text>
            ) : null}

            {/* Timeline entry point. */}
            <TouchableOpacity
              accessibilityRole="button"
              className="mt-3 flex-row items-center border-t border-gray-100 pt-3"
              onPress={() =>
                navigation.navigate("HealthHistory", {
                  gamefowlId: gamefowl.id,
                  birdName: gamefowl.name,
                })
              }
            >
              <Ionicons name="time-outline" size={16} color="#276a43" />
              <Text className="ml-1.5 flex-1 text-sm font-semibold text-brand-700">
                View full history
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        ) : null}

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
              label="Log Health Record"
              variant="outline"
              onPress={() =>
                navigation.navigate("AddHealthRecord", {
                  gamefowlId: gamefowl.id,
                  birdName: gamefowl.name,
                })
              }
            />
          </View>
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
