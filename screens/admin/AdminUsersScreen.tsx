/**
 * File: screens/admin/AdminUsersScreen.tsx
 *
 * Purpose:
 *   Admin user management list: paginated accounts with role and status
 *   filter chips. Backend notes reflected here:
 *     - ?role=owner|admin filters by role; no param = all roles.
 *     - ?status=inactive is the ONLY status value the backend supports —
 *       "Active" chip = default listing, "Deactivated" chip = ?status=inactive.
 *   Tap any account -> AdminUserDetail for role/status actions.
 */
import React, { useCallback, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { Screen } from "../../components/ui/Screen";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { useAdminUsers, type AdminUserFilters } from "../../hooks/useAdminUsers";
import type { AdminUser } from "../../types/admin";
import type { AdminStackScreenProps } from "../../navigation/types";

type Props = AdminStackScreenProps<"AdminUsers">;

type RoleChip = "all" | "owner" | "admin";

export function AdminUsersScreen({ navigation }: Props) {
  // undefined role/status map directly onto backend query params.
  const [roleFilter, setRoleFilter] = useState<RoleChip>("all");
  const [showInactive, setShowInactive] = useState(false);

  const filters: AdminUserFilters = {
    ...(roleFilter !== "all" ? { role: roleFilter } : {}),
    ...(showInactive ? { status: "inactive" as const } : {}),
  };

  const {
    users,
    total,
    loading,
    refreshing,
    loadingMore,
    error,
    reload,
    refresh,
    loadMore,
  } = useAdminUsers(filters);

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

  return (
    <Screen>
      {/* Filter chips */}
      <View className="mb-3">
        <View className="flex-row items-center">
          {(["all", "owner", "admin"] as const).map((value) => (
            <FilterChip
              key={value}
              label={value === "all" ? "All roles" : value}
              selected={roleFilter === value}
              onPress={() => setRoleFilter(value)}
            />
          ))}
        </View>
        <View className="mt-2 flex-row items-center">
          <FilterChip
            label="Active"
            selected={!showInactive}
            onPress={() => setShowInactive(false)}
          />
          <FilterChip
            label="Deactivated"
            selected={showInactive}
            onPress={() => setShowInactive(true)}
          />
          <Text className="ml-auto text-xs text-gray-500">{total} total</Text>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2e7d4f" />
          <Text className="mt-3 text-sm text-gray-500">Loading users…</Text>
        </View>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <UserRow
              user={item}
              onPress={() => navigation.navigate("AdminUserDetail", { userId: item.id })}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No users match"
              message="Try a different role or status filter."
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

function UserRow({ user, onPress }: { user: AdminUser; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${user.name}`}
      onPress={onPress}
      className="mb-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 active:bg-brand-50"
    >
      <View className="flex-row items-center">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-100">
          <Text className="text-sm font-bold text-brand-700">
            {user.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View className="ml-3 flex-1">
          <View className="flex-row items-center">
            <Text className="flex-shrink text-sm font-semibold text-gray-900" numberOfLines={1}>
              {user.name}
            </Text>
            {/* Role + status badges mirror what the admin can change. */}
            <View
              className={`ml-2 rounded-full px-2 py-0.5 ${
                user.role === "admin" ? "bg-brand-600" : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-[10px] font-semibold uppercase ${
                  user.role === "admin" ? "text-white" : "text-gray-500"
                }`}
              >
                {user.role}
              </Text>
            </View>
            {!user.is_active ? (
              <View className="ml-1.5 rounded-full bg-red-100 px-2 py-0.5">
                <Text className="text-[10px] font-semibold uppercase text-alert">
                  Deactivated
                </Text>
              </View>
            ) : null}
          </View>
          <Text className="mt-0.5 text-xs text-gray-500" numberOfLines={1}>
            {user.email}
          </Text>
        </View>
      </View>
    </Pressable>
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
      className={`mr-2 rounded-full border px-3.5 py-1.5 ${
        selected ? "border-brand-600 bg-brand-600" : "border-gray-300 bg-white"
      }`}
    >
      <Text className={`text-xs font-medium capitalize ${selected ? "text-white" : "text-gray-700"}`}>
        {label}
      </Text>
    </Pressable>
  );
}
