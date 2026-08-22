/**
 * File: screens/DashboardScreen.tsx
 *
 * Purpose:
 *   The authenticated landing screen. Greets the owner by name, shows a
 *   summary of their flock (active-bird count), and lists their birds via
 *   the shared GamefowlCard — replacing the Milestone 9 placeholder.
 *
 *   - Tap a bird  -> Gamefowl Details
 *   - "See all"   -> My Gamefowl list
 *   - Empty state -> clear call-to-action to add the first bird
 *
 *   Re-focus revalidation: when returning from Add/Edit/Details this screen
 *   silently refreshes so counts and rows are never stale.
 */
import React, { useCallback, useRef } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { Screen } from "../components/ui/Screen";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { GamefowlCard } from "../components/gamefowl/GamefowlCard";
import { useAuth } from "../contexts/AuthContext";
import { useGamefowls } from "../hooks/useGamefowls";
import type { DashboardStackScreenProps } from "../navigation/types";

type Props = DashboardStackScreenProps<"Dashboard">;

export function DashboardScreen({ navigation }: Props) {
  const { user } = useAuth();
  const { gamefowls, pagination, loading, refreshing, error, reload, refresh } =
    useGamefowls();

  // Skip the very first focus — the hook already fetches on mount; every
  // LATER focus (back from Details/Add/Edit) triggers a silent revalidate.
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

  const activeTotal = pagination?.total ?? gamefowls.length;

  return (
    <Screen>
      {/* Greeting */}
      <View className="mt-2">
        <Text className="text-xs font-semibold uppercase tracking-widest text-brand-500">
          Welcome back
        </Text>
        <Text className="mt-1 text-2xl font-bold text-gray-900" numberOfLines={1}>
          {user?.name}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2e7d4f" />
          <Text className="mt-3 text-sm text-gray-500">Loading your flock…</Text>
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <>
          {/* Summary card */}
          <View className="mt-4 rounded-2xl bg-brand-600 px-5 py-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm text-brand-100">Your flock</Text>
                <Text className="text-3xl font-bold text-white">
                  {activeTotal} {activeTotal === 1 ? "bird" : "birds"}
                </Text>
              </View>
              <Ionicons name="paw" size={40} color="#dcf0e3" />
            </View>
            <View className="mt-3 flex-row">
              <TouchableOpacity
                accessibilityRole="button"
                className="mr-2 flex-1 items-center rounded-xl bg-white/15 py-2"
                onPress={() => navigation.navigate("MyGamefowl")}
              >
                <Text className="text-sm font-semibold text-white">See all</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                className="ml-2 flex-1 items-center rounded-xl bg-white py-2"
                onPress={() => navigation.navigate("AddGamefowl")}
              >
                <Text className="text-sm font-semibold text-brand-700">+ Add bird</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bird rows (first page; the full paginated list lives in My Gamefowl) */}
          <Text className="mb-1 mt-5 text-base font-semibold text-gray-900">
            Recent birds
          </Text>
          {gamefowls.length === 0 ? (
            <EmptyState
              icon="paw-outline"
              title="No gamefowl yet"
              message="Add your first bird to start tracking its health."
              actionLabel="+ Add Gamefowl"
              onAction={() => navigation.navigate("AddGamefowl")}
            />
          ) : (
            <FlatList
              data={gamefowls}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <GamefowlCard
                  gamefowl={item}
                  onPress={() =>
                    navigation.navigate("GamefowlDetails", { gamefowlId: item.id })
                  }
                />
              )}
              refreshing={refreshing}
              onRefresh={refresh}
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}
    </Screen>
  );
}
