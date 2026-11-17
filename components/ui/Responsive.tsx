/**
 * File: components/ui/Responsive.tsx
 *
 * Purpose:
 *   Layout primitives for large screens, all driven by hooks/useResponsive:
 *
 *   columnStyle()     Centered, max-width column style (for Screen and the
 *                     few raw ScrollViews).
 *   ContentContainer  The same as a View, for content inside a screen.
 *   gridListProps()   numColumns + column gap for a FlatList grid.
 *   GridCell          Equal-width cell for one FlatList grid item.
 *   ResponsiveGrid    Equal-width wrapping grid for non-virtualized items.
 *
 * Phones (compact): every helper is a no-op — no max-width, one column, and
 * GridCell renders its child directly — so the phone layout is unchanged.
 */
import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";

import {
  GRID_GAP,
  MAX_WIDTH,
  SCREEN_GUTTER,
  useResponsive,
  type ContentWidth,
} from "../../hooks/useResponsive";

/**
 * Centered column capped at the given content width. `gutters` adds the
 * screen's own horizontal padding to the cap when the styled view carries
 * that padding itself.
 */
export function columnStyle(
  isTablet: boolean,
  width: ContentWidth | "modal",
  gutters = false
): ViewStyle | undefined {
  if (!isTablet) return undefined;
  return {
    width: "100%",
    maxWidth: MAX_WIDTH[width] + (gutters ? SCREEN_GUTTER * 2 : 0),
    alignSelf: "center",
  };
}

export function ContentContainer({
  width = "content",
  style,
  className,
  children,
}: {
  width?: ContentWidth | "modal";
  style?: StyleProp<ViewStyle>;
  className?: string;
  children: React.ReactNode;
}) {
  const { isTablet } = useResponsive();
  return (
    <View className={className} style={[columnStyle(isTablet, width), style]}>
      {children}
    </View>
  );
}

/**
 * Props for a FlatList grid. Pair with `key={gridKey(columns)}`: FlatList
 * can't change numColumns in place, so rotation/unfold remounts it cleanly.
 */
export function gridListProps(columns: number) {
  return {
    numColumns: columns,
    // RN rejects columnWrapperStyle on single-column lists.
    columnWrapperStyle:
      columns > 1 ? ({ marginHorizontal: -GRID_GAP / 2 } as ViewStyle) : undefined,
  };
}

export const gridKey = (columns: number) => `grid-${columns}`;

/** Equal width even in a short last row (flex:1 would stretch it). */
function cellStyle(columns: number): ViewStyle {
  return { width: `${100 / columns}%`, paddingHorizontal: GRID_GAP / 2 };
}

export function GridCell({ columns, children }: { columns: number; children: React.ReactNode }) {
  if (columns <= 1) return <>{children}</>;
  return <View style={cellStyle(columns)}>{children}</View>;
}

/**
 * Wrapping grid for plain (non-FlatList) children, e.g. the symptom
 * checklist inside a ScrollView. Between 2 and 3 columns the items stay
 * mounted; crossing to/from one column remounts them, which is harmless for
 * callers that keep their state (e.g. selection) in the parent.
 */
export function ResponsiveGrid({
  columns,
  children,
}: {
  columns: number;
  children: React.ReactNode;
}) {
  if (columns <= 1) return <>{children}</>;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -GRID_GAP / 2 }}>
      {React.Children.map(children, (child) => (
        <View style={cellStyle(columns)}>{child}</View>
      ))}
    </View>
  );
}

/**
 * A screen-level action button (e.g. "+ Add Disease"): full width on
 * phones, a normal-sized left-aligned button on tablets instead of a bar
 * stretched across the whole list.
 */
export function InlineAction({ children }: { children: React.ReactNode }) {
  const { isTablet } = useResponsive();
  if (!isTablet) return <>{children}</>;
  return <View style={{ alignSelf: "flex-start", minWidth: 280 }}>{children}</View>;
}
