/**
 * File: components/assessment/MatchScoreBadge.tsx
 *
 * Purpose:
 *   Visual percentage badge for one ranked result. Color communicates match
 *   strength at a glance (per UX spec: score must be visual, not just a
 *   number):
 *     >= 70  strong signal  -> solid brand green
 *     40-69 moderate signal -> amber outline
 *     < 40  weak signal     -> neutral gray
 */
import React from "react";
import { Text, View } from "react-native";

export type ScoreTier = "strong" | "moderate" | "weak";

export function scoreTier(score: number): ScoreTier {
  if (score >= 70) return "strong";
  if (score >= 40) return "moderate";
  return "weak";
}

/** Bar color used by both this badge and DiseaseResultCard's progress bar. */
export function tierBarColor(tier: ScoreTier): string {
  if (tier === "strong") return "#276a43"; // brand-600
  if (tier === "moderate") return "#d97706"; // amber-600
  return "#9ca3af"; // gray-400
}

export function MatchScoreBadge({ score }: { score: number }) {
  const tier = scoreTier(score);
  const style =
    tier === "strong"
      ? "bg-brand-600"
      : tier === "moderate"
        ? "bg-amber-100 border border-amber-300"
        : "bg-gray-100 border border-gray-300";
  const textColor =
    tier === "strong" ? "text-white" : tier === "moderate" ? "text-amber-700" : "text-gray-600";

  return (
    <View className={`items-center justify-center rounded-full px-3 py-1.5 ${style}`}>
      <Text className={`text-sm font-bold ${textColor}`}>{score}%</Text>
    </View>
  );
}
