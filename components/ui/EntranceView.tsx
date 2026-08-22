/**
 * File: components/ui/EntranceView.tsx
 *
 * Purpose:
 *   Subtle list-item entrance used across gamefowl lists, the symptom
 *   checklist, and the health timeline: fade-in with a tiny upward drift.
 *
 *   Motion budget (Milestone 15 rule): 250ms, staggered by at most 240ms —
 *   noticeable polish, never a bouncy gimmick, never blocking interaction
 *   (Reanimated entering animations don't gate touches).
 */
import React from "react";
import Animated, { FadeInDown } from "react-native-reanimated";

interface EntranceViewProps {
  /** Row position — drives the stagger delay (capped). */
  index?: number;
  children: React.ReactNode;
}

export function EntranceView({ index = 0, children }: EntranceViewProps) {
  return (
    <Animated.View entering={FadeInDown.duration(250).delay(Math.min(index * 40, 240))}>
      {children}
    </Animated.View>
  );
}
