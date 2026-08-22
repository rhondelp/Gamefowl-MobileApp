/**
 * File: screens/admin/AdminUserDetailScreen.tsx
 *
 * Purpose:
 *   One account's admin detail: role, active status, and aggregate counts,
 *   plus the two significant actions — role change (owner<->admin) and
 *   deactivate/restore. Both sit behind confirmation dialogs, and BOTH ARE
 *   REMOVED ENTIRELY when viewing your own account — mirroring the
 *   backend's self-lockout guard (409) in the UI: impossible, not merely
 *   rejected after the fact.
 */
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { ErrorState } from "../../components/ui/ErrorState";
import { showToast } from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";
import * as adminApi from "../../services/api/admin";
import { ApiError } from "../../services/api/client";
import { formatDate } from "../../utils/format";
import type {
  AdminUserDetail as AdminUserDetailData,
} from "../../types/admin";
import type { AdminStackScreenProps } from "../../navigation/types";

type Props = AdminStackScreenProps<"AdminUserDetail">;

export function AdminUserDetailScreen({ route }: Props) {
  const { userId } = route.params;
  const { token, user: currentUser } = useAuth();
  const isSelf = currentUser?.id === userId;

  const [user, setUser] = useState<AdminUserDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  /** Reload after any action so badges/counts stay truthful. */
  const load = useCallback(
    async (silent = false) => {
      if (!token) return;
      try {
        if (!silent || !user) setLoading(true);
        const data = await adminApi.showUser(token, userId);
        setUser(data.user);
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
    [token, userId, user]
  );

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  /** Shared runner for the three mutations: confirm -> apply -> toast. */
  const runAction = useCallback(
    (
      confirmTitle: string,
      confirmMessage: string,
      successToast: string,
      apply: () => Promise<void>
    ) => {
      Alert.alert(confirmTitle, confirmMessage, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                setBusy(true);
                await apply();
                showToast(successToast);
                await load(true);
              } catch (err) {
                showToast(
                  err instanceof ApiError
                    ? err.message
                    : "Something went wrong. Please try again.",
                  "error"
                );
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      ]);
    },
    [load]
  );

  if (loading && !user) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2e7d4f" />
          <Text className="mt-3 text-sm text-gray-500">Loading user…</Text>
        </View>
      </Screen>
    );
  }

  if (error && !user) {
    return (
      <Screen>
        <View className="flex-1 justify-center">
          <ErrorState message={error} onRetry={() => void load()} />
        </View>
      </Screen>
    );
  }

  if (!user) return null;

  return (
    <Screen>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Identity header */}
        <View className="mt-2 flex-row items-center">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-brand-100">
            <Text className="text-xl font-bold text-brand-700">
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-lg font-bold text-gray-900">{user.name}</Text>
            <Text className="text-sm text-gray-500">{user.email}</Text>
          </View>
          {/* Status chip */}
          <View
            className={`rounded-full px-3 py-1 ${
              user.is_active ? "bg-brand-100" : "bg-red-100"
            }`}
          >
            <Text
              className={`text-xs font-semibold ${
                user.is_active ? "text-brand-700" : "text-alert"
              }`}
            >
              {user.is_active ? "Active" : "Deactivated"}
            </Text>
          </View>
        </View>

        {/* Detail card */}
        <View className="mt-5 rounded-2xl border border-gray-200 bg-white px-4 py-1">
          <InfoRow label="Role" value={user.role} />
          <InfoRow label="Birds owned" value={String(user.gamefowl_count ?? 0)} />
          <InfoRow label="Assessments" value={String(user.health_assessment_count ?? 0)} />
          <InfoRow label="Joined" value={formatDate(user.created_at?.slice(0, 10) ?? null)} last />
        </View>

        {/* Self-lockout: actions don't exist for your own account. */}
        {isSelf ? (
          <View className="mt-5 flex-row items-start rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3">
            <Ionicons name="lock-closed" size={16} color="#b45309" style={{ marginTop: 2 }} />
            <Text className="ml-2 flex-1 text-xs leading-4 text-amber-800">
              This is your own account. Role and status actions are disabled to
              prevent locking yourself out of the admin panel.
            </Text>
          </View>
        ) : (
          <>
            {/* Role change */}
            <Text className="mb-2 mt-6 text-xs font-semibold uppercase tracking-widest text-brand-600">
              Account management
            </Text>
            <Button
              label={user.role === "owner" ? "Promote to Admin" : "Demote to Owner"}
              variant="outline"
              loading={busy}
              onPress={() =>
                runAction(
                  user.role === "owner" ? "Promote to admin?" : "Demote to owner?",
                  user.role === "owner"
                    ? `${user.name} will gain full admin access to the knowledge base and all users.`
                    : `${user.name} will lose admin access and become a regular owner.`,
                  user.role === "owner"
                    ? `${user.name} promoted to admin.`
                    : `${user.name} demoted to owner.`,
                  () =>
                    adminApi
                      .updateUser(token!, user.id, {
                        role: user.role === "owner" ? "admin" : "owner",
                      })
                      .then(() => undefined)
                )
              }
            />

            {/* Deactivate / restore */}
            <View className="mt-3">
              {user.is_active ? (
                <Button
                  label="Deactivate Account"
                  variant="danger"
                  loading={busy}
                  onPress={() =>
                    runAction(
                      "Deactivate account?",
                      `${user.name} will be signed out and their account hidden. Their birds and assessment history are kept, and the account can be restored later.`,
                      `${user.name} deactivated.`,
                      () => adminApi.deactivateUser(token!, user.id)
                    )
                  }
                />
              ) : (
                <Button
                  label="Restore Account"
                  loading={busy}
                  onPress={() =>
                    runAction(
                      "Restore account?",
                      `${user.name} will regain access with their previous data intact.`,
                      `${user.name} restored.`,
                      async () => {
                        await adminApi.updateUser(token!, user.id, {
                          status: "active",
                        });
                      }
                    )
                  }
                />
              )}
            </View>
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function InfoRow({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      className={`flex-row items-center py-3 ${last ? "" : "border-b border-gray-100"}`}
    >
      <Text className="w-32 text-sm text-gray-500">{label}</Text>
      <Text className="flex-1 text-sm font-medium capitalize text-gray-900">{value}</Text>
    </View>
  );
}
