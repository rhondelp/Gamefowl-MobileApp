/**
 * File: components/assessment/MatchScoreBadge.tsx
 *
 * Purpose:
 *   Visual percentage badge for one ranked result. Color communicates match
 *   strength at a glance (tier logic lives in the pure scoreTiers module).
 */
import React from "react";
import { Text, View } from "react-native";

import { scoreTier } from "./scoreTiers";

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
