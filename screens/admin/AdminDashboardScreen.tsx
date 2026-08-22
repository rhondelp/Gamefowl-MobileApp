/**
 * File: screens/admin/AdminDashboardScreen.tsx
 *
 * Purpose:
 *   The admin landing screen: system-wide aggregates from
 *   GET /admin/dashboard rendered as glanceable stat cards and simple
 *   proportional bars — no raw JSON anywhere. This screen is likely to be
 *   screenshotted for capstone documentation, so it stays presentable.
 *
 *   All numbers are display-only; derivation lives in DashboardService on
 *   the backend (the app never computes stats client-side).
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../../components/ui/Screen";
import { ErrorState } from "../../components/ui/ErrorState";
import { useAuth } from "../../contexts/AuthContext";
import * as adminApi from "../../services/api/admin";
import { ApiError } from "../../services/api/client";
import { scoreTier, tierBarColor } from "../../components/assessment/scoreTiers";
import { formatDateTime } from "../../utils/format";
import type { DashboardStats } from "../../types/admin";
import type { AdminStackScreenProps } from "../../navigation/types";

type Props = AdminStackScreenProps<"AdminDashboard">;

/** Big-number card used for the three headline counts. */
function StatCard({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
}) {
  return (
    <View className="flex-1 items-center rounded-2xl border border-gray-200 bg-white px-2 py-4">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-brand-100">
        <Ionicons name={icon} size={18} color="#276a43" />
      </View>
      <Text className="mt-2 text-xl font-bold text-gray-900">{value}</Text>
      <Text className="mt-0.5 text-center text-[11px] leading-4 text-gray-500">
        {label}
      </Text>
    </View>
  );
}

/** Name + count row with a proportional bar (for "top N" lists). */
function CountRow({
  rank,
  name,
  count,
  max,
}: {
  rank: number;
  name: string;
  count: number;
  max: number;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <View className="mb-2">
      <View className="flex-row items-center">
        <Text className="w-5 text-xs font-semibold text-gray-400">{rank}.</Text>
        <Text className="flex-1 text-sm font-medium text-gray-800" numberOfLines={1}>
          {name}
        </Text>
        <Text className="ml-2 text-sm font-bold text-brand-700">{count}</Text>
      </View>
      <View className="ml-5 mt-1 h-1.5 flex-row overflow-hidden rounded-full bg-gray-100">
        <View
          className="h-full rounded-full bg-brand-500"
          style={{ width: `${pct}%` }}
        />
      </View>
    </View>
  );
}

