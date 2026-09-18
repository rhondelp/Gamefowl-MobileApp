/**
 * File: components/assessment/RadialScore.tsx
 *
 * Purpose:
 *   The match score for one ranked condition, drawn as a ring instead of a
 *   bar. The ring is colored by the condition's SEVERITY, not by how strong
 *   the match is — an 80% match to something mild should not read as alarming
 *   just because the arc is long, and a 45% match to something critical
 *   should not read as safe.
 *
 * Motion:
 *   The arc sweeps to its value over 700ms, staggered per rank so results
 *   cascade. Skipped entirely under reduced motion, where the ring simply
 *   renders at its final value.
 */
import React, { useEffect } from "react";
import { Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { severityTone, tone } from "../ui/status";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RadialScoreProps {
  /** 0-100, as scored by the backend. */
  score: number;
  /** Drives the ring color via the shared status palette. */
  severity: string | null | undefined;
  size?: number;
  /** Stagger (ms) so a list of results fills in sequence. */
  delayMs?: number;
}

export function RadialScore({
  score,
  severity,
  size = 72,
  delayMs = 0,
}: RadialScoreProps) {
  const strokeWidth = size < 60 ? 5 : 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const toneStyle = tone(severityTone(severity));
  const reduceMotion = useReducedMotion();

  const progress = useSharedValue(reduceMotion ? score : 0);

  useEffect(() => {
    if (reduceMotion) {
      progress.value = score;
      return;
    }
    progress.value = withDelay(delayMs, withTiming(score, { duration: 700 }));
  }, [score, delayMs, progress, reduceMotion]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value / 100),
  }));

  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${score} percent match`}
      accessibilityValue={{ min: 0, max: 100, now: score }}
    >
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={toneStyle.soft}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Value — rotated so the arc starts at 12 o'clock. */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={toneStyle.solid}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      {/* Numerals sit heavier than the surrounding label text. */}
      <View className="absolute inset-0 items-center justify-center">
        <Text
          className="font-bold text-ink-primary"
          style={{ fontSize: size < 60 ? 14 : 18 }}
        >
          {score}
          <Text
            className="font-semibold text-ink-tertiary"
            style={{ fontSize: size < 60 ? 9 : 11 }}
          >
            %
          </Text>
        </Text>
      </View>
    </View>
  );
}
