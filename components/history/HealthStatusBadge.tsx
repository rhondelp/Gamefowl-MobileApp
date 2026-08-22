/**
 * File: components/history/HealthStatusBadge.tsx
 *
 * Purpose:
 *   Renders the backend's derived status label as a colored badge. The app
 *   NEVER recomputes or second-guesses the status — it displays exactly
 *   what GET /gamefowls/{id}/health-status returned (project rule).
 */
import React from "react";
import { Text, View } from "react-native";

import type { HealthStatusLabel } from "../../types/api";

const STATUS_STYLE: Record<HealthStatusLabel, { chip: string; text: string; label: string }> = {
  healthy: {
    chip: "bg-brand-100",
    text: "text-brand-700",
    label: "Healthy",
  },
  needs_attention: {
    chip: "bg-red-100",
    text: "text-alert",
    label: "Needs attention",
  },
  stale: {
    chip: "bg-amber-100",
    text: "text-amber-700",
    label: "Stale data",
  },
  no_data: {
    chip: "bg-gray-100",
    text: "text-gray-600",
    label: "No data yet",
  },
};

export function HealthStatusBadge({ status }: { status: HealthStatusLabel }) {
  const style = STATUS_STYLE[status];
  return (
    <View className={`self-start rounded-full px-3 py-1 ${style.chip}`}>
      <Text className={`text-xs font-bold ${style.text}`}>{style.label}</Text>
    </View>
  );
}
