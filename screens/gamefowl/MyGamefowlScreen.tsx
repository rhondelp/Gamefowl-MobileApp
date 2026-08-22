/**
 * File: screens/gamefowl/MyGamefowlScreen.tsx
 *
 * Purpose:
 *   Full paginated list of the owner's birds — Dashboard shows only the
 *   first page; this screen pages through everything with infinite scroll.
 *
 *   - Pull-to-refresh and load-more (backend paginates at 15/page)
 *   - Filter chips: Active birds only vs including retired (inactive) ones,
 *     so a deactivated bird can be found and reactivated later
 *   - Tap any bird -> Gamefowl Details
 */
import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { Screen } from "../../components/ui/Screen";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { EntranceView } from "../../components/ui/EntranceView";
import { GamefowlCard } from "../../components/gamefowl/GamefowlCard";
import { useGamefowls } from "../../hooks/useGamefowls";
import type { DashboardStackScreenProps } from "../../navigation/types";

type Props = DashboardStackScreenProps<"MyGamefowl">;

export function MyGamefowlScreen({ navigation }: Props) {
  const [showInactive, setShowInactive] = useState(false);
  const {
    gamefowls,
    pagination,
    loading,
    refreshing,
    loadingMore,
    error,
    reload,
    refresh,
    loadMore,
  } = useGamefowls(showInactive);

  // Skip-first-focus pattern: hook fetches on mount; later focuses (back
  // from Details after an edit/deactivation) silently revalidate page 1.
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

  const total = pagination?.total ?? gamefowls.length;

  return (
    <Screen>
      {/* Filter chips + count */}
      <View className="mb-3 flex-row items-center">
        <FilterChip
          label="Active"
          selected={!showInactive}
          onPress={() => setShowInactive(false)}
        />
        <FilterChip
          label="All"
          selected={showInactive}
          onPress={() => setShowInactive(true)}
        />
        <Text className="ml-auto text-xs text-gray-500">{total} total</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2e7d4f" />
          <Text className="mt-3 text-sm text-gray-500">Loading your flock…</Text>
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <FlatList
          data={gamefowls}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item, index }) => (
            <EntranceView index={Math.min(index, 10)}>
              <GamefowlCard
                gamefowl={item}
                onPress={() =>
                  navigation.navigate("GamefowlDetails", { gamefowlId: item.id })
                }
              />
            </EntranceView>
          )}
          ListEmptyComponent={
            showInactive ? (
              <EmptyState
                icon="archive-outline"
                title="No birds here yet"
                message="Retired (inactive) birds will appear in this view."
              />
            ) : (
              <EmptyState
                icon="paw-outline"
                title="No gamefowl yet"
                message="Add your first bird to start tracking its health."
                actionLabel="+ Add Gamefowl"
                onAction={() => navigation.navigate("AddGamefowl")}
              />
            )
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

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`mr-2 rounded-full border px-4 py-1.5 ${
        selected ? "border-brand-600 bg-brand-600" : "border-gray-300 bg-white"
      }`}
    >
      <Text className={`text-sm font-medium ${selected ? "text-white" : "text-gray-700"}`}>
        {label}
      </Text>
    </Pressable>
  );
}
