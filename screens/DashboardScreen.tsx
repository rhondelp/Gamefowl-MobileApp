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
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { Screen } from "../components/ui/Screen";
import { brandRefreshColors } from "../components/ui/BrandRefreshControl";
import { elevation } from "../components/ui/elevation";
import { tapMedium } from "../components/ui/haptics";
import { palette } from "../components/ui/status";
import { Skeleton, SkeletonList } from "../components/ui/Skeleton";
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
        <Text className="mt-1 text-2xl font-bold text-ink-primary" numberOfLines={1}>
          {user?.name}
        </Text>
      </View>

      {loading ? (
        // Mirrors the loaded layout (summary card, section heading, rows) so
        // nothing shifts when the data arrives.
        <View accessibilityLabel="Loading your flock" accessibilityState={{ busy: true }}>
          <View className="mt-4 rounded-card bg-brand-600 px-5 py-4" style={elevation.raised}>
            <Skeleton width="35%" height={10} onBrand />
            <Skeleton width="55%" height={26} onBrand style={{ marginTop: 10 }} />
            <View className="mt-4 flex-row">
              <Skeleton height={44} radius={12} onBrand style={{ flex: 1, marginRight: 8 }} />
              <Skeleton height={44} radius={12} onBrand style={{ flex: 1, marginLeft: 8 }} />
            </View>
          </View>
          <View className="mb-2 mt-6">
            <Skeleton width="40%" height={14} />
          </View>
          <SkeletonList count={3} label="Loading your birds" />
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <>
          {/* Summary card — the one raised surface on this screen. */}
          <View className="mt-4 rounded-card bg-brand-600 px-5 py-4" style={elevation.raised}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-xs font-semibold uppercase tracking-wider text-brand-100">
                  Your flock
                </Text>
                <Text className="mt-0.5 text-2xl font-bold text-white">
                  {activeTotal} {activeTotal === 1 ? "bird" : "birds"}
                </Text>
              </View>
              {/* Decorative — the count beside it already conveys this. */}
              <View
                className="h-14 w-14 items-center justify-center rounded-full bg-white/15"
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
              >
                <MaterialCommunityIcons name="bird" size={30} color="#dcf0e3" />
              </View>
            </View>
            <View className="mt-4 flex-row">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="See all birds"
                className="mr-2 h-11 flex-1 items-center justify-center rounded-control bg-white/15 active:bg-white/25"
                style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}
                onPress={() => navigation.navigate("MyGamefowl")}
              >
                <Text className="text-sm font-semibold text-white">See all</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add bird"
                className="ml-2 h-11 flex-1 flex-row items-center justify-center rounded-control bg-surface-card active:bg-brand-50"
                style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}
                onPress={() => navigation.navigate("AddGamefowl")}
              >
                <Ionicons name="add" size={16} color="#215838" />
                <Text className="ml-0.5 text-sm font-semibold text-brand-700">Add bird</Text>
              </Pressable>
            </View>
          </View>

          {/* Primary action, placed in the flow right under the flock summary
              instead of a floating button: it never covers list rows, needs
              no safe-area math above the tab bar, and leaves no dead gap
              between a short list and a bottom-anchored button. The flock
              list is the bird picker the assessment flow needs, so it routes
              there. Hidden while empty — the empty state carries "add one". */}
          {gamefowls.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start assessment"
              accessibilityHint="Choose a bird to check its symptoms"
              onPress={() => {
                void tapMedium();
                navigation.navigate("MyGamefowl");
              }}
              className="mt-3 flex-row items-center rounded-card bg-surface-card px-4 py-3.5 active:bg-brand-50"
              style={({ pressed }) => [
                elevation.card,
                pressed ? { transform: [{ scale: 0.99 }] } : null,
              ]}
            >
              <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-50">
                <Ionicons name="pulse" size={22} color={palette.brand[500]} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-base font-semibold text-ink-primary">
                  Start Assessment
                </Text>
                <Text className="text-xs text-ink-tertiary">
                  Check a bird's symptoms in a minute
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
            </Pressable>
          ) : null}

          {/* Bird rows (first page; the full paginated list lives in My Gamefowl) */}
          <Text className="mb-2 mt-6 text-base font-semibold text-ink-primary">
            Recent birds
          </Text>
          {gamefowls.length === 0 ? (
            <EmptyState
              variant="flock"
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
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={refresh}
                  {...brandRefreshColors}
                />
              }
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ paddingBottom: 16 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </>
      )}
    </Screen>
  );
}
