/**
 * File: screens/history/HealthRecordDetailScreen.tsx
 *
 * Purpose:
 *   Full detail of ONE manual health record (title, notes, weight, event
 *   date) reached by tapping a record in the timeline.
 *
 * Backend reality: records expose NO single-item GET route — only the
 * paginated bird-scoped index. This screen therefore pages the index
 * (100/page, so typical birds resolve on the first request) until it finds
 * the requested id. The summary fields from the timeline entry alone would
 * not include notes, which is exactly why this fetch exists.
 */
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { ErrorState } from "../../components/ui/ErrorState";
import { useAuth } from "../../contexts/AuthContext";
import * as healthHistoryApi from "../../services/api/healthHistory";
import { ApiError } from "../../services/api/client";
import { formatDate, formatDateTime, formatWeight } from "../../utils/format";
import type {
  HealthRecord,
  HealthRecordType,
} from "../../types/api";
import type { DashboardStackScreenProps } from "../../navigation/types";

type Props = DashboardStackScreenProps<"HealthRecordDetail">;

const RECORD_META: Record<
  HealthRecordType,
  { icon: keyof typeof Ionicons.glyphMap; label: string }
> = {
  vet_visit: { icon: "medkit", label: "Vet visit" },
  weight_check: { icon: "barbell", label: "Weight check" },
  vaccination: { icon: "shield-checkmark", label: "Vaccination" },
  general_note: { icon: "document-text", label: "General note" },
};

export function HealthRecordDetailScreen({ route, navigation }: Props) {
  const { gamefowlId, recordId } = route.params;
  const { token } = useAuth();

  const [record, setRecord] = useState<HealthRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Page the index (largest page size) until the record shows up. */
  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);

      const perPage = 100;
      for (let page = 1; ; page++) {
        const data = await healthHistoryApi.listRecords(
          token,
          gamefowlId,
          page,
          perPage
        );
        const found = data.items.find((item) => item.id === recordId);
        if (found) {
          setRecord(found);
          setError(null);
          return;
        }
        // Standard paginator WITH last_page — stop when exhausted.
        if (page >= data.pagination.last_page) {
          setError("This record could not be found.");
          return;
        }
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [token, gamefowlId, recordId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !record) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2e7d4f" />
          <Text className="mt-3 text-sm text-gray-500">Loading record…</Text>
        </View>
      </Screen>
    );
  }

  if (error && !record) {
    return (
      <Screen>
        <View className="flex-1 justify-center">
          <ErrorState message={error} onRetry={() => void load()} />
        </View>
      </Screen>
    );
  }

  if (!record) return null;

  const meta = RECORD_META[record.type] ?? RECORD_META.general_note;

  return (
    <Screen>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Identity header */}
        <View className="mt-2 flex-row items-center">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-amber-100">
            <Ionicons name={meta.icon} size={24} color="#b45309" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-lg font-bold text-gray-900">{record.title}</Text>
            <Text className="text-sm text-gray-500">
              {meta.label} · {formatDate(record.recorded_at)}
            </Text>
          </View>
        </View>

        {/* Detail card */}
        <View className="mt-5 rounded-2xl border border-gray-200 bg-white px-4 py-2">
          <View className="flex-row py-3 border-b border-gray-100">
            <Text className="w-32 text-sm text-gray-500">Event date</Text>
            <Text className="flex-1 text-sm font-medium text-gray-900">
              {formatDate(record.recorded_at)}
            </Text>
          </View>
          {record.weight !== null ? (
            <View className="flex-row py-3 border-b border-gray-100">
              <Text className="w-32 text-sm text-gray-500">Weight</Text>
              <Text className="flex-1 text-sm font-medium text-gray-900">
                {formatWeight(record.weight)}
              </Text>
            </View>
          ) : null}
          <View className="flex-row py-3">
            <Text className="w-32 text-sm text-gray-500">Notes</Text>
            <Text className="flex-1 text-sm font-medium leading-5 text-gray-900">
              {record.notes?.trim() || "—"}
            </Text>
          </View>
        </View>

        <Text className="mt-2 px-1 text-xs text-gray-400">
          Logged {formatDateTime(record.created_at)}. Manual entries can be
          backdated; the event date above is what appears in the timeline.
        </Text>

        <View className="mt-6">
          <Button label="Back to Timeline" variant="outline" onPress={() => navigation.goBack()} />
        </View>
      </ScrollView>
    </Screen>
  );
}
