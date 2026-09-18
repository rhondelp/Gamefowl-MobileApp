/**
 * File: components/history/TimelineEntryCard.tsx
 *
 * Purpose:
 *   ONE card component for BOTH merged-timeline entry types, visually
 *   distinct at a glance (icon + accent color + type label, per UX spec —
 *   not just text):
 *     - assessment entries: brand-green pulse icon, top possible disease +
 *       match score badge; tap opens the full historical results screen.
 *     - health_record entries: amber document-style icon varying by record
 *       type (vet visit / weight check / vaccination / note); tap opens the
 *       full record detail.
 *   Dates use each type's own precision (timestamp vs plain date).
 */
import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { HealthHistoryEntry, HealthRecordType } from "../../types/api";
import { formatDateTime, formatDate, formatWeight } from "../../utils/format";
import { scoreTier } from "../assessment/scoreTiers";
import { elevation } from "../ui/elevation";
import { tone } from "../ui/status";

/** Icon + label per manual record type (all standard Ionicons glyphs). */
const RECORD_TYPE_META: Record<
  HealthRecordType,
  { icon: keyof typeof Ionicons.glyphMap; label: string }
> = {
  vet_visit: { icon: "medkit-outline", label: "Vet visit" },
  weight_check: { icon: "barbell-outline", label: "Weight check" },
  vaccination: { icon: "shield-checkmark-outline", label: "Vaccination" },
  general_note: { icon: "document-text-outline", label: "Note" },
};

interface TimelineEntryCardProps {
  entry: HealthHistoryEntry;
  onPress?: () => void;
}

export function TimelineEntryCard({ entry, onPress }: TimelineEntryCardProps) {
  if (entry.type === "assessment") {
    const tier = entry.match_score === null ? null : scoreTier(entry.match_score);
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Assessment on ${formatDateTime(entry.occurred_at)}`}
        className="mb-3 rounded-card bg-surface-card px-4 py-3.5 active:bg-brand-50"
        onPress={onPress}
        style={({ pressed }) => [
          elevation.card,
          pressed ? { transform: [{ scale: 0.99 }] } : null,
        ]}
      >
        <View className="flex-row items-center">
          {/* Assessment accent: brand green. */}
          <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-100">
            <Ionicons name="pulse" size={20} color="#215838" />
          </View>
          <View className="ml-3 flex-1">
            <View className="flex-row items-center">
              <View className="rounded-full bg-brand-600 px-2 py-0.5">
                <Text className="text-[10px] font-semibold uppercase tracking-wide text-white">
                  Assessment
                </Text>
              </View>
              {entry.severity_at_assessment ? (
                <Text className="ml-2 text-[11px] font-normal capitalize text-ink-tertiary">
                  {entry.severity_at_assessment} severity
                </Text>
              ) : null}
            </View>
            <Text className="mt-1 text-sm font-semibold text-ink-primary" numberOfLines={1}>
              {entry.top_possible_disease
                ? `${entry.top_possible_disease.name} · ${entry.match_score}%`
                : "No strong match found"}
            </Text>
            <Text className="mt-0.5 text-xs text-ink-tertiary">
              {formatDateTime(entry.occurred_at)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
        </View>
      </Pressable>
    );
  }

  // Manual health record branch.
  const meta = RECORD_TYPE_META[entry.record_type] ?? RECORD_TYPE_META.general_note;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${meta.label}: ${entry.title}`}
      className="mb-3 rounded-card bg-surface-card px-4 py-3.5 active:bg-surface-muted"
      onPress={onPress}
      style={({ pressed }) => [
        elevation.card,
        pressed ? { transform: [{ scale: 0.99 }] } : null,
      ]}
    >
      <View className="flex-row items-center">
        {/* Record accent: slate, not amber — amber is reserved for the
            "needs attention" status tone and would read as urgency here. */}
        <View
          className="h-11 w-11 items-center justify-center rounded-full"
          style={{ backgroundColor: tone("neutral").soft }}
        >
          <Ionicons name={meta.icon} size={20} color={tone("neutral").text} />
        </View>
        <View className="ml-3 flex-1">
          <View className="flex-row items-center">
            <View
              className="rounded-full px-2 py-0.5"
              style={{ backgroundColor: tone("neutral").text }}
            >
              <Text className="text-[10px] font-semibold uppercase tracking-wide text-white">
                {meta.label}
              </Text>
            </View>
            {entry.weight !== null ? (
              <Text className="ml-2 text-[11px] font-medium text-ink-tertiary">
                {formatWeight(entry.weight)}
              </Text>
            ) : null}
          </View>
          <Text className="mt-1 text-sm font-semibold text-ink-primary" numberOfLines={1}>
            {entry.title}
          </Text>
          {/* Records carry their event date only (possibly backdated). */}
          <Text className="mt-0.5 text-xs text-ink-tertiary">{formatDate(entry.occurred_at)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
      </View>
    </Pressable>
  );
}