export function AdminDashboardScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!token) return;
      try {
        if (!silent || !stats) setLoading(true);
        setStats(await adminApi.dashboard(token));
        setError(null);
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "Something went wrong. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [token, stats]
  );

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  if (loading && !stats) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2e7d4f" />
          <Text className="mt-3 text-sm text-gray-500">Loading statistics…</Text>
        </View>
      </Screen>
    );
  }

  if (error && !stats) {
    return (
      <Screen>
        <View className="flex-1 justify-center">
          <ErrorState message={error} onRetry={() => void load()} />
        </View>
      </Screen>
    );
  }

  if (!stats) return null;

  const roles = stats.users_by_role ?? {};
  const maxSymptomCount = Math.max(
    1,
    ...stats.most_frequently_reported_symptoms.map((s) => s.count)
  );
  const maxDiseaseCount = Math.max(
    1,
    ...stats.most_frequently_suggested_diseases.map((d) => d.suggestion_count)
  );

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void onRefresh()}
          tintColor="#2e7d4f"
          colors={["#2e7d4f"]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Headline counts */}
      <View className="flex-row space-x-3">
        <StatCard icon="people" value={stats.total_users} label="Users" />
        <StatCard icon="paw" value={stats.total_gamefowls} label="Gamefowls" />
        <StatCard icon="pulse" value={stats.total_assessments} label="Assessments" />
      </View>

      {/* Management shortcuts — entry points to every admin surface. */}
      <SectionTitle>Manage</SectionTitle>
      <View className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <MenuRow
          icon="people"
          label="User management"
          sub="Roles, status, deactivation"
          onPress={() => navigation.navigate("AdminUsers")}
        />
        <MenuRow
          icon="book"
          label="Diseases"
          sub="Conditions, rules, linked guidance"
          onPress={() => navigation.navigate("AdminDiseases")}
        />
        <MenuRow
          icon="medkit"
          label="Symptoms"
          sub="Signs owners can report"
          onPress={() => navigation.navigate("AdminSymptoms")}
        />
        <MenuRow
          icon="list"
          label="Recommendations"
          sub="Care guidance library"
          onPress={() => navigation.navigate("AdminRecommendations")}
          last
        />
      </View>

      {/* Breakdowns */}
      <SectionTitle>Accounts</SectionTitle>
      <View className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
        <View className="flex-row">
          <View className="flex-1">
            <Text className="text-xs uppercase tracking-wide text-gray-400">By role</Text>
            <View className="mt-1.5 flex-row">
              {(["owner", "admin"] as const).map((role) => (
                <View key={role} className="mr-2 rounded-full bg-brand-50 px-2.5 py-1">
                  <Text className="text-xs font-medium capitalize text-brand-700">
                    {role}: {roles[role] ?? 0}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          <View className="items-end">
            <Text className="text-xs uppercase tracking-wide text-gray-400">Status</Text>
            <Text className="mt-1.5 text-xs text-gray-600">
              {stats.users_by_active_status.active} active ·{" "}
              {stats.users_by_active_status.inactive} inactive
            </Text>
          </View>
        </View>
      </View>

      {/* Most reported symptoms */}
      <SectionTitle>Most reported symptoms</SectionTitle>
      <View className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
        {stats.most_frequently_reported_symptoms.length === 0 ? (
          <Text className="py-2 text-sm text-gray-500">No assessments yet.</Text>
        ) : (
          stats.most_frequently_reported_symptoms.map((symptom, index) => (
            <CountRow
              key={symptom.id}
              rank={index + 1}
              name={symptom.name}
              count={symptom.count}
              max={maxSymptomCount}
            />
          ))
        )}
      </View>

      {/* Most suggested diseases */}
      <SectionTitle>Most suggested diseases</SectionTitle>
      <View className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
        {stats.most_frequently_suggested_diseases.length === 0 ? (
          <Text className="py-2 text-sm text-gray-500">No results recorded yet.</Text>
        ) : (
          stats.most_frequently_suggested_diseases.map((disease, index) => (
            <CountRow
              key={disease.id}
              rank={index + 1}
              name={disease.name}
              count={disease.suggestion_count}
              max={maxDiseaseCount}
            />
          ))
        )}
      </View>

      {/* Recent assessments across all owners */}
      <SectionTitle>Recent assessments</SectionTitle>
      <View className="rounded-2xl border border-gray-200 bg-white px-4 py-1">
        {stats.recent_assessments.length === 0 ? (
          <Text className="py-3 text-sm text-gray-500">Nothing submitted yet.</Text>
        ) : (
          stats.recent_assessments.map((row) => (
            <View
              key={row.id}
              className="flex-row items-center border-b border-gray-100 py-3 last:border-b-0"
            >
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                  {row.gamefowl_name}
                </Text>
                <Text className="text-xs text-gray-500">
                  {row.top_possible_disease
                    ? `${row.top_possible_disease.name}`
                    : "No strong match"}
                  {"  ·  "}
                  {formatDateTime(row.assessed_at)}
                </Text>
              </View>
              {row.match_score !== null ? (
                <View
                  className="rounded-full px-2.5 py-1"
                  style={{
                    backgroundColor:
                      tierBarColor(scoreTier(row.match_score)) === "#9ca3af"
                        ? "#f3f4f6"
                        : tierBarColor(scoreTier(row.match_score)),
                  }}
                >
                  <Text
                    className={`text-xs font-bold ${
                      scoreTier(row.match_score) === "weak" ? "text-gray-500" : "text-white"
                    }`}
                  >
                    {row.match_score}%
                  </Text>
                </View>
              ) : null}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text className="mb-2 mt-5 text-xs font-semibold uppercase tracking-widest text-brand-600">
      {children}
    </Text>
  );
}

/** Tappable management shortcut row: icon + label + chevron. */
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
