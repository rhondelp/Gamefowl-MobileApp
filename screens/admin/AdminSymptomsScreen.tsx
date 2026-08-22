/**
 * File: screens/admin/AdminSymptomsScreen.tsx
 *
 * Purpose:
 *   Flat admin list of ALL symptoms (active + deactivated, flagged). Tap a
 *   symptom to edit it; "+ Add Symptom" creates new ones. Deactivation
 *   happens on the form screen (backend DELETE = is_active:false).
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
import type { AdminSymptom } from "../../types/admin";
import type { AdminStackScreenProps } from "../../navigation/types";

const SEVERITY_DOT: Record<string, string> = {
  mild: "#22c55e",
  moderate: "#d97706",
  severe: "#b3401f",
};

type Props = AdminStackScreenProps<"AdminSymptoms">;

export function AdminSymptomsScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [symptoms, setSymptoms] = useState<AdminSymptom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await adminApi.listSymptoms(token);
      setSymptoms(data.items);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong. Please try again."
      );
    }
  }, [token]);

  // Reload on every focus so edits made on the form screen appear instantly.
  useFocusEffect(
    useCallback(() => {
      void (async () => {
        setLoading(symptoms.length === 0);
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
          <Text className="mt-3 text-sm text-gray-500">Loading symptoms…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Button
        label="+ Add Symptom"
        onPress={() => navigation.navigate("AdminSymptomForm", {})}
      />

      {error ? (
        <View className="mt-4 flex-1 justify-center">
          <ErrorState message={error} onRetry={() => void load()} />
        </View>
      ) : (
        <FlatList
          data={symptoms}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={
            <View className="mt-3">
              <EmptyState
                icon="medkit-outline"
                title="No symptoms yet"
                message="Add the first sign owners can report in assessments."
              />
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                navigation.navigate("AdminSymptomForm", { symptomId: item.id })
              }
              className="mb-2.5 rounded-2xl border border-gray-200 bg-white px-4 py-3 active:bg-brand-50"
            >
              <View className="flex-row items-center">
                {/* Severity cue matches the owner-facing checklist dot. */}
                <View
                  className="mr-2 h-2 w-2 rounded-full"
                  style={{ backgroundColor: SEVERITY_DOT[item.severity] ?? "#9ca3af" }}
                />
                <Text className="flex-shrink text-sm font-semibold text-gray-900" numberOfLines={1}>
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
              <Text className="ml-4 mt-0.5 text-xs capitalize text-gray-500">
                {item.category} · {item.severity}
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
