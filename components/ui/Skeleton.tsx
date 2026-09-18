/**
 * File: components/ui/Skeleton.tsx
 *
 * Purpose:
 *   Content-shaped loading placeholders. A skeleton that mirrors the real
 *   row's dimensions means the screen doesn't jump when data lands, and it
 *   tells the owner WHAT is coming — a bare spinner doesn't.
 *
 * Motion:
 *   A slow shimmer (~1200ms) that interpolates the fill, not the 250ms
 *   entrance used elsewhere — a loop needs to read as ambient rather than as
 *   an arriving element. It is dropped entirely under reduced motion.
 *
 * Accessibility:
 *   Each group reports itself as one busy element with a label, so a screen
 *   reader announces "Loading birds" instead of reading a dozen blank boxes.
 */
import React from "react";
import { View, type ViewStyle } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { surface } from "./palette";
import { elevation } from "./elevation";

const skeletonBase = surface.muted;
const skeletonHighlight = "#e3e8e3";

/**
 * One shimmering block. Width may be a number or a "60%" string.
 *
 * `onBrand` switches to translucent white for skeletons sitting on a filled
 * brand surface — the default grey would disappear against it.
 */
export function Skeleton({
  width = "100%",
  height = 12,
  radius = 6,
  onBrand = false,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  onBrand?: boolean;
  style?: ViewStyle;
}) {
  const reduceMotion = useReducedMotion();
  const shimmer = useSharedValue(0);

  const [base, highlight] = onBrand
    ? ["#ffffff33", "#ffffff66"]
    : [skeletonBase, skeletonHighlight];

  React.useEffect(() => {
    if (reduceMotion) return;
    shimmer.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
  }, [shimmer, reduceMotion]);

  // A travelling highlight reads as "loading" more clearly than a pulse, and
  // interpolating the fill (not the opacity) keeps it from ghosting the card
  // behind it. This sets backgroundColor, so it is applied AFTER `style` —
  // callers tint via `onBrand` rather than by passing backgroundColor.
  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(shimmer.value, [0, 1], [base, highlight]),
  }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: base },
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
    <View
      className="mb-3 flex-row items-center rounded-card bg-surface-card px-4 py-4"
      style={elevation.card}
    >
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
      className="rounded-card bg-surface-card px-4 py-4"
      style={elevation.card}
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
