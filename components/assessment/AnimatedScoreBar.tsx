/**
 * File: components/assessment/AnimatedScoreBar.tsx
 *
 * Purpose:
 *   The match-score bar from the Diagnostic Results screen, animated to its
 *   value instead of snapping in — the app's centerpiece moment (Milestone
 *   15 motion spec).
 *
 *   Implementation: Reanimated shared value eased 0 -> score over 300ms
 *   (the project's motion budget), staggered per rank so results cascade.
 */
import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";

import { type ScoreTier, tierBarColor } from "./scoreTiers";

interface AnimatedScoreBarProps {
  score: number;
  tier: ScoreTier;
  /** Stagger per rank (ms) so multiple results fill in sequence. */
  delayMs?: number;
}

export function AnimatedScoreBar({ score, tier, delayMs = 0 }: AnimatedScoreBarProps) {
  const progress = useSharedValue(0);
  // Computed on the JS thread: Reanimated worklets cannot reliably capture
  // cross-module function references (they arrive as namespace objects on
  // the UI thread), but primitive strings are copied safely.
  const color = tierBarColor(tier);

  useEffect(() => {
    progress.value = withDelay(delayMs, withTiming(score, { duration: 300 }));
  }, [score, delayMs, progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
    backgroundColor: color,
  }));

  return (
    <View className="h-2 flex-row overflow-hidden rounded-full bg-gray-200">
      <Animated.View style={barStyle} className="h-full rounded-full" />
    </View>
  );
}
