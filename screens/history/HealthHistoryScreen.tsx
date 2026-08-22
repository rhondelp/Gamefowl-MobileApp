/**
 * File: screens/history/HealthHistoryScreen.tsx
 *
 * Purpose:
 *   Chronological merged timeline for one bird — engine assessments and
 *   human logbook records interleaved newest-first (backend sorts; same-day
 *   records intentionally sit above that day's assessments).
 *
 *   - Visual distinction between entry types comes from TimelineEntryCard
 *     (icon + accent color + type chip), not just text.
 *   - Tap an assessment  -> historical view of its full diagnostic results.
 *   - Tap a record       -> full logbook detail (notes fetched there).
 *   - Pull-to-refresh, infinite scroll (total-based — this feed has no
 *     last_page), explicit loading/error/empty states.
 */
import React, { useCallback, useRef } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { Screen } from "../../components/ui/Screen";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { TimelineEntryCard } from "../../components/history/TimelineEntryCard";
import { useHealthHistory } from "../../hooks/useHealthHistory";
import type { HealthHistoryEntry } from "../../types/api";
import type { DashboardStackScreenProps } from "../../navigation/types";

type Props = DashboardStackScreenProps<"HealthHistory">;

export function HealthHistoryScreen({ route, navigation }: Props) {
  const { gamefowlId, birdName } = route.params;
  const {
    entries,
    total,
    loading,
    refreshing,
    loadingMore,
    error,
    reload,
    refresh,
    loadMore,
  } = useHealthHistory(gamefowlId);

  // Skip first focus (hook loads on mount); later focuses revalidate so a
  // newly logged record or assessment appears without manual pulling.
  const skipFirstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (skipFirstFocus.current) {
        skipFirstFocus.current = false;
        return;
      }
      refresh();
    }, [refresh])
  );

  const handlePress = useCallback(
    (entry: HealthHistoryEntry) => {
      if (entry.type === "assessment") {
        // Reuses the M11 results screen with historical framing.
        navigation.navigate("AssessmentResult", {
          assessmentId: entry.assessment_id,
          historical: true,
        });
      } else {
        navigation.navigate("HealthRecordDetail", {
          gamefowlId,
          recordId: entry.record_id,
        });
      }
    },
    [navigation, gamefowlId]
  );

  return (
    <Screen>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2e7d4f" />
          <Text className="mt-3 text-sm text-gray-500">Loading history…</Text>
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(entry) =>
            entry.type === "assessment"
              ? `a-${entry.assessment_id}`
              : `r-${entry.record_id}`
          }
          renderItem={({ item }) => (
            <TimelineEntryCard entry={item} onPress={() => handlePress(item)} />
          )}
          ListHeaderComponent={
            <View className="mb-2">
              {birdName ? (
                <Text className="text-sm text-gray-500">
                  Health timeline for{" "}
                  <Text className="font-semibold text-gray-700">{birdName}</Text>
                </Text>
              ) : null}
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="time-outline"
              title="No health history yet"
              message="Run a symptom assessment or log a record to start building this bird's timeline."
              actionLabel="+ Start Assessment"
              onAction={() =>
                navigation.navigate("SymptomSelect", { gamefowlId, birdName })
              }
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <View className="items-center py-3">
                <ActivityIndicator color="#2e7d4f" />
              </View>
            ) : null
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          refreshing={refreshing}
          onRefresh={refresh}
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </Screen>
  );
}
