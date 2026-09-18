/**
 * File: components/ui/EmptyIllustration.tsx
 *
 * Purpose:
 *   One line-art system for every empty state, so "nothing here yet" looks
 *   deliberate and identical everywhere instead of varying between a stock
 *   icon on one screen and a PNG badge on another.
 *
 * The system: a soft tinted disc, one thin-stroke glyph on top, same stroke
 * weight and cap style across variants. Variants only change the glyph.
 */
import React from "react";
import { View } from "react-native";
import Svg, { Circle, Path, Line } from "react-native-svg";

import { brand, status } from "./palette";

export type EmptyIllustrationVariant =
  | "flock"
  | "history"
  | "search"
  | "archive";

const STROKE = brand[500];
const STROKE_WIDTH = 1.75;

function Glyph({ variant }: { variant: EmptyIllustrationVariant }) {
  const common = {
    stroke: STROKE,
    strokeWidth: STROKE_WIDTH,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none",
  };

  switch (variant) {
    case "history":
      return (
        <>
          <Circle cx={24} cy={24} r={13} {...common} />
          <Path d="M24 16.5V24l5 3" {...common} />
        </>
      );
    case "search":
      return (
        <>
          <Circle cx={21} cy={21} r={10} {...common} />
          <Line x1={28.5} y1={28.5} x2={35} y2={35} {...common} />
        </>
      );
    case "archive":
      return (
        <>
          <Path d="M12 18h24v16a2 2 0 0 1-2 2H14a2 2 0 0 1-2-2V18Z" {...common} />
          <Path d="M10 13h28v5H10z" {...common} />
          <Line x1={20} y1={25} x2={28} y2={25} {...common} />
        </>
      );
    case "flock":
    default:
      // A perched bird, reduced to the fewest strokes that still read.
      return (
        <>
          <Path
            d="M17 30c-3.5 0-6-2.8-6-6.2 0-3.6 2.9-6.3 6.6-6.3 1.3 0 2.5.4 3.5 1l4.6-3.2v4.1l4.8 2.6c1.6.9 2.5 2.4 2.5 4.1 0 2.2-1.8 3.9-4.1 3.9H17Z"
            {...common}
          />
          <Line x1={20} y1={30} x2={20} y2={35} {...common} />
          <Line x1={26} y1={30} x2={26} y2={35} {...common} />
          <Circle cx={27.5} cy={19.5} r={0.9} fill={STROKE} stroke="none" />
        </>
      );
  }
}

export function EmptyIllustration({
  variant = "flock",
  size = 96,
}: {
  variant?: EmptyIllustrationVariant;
  size?: number;
}) {
  return (
    <View
      style={{ width: size, height: size }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={size} height={size} viewBox="0 0 48 48">
        {/* Tinted disc + a lighter ring: depth without another box. */}
        <Circle cx={24} cy={24} r={23} fill={brand[50]} />
        <Circle
          cx={24}
          cy={24}
          r={23}
          stroke={status.healthy.border}
          strokeWidth={1}
          fill="none"
        />
        <Glyph variant={variant} />
      </Svg>
    </View>
  );
}
