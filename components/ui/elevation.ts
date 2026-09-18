/**
 * File: components/ui/elevation.ts
 *
 * Purpose:
 *   Shared depth tokens. NativeWind's `shadow-*` utilities don't emit an
 *   Android `elevation`, so a card styled only with classes looks raised on
 *   iOS and flat on Android. These plain style objects keep the two in step.
 *
 * Scale (use the smallest that reads):
 *   card    - resting surfaces in a list
 *   raised  - the one primary surface on a screen (summary/hero card)
 *   overlay - floats above content (toast, FAB)
 */
import { Platform, ViewStyle } from "react-native";

function shadow(
  opacity: number,
  radius: number,
  offsetY: number,
  elevation: number
): ViewStyle {
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: "#123122",
      shadowOpacity: opacity,
      shadowRadius: radius,
      shadowOffset: { width: 0, height: offsetY },
    },
    android: { elevation },
    default: {
      // react-native-web understands boxShadow, not the iOS shadow* props.
      boxShadow: `0 ${offsetY}px ${radius}px rgba(18, 49, 34, ${opacity})`,
    } as ViewStyle,
  }) as ViewStyle;
}

/**
 * Wide and faint, not tight and dark: a large radius at low opacity is what
 * separates a card from the canvas without drawing a visible edge. These
 * replaced the hairline borders cards used to carry.
 */
export const elevation = {
  card: shadow(0.05, 16, 4, 2),
  raised: shadow(0.08, 28, 10, 6),
  overlay: shadow(0.14, 40, 16, 12),
};
