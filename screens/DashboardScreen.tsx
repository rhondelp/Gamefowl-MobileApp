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
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { Screen } from "../components/ui/Screen";
import { elevation } from "../components/ui/elevation";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { EntranceView } from "../components/ui/EntranceView";
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
          <View
            className="h-16 w-16 items-center justify-center rounded-full bg-white"
            style={elevation.card}
          >
            <ActivityIndicator size="large" color="#2e7d4f" />
          </View>
          <Text className="mt-4 text-sm font-medium text-gray-500">
            Loading your flock…
          </Text>
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <>
          {/* Summary card — the one raised surface on this screen. */}
          <View className="mt-4 rounded-2xl bg-brand-600 px-5 py-4" style={elevation.raised}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-xs font-semibold uppercase tracking-wider text-brand-100">
                  Your flock
                </Text>
                <Text className="mt-0.5 text-3xl font-bold text-white">
                  {activeTotal} {activeTotal === 1 ? "bird" : "birds"}
                </Text>
              </View>
              {/* Decorative — the count beside it already conveys this. */}
              <View
                className="h-14 w-14 items-center justify-center rounded-full bg-white/15"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <Ionicons name="paw" size={30} color="#dcf0e3" />
              </View>
            </View>
            <View className="mt-4 flex-row">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="See all birds"
                className="mr-2 h-11 flex-1 items-center justify-center rounded-xl bg-white/15 active:bg-white/25"
                style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}
                onPress={() => navigation.navigate("MyGamefowl")}
              >
                <Text className="text-sm font-semibold text-white">See all</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add bird"
                className="ml-2 h-11 flex-1 flex-row items-center justify-center rounded-xl bg-white active:bg-brand-50"
                style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}
                onPress={() => navigation.navigate("AddGamefowl")}
              >
                <Ionicons name="add" size={16} color="#215838" />
                <Text className="ml-0.5 text-sm font-semibold text-brand-700">Add bird</Text>
              </Pressable>
            </View>
          </View>

          {/* Bird rows (first page; the full paginated list lives in My Gamefowl) */}
          <Text className="mb-2 mt-6 text-base font-semibold text-gray-900">
            Recent birds
          </Text>
          {gamefowls.length === 0 ? (
            <EmptyState
              image={require("../assets/images/badge_green.png")}
              title="No gamefowl yet"
              message="Add your first bird to start tracking its health."
              actionLabel="+ Add Gamefowl"
              onAction={() => navigation.navigate("AddGamefowl")}
            />
          ) : (
            <FlatList
              data={gamefowls}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item, index }) => (
                <EntranceView index={index}>
                  <GamefowlCard
                    gamefowl={item}
                    onPress={() =>
                      navigation.navigate("GamefowlDetails", { gamefowlId: item.id })
                    }
                  />
                </EntranceView>
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
