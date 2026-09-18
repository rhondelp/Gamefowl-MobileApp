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
import { Ionicons } from "@expo/vector-icons";

import type { HealthStatusLabel } from "../../types/api";
import { healthStatusTone, tone } from "../ui/status";

/** Only the wording and the glyph live here — color comes from the tone. */
const STATUS_META: Record<
  HealthStatusLabel,
  { label: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  healthy: { label: "Healthy", icon: "checkmark-circle" },
  needs_attention: { label: "Needs attention", icon: "alert-circle" },
  stale: { label: "Stale data", icon: "time" },
  no_data: { label: "No data yet", icon: "ellipse-outline" },
};

export function HealthStatusBadge({ status }: { status: HealthStatusLabel }) {
  const meta = STATUS_META[status];
  const t = tone(healthStatusTone(status));

  return (
    <View
      className="flex-row items-center self-start rounded-full px-3 py-1.5"
      style={{ backgroundColor: t.soft }}
    >
      <Ionicons name={meta.icon} size={13} color={t.solid} />
      <Text className="ml-1.5 text-xs font-semibold" style={{ color: t.text }}>
        {meta.label}
      </Text>
    </View>
  );
}
