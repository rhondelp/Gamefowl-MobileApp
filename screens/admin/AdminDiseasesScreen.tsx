/**
 * File: screens/admin/AdminDiseasesScreen.tsx
 *
 * Purpose:
 *   Flat (unpaginated) admin list of ALL diseases — active and inactive,
 *   since admins can reactivate. Each row shows severity, rule count, and
 *   an inactive badge; tap opens the detail screen where rules and linked
 *   recommendations are managed.
 */
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { useAuth } from "../../contexts/AuthContext";
import * as adminApi from "../../services/api/admin";
import { ApiError } from "../../services/api/client";
import type { AdminDisease } from "../../types/admin";
import type { AdminStackScreenProps } from "../../navigation/types";

const SEVERITY_CHIP: Record<string, string> = {
  mild: "bg-green-100",
  moderate: "bg-amber-100",
  severe: "bg-red-100",
  critical: "bg-alert",
};
const SEVERITY_TEXT: Record<string, string> = {
  mild: "text-green-700",
  moderate: "text-amber-700",
  severe: "text-red-700",
  critical: "text-white",
};

type Props = AdminStackScreenProps<"AdminDiseases">;

export function AdminDiseasesScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [diseases, setDiseases] = useState<AdminDisease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await adminApi.listDiseases(token);
      setDiseases(data.items);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again."
      );
    }
  }, [token]);

  // Reload on every focus: edits/deletes elsewhere must reflect instantly.
  useFocusEffect(
    useCallback(() => {
      void (async () => {
        setLoading(diseases.length === 0);
        await load();
        setLoading(false);
      })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load])
  );

  if (loading) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2e7d4f" />
          <Text className="mt-3 text-sm text-gray-500">Loading diseases…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Button
        label="+ Add Disease"
        onPress={() => navigation.navigate("AdminDiseaseForm", {})}
      />

      {error ? (
        <View className="mt-4 flex-1 justify-center">
          <ErrorState message={error} onRetry={() => void load()} />
        </View>
      ) : (
        <FlatList
          data={diseases}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <View className="mt-3">
              <EmptyState
                icon="book-outline"
                title="No diseases yet"
                message="Add the first condition to start building the knowledge base."
              />
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                navigation.navigate("AdminDiseaseDetail", { diseaseId: item.id })
              }
              className="mb-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 active:bg-brand-50"
            >
              <View className="flex-row items-center">
                <Text className="flex-shrink text-base font-semibold text-gray-900" numberOfLines={1}>
                  {item.name}
                </Text>
                {!item.is_active ? (
                  <View className="ml-2 rounded-full bg-gray-100 px-2 py-0.5">
                    <Text className="text-[10px] font-semibold uppercase text-gray-500">
                      Inactive
                    </Text>
                  </View>
                ) : null}
              </View>
              <View className="mt-1.5 flex-row items-center">
                <View className={`rounded-full px-2 py-0.5 ${SEVERITY_CHIP[item.severity] ?? "bg-gray-100"}`}>
                  <Text
                    className={`text-[10px] font-semibold uppercase ${SEVERITY_TEXT[item.severity] ?? "text-gray-500"}`}
                  >
                    {item.severity}
                  </Text>
                </View>
                <Text className="ml-2 text-xs text-gray-500">
                  {item.rules.length} {item.rules.length === 1 ? "rule" : "rules"}
                  {" · "}
                  {item.recommendations.length}{" "}
                  {item.recommendations.length === 1 ? "recommendation" : "recommendations"}
                </Text>
              </View>
            </Pressable>
          )}
          onRefresh={
            refreshing
              ? undefined
              : () => {
                  setRefreshing(true);
                  void load().finally(() => setRefreshing(false));
                }
          }
          refreshing={refreshing}
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}
