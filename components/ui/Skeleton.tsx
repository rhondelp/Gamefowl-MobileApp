/**
 * File: components/ui/Skeleton.tsx
 *
 * Purpose:
 *   Content-shaped loading placeholders. A skeleton that mirrors the real
 *   row's dimensions means the screen doesn't jump when data lands, and it
 *   tells the owner WHAT is coming — a bare spinner doesn't.
 *
 * Motion:
 *   A slow opacity pulse (~1000ms), not the 250ms entrance used elsewhere —
 *   a loop needs to read as ambient rather than as an arriving element. The
 *   loop is dropped entirely when the OS asks for reduced motion.
 *
 * Accessibility:
 *   Each group reports itself as one busy element with a label, so a screen
 *   reader announces "Loading birds" instead of reading a dozen blank boxes.
 */
import React from "react";
import { View, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

/** One pulsing block. Width may be a number or a "60%" string. */
export function Skeleton({
  width = "100%",
  height = 12,
  radius = 6,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(reduceMotion ? 0.6 : 0.45);

  React.useEffect(() => {
    if (reduceMotion) return;
    pulse.value = withRepeat(withTiming(0.9, { duration: 1000 }), -1, true);
  }, [pulse, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: "#d1d5db" },
        style,
        animatedStyle,
      ]}
    />
  );
}

/**
 * A card-shaped row: avatar disc + title line + subtitle line. Matches the
 * geometry of GamefowlCard / TimelineEntryCard / the admin list rows.
 */
export function SkeletonRow() {
  return (
    <View className="mb-3 flex-row items-center rounded-2xl border border-gray-100 bg-white px-4 py-4">
      <Skeleton width={48} height={48} radius={24} />
      <View className="ml-3 flex-1">
        <Skeleton width="55%" height={14} />
        <Skeleton width="80%" height={11} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

/** `count` card rows, announced to screen readers as a single busy region. */
export function SkeletonList({
  count = 4,
  label = "Loading",
}: {
  count?: number;
  label?: string;
}) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
    >
      {Array.from({ length: count }, (_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  );
}

/** Stacked text lines for detail screens (no avatar). */
export function SkeletonLines({
  lines = 3,
  label = "Loading",
}: {
  lines?: number;
  label?: string;
}) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityState={{ busy: true }}
      className="rounded-2xl border border-gray-100 bg-white px-4 py-4"
    >
      {Array.from({ length: lines }, (_, i) => (
        <View key={i} className="flex-row items-center justify-between py-2.5">
          <Skeleton width="35%" height={11} />
          <Skeleton width="45%" height={11} />
        </View>
      ))}
    </View>
  );
}
