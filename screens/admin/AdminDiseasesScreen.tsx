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
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { Screen } from "../../components/ui/Screen";
import { brandRefreshColors } from "../../components/ui/BrandRefreshControl";
import {
  isCriticalSeverity,
  severityTone,
  tone,
} from "../../components/ui/status";
import { elevation } from "../../components/ui/elevation";
import { SkeletonList } from "../../components/ui/Skeleton";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { useAuth } from "../../contexts/AuthContext";
import * as adminApi from "../../services/api/admin";
import { ApiError } from "../../services/api/client";
import type { AdminDisease } from "../../types/admin";
import type { AdminStackScreenProps } from "../../navigation/types";

/** Same tones the owner-facing screens use — see components/ui/status.ts. */
function severityChip(severity: string) {
  const t = tone(severityTone(severity));
  const solid = isCriticalSeverity(severity);
  return {
    backgroundColor: solid ? t.solid : t.soft,
    color: solid ? "#ffffff" : t.text,
  };
}

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
        <SkeletonList count={5} label="Loading diseases" />
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
                variant="archive"
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
              className="mb-3 rounded-card bg-surface-card px-4 py-3.5 active:bg-brand-50"
              style={({ pressed }) => [
                elevation.card,
                pressed ? { transform: [{ scale: 0.99 }] } : null,
              ]}
            >
              <View className="flex-row items-center">
                <Text className="flex-shrink text-base font-semibold text-ink-primary" numberOfLines={1}>
                  {item.name}
                </Text>
                {!item.is_active ? (
                  <View className="ml-2 rounded-full bg-gray-100 px-2 py-0.5">
                    <Text className="text-[10px] font-semibold uppercase text-ink-tertiary">
                      Inactive
                    </Text>
                  </View>
                ) : null}
              </View>
              <View className="mt-1.5 flex-row items-center">
                <View
                className="rounded-full px-2.5 py-1"
                style={{ backgroundColor: severityChip(item.severity).backgroundColor }}
              >
                  <Text
                    className="text-xs font-semibold uppercase"
                  style={{ color: severityChip(item.severity).color }}
                  >
                    {item.severity}
                  </Text>
                </View>
                <Text className="ml-2 text-xs text-ink-tertiary">
                  {item.rules.length} {item.rules.length === 1 ? "rule" : "rules"}
                  {" · "}
                  {item.recommendations.length}{" "}
                  {item.recommendations.length === 1 ? "recommendation" : "recommendations"}
                </Text>
              </View>
            </Pressable>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={
                refreshing
                  ? undefined
                  : () => {
                      setRefreshing(true);
                      void load().finally(() => setRefreshing(false));
                    }
              }
              {...brandRefreshColors}
            />
          }
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}
