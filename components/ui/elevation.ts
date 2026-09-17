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

export const elevation = {
  card: shadow(0.06, 8, 2, 2),
  raised: shadow(0.12, 16, 6, 6),
  overlay: shadow(0.18, 24, 10, 12),
};
