/**
 * File: screens/admin/AdminRecommendationsScreen.tsx
 *
 * Purpose:
 *   Flat admin list of care recommendations (active + deactivated). Tap to
 *   edit; "+ Add Recommendation" creates new. Linking to diseases happens on
 *   the Disease Detail screen (one place owns both directions of the link).
 */
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { Screen } from "../../components/ui/Screen";
import { elevation } from "../../components/ui/elevation";
import { SkeletonList } from "../../components/ui/Skeleton";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { useAuth } from "../../contexts/AuthContext";
import * as adminApi from "../../services/api/admin";
import { ApiError } from "../../services/api/client";
import type { AdminRecommendation } from "../../types/admin";
import type { AdminStackScreenProps } from "../../navigation/types";

type Props = AdminStackScreenProps<"AdminRecommendations">;

export function AdminRecommendationsScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [recommendations, setRecommendations] = useState<AdminRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await adminApi.listRecommendations(token);
      setRecommendations(data.items);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong. Please try again."
      );
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        setLoading(recommendations.length === 0);
        await load();
        setLoading(false);
      })();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [load])
  );

  if (loading) {
    return (
      <Screen>
        <SkeletonList count={5} label="Loading recommendations" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Button
        label="+ Add Recommendation"
        onPress={() => navigation.navigate("AdminRecommendationForm", {})}
      />

      {error ? (
        <View className="mt-4 flex-1 justify-center">
          <ErrorState message={error} onRetry={() => void load()} />
        </View>
      ) : (
        <FlatList
          data={recommendations}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <View className="mt-3">
              <EmptyState
                variant="archive"
                title="No recommendations yet"
                message="Care guidance shown alongside disease results."
              />
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                navigation.navigate("AdminRecommendationForm", {
                  recommendationId: item.id,
                })
              }
              className="mb-3 rounded-card bg-surface-card px-4 py-3.5 active:bg-brand-50"
              style={({ pressed }) => [
                elevation.card,
                pressed ? { transform: [{ scale: 0.99 }] } : null,
              ]}
            >
              <View className="flex-row items-center">
                <Text className="flex-shrink flex-1 text-sm font-semibold text-ink-primary" numberOfLines={1}>
                  {item.title}
                </Text>
                {!item.is_active ? (
                  <View className="ml-2 rounded-full bg-gray-100 px-2 py-0.5">
                    <Text className="text-[10px] font-semibold uppercase text-ink-tertiary">
                      Inactive
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text className="mt-0.5 text-xs capitalize text-ink-tertiary" numberOfLines={2}>
                {item.category} · {item.content}
              </Text>
            </Pressable>
          )}
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}
