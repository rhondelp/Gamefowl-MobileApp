/**
 * File: components/ui/BrandRefreshControl.tsx
 *
 * Purpose:
 *   Brand-green pull-to-refresh instead of the OS default. iOS and Android
 *   take different props for this (`tintColor` vs `colors` +
 *   `progressBackgroundColor`), so both are set here once.
 *
 * Why this exports PROPS and not a component:
 *   ScrollView's `refreshControl` must be a real <RefreshControl> element.
 *   On Android, ScrollView calls cloneElement(refreshControl, {style},
 *   <NativeScrollView>…</NativeScrollView>) — it injects the entire scroll
 *   view as that element's CHILDREN. A custom wrapper component that renders
 *   its own <RefreshControl> silently drops those children, and the list
 *   disappears while headers and counts keep working.
 *
 * Usage — spread onto a genuine RefreshControl:
 *   refreshControl={
 *     <RefreshControl
 *       refreshing={refreshing}
 *       onRefresh={refresh}
 *       {...brandRefreshColors}
 *     />
 *   }
 */
import { palette } from "./status";

export const brandRefreshColors = {
  /** iOS spinner. */
  tintColor: palette.brand[500],
  /** Android spinner (accepts several, cycles through them). */
  colors: [palette.brand[500]] as string[],
  progressBackgroundColor: palette.surface.card,
};
