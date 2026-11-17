/**
 * File: hooks/useResponsive.ts
 *
 * Purpose:
 *   The one source of truth for large-screen layout (tablets, foldables,
 *   Chromebooks, split-screen). Built on useWindowDimensions() so it
 *   re-renders on rotation, fold/unfold and multi-window resizes — never
 *   read dimensions once at startup.
 *
 *   Breakpoints follow Android's window size classes, by WINDOW width:
 *     compact  < 600   phones (incl. any phone in split-screen)
 *     medium   600-839 small tablets, unfolded foldables, half-screen
 *     expanded >= 840  10"+ tablets, Chromebooks, tablets in landscape
 *
 *   Compact must render exactly the original phone layout, so every
 *   consumer treats `isTablet === false` as "change nothing".
 */
import { useWindowDimensions } from "react-native";

export type WindowSize = "compact" | "medium" | "expanded";

/** Content widths (excluding the 20dp screen gutters) on medium/expanded. */
export const MAX_WIDTH = {
  /** Login, register, profile and bird/admin forms. */
  form: 480,
  /** Modals, dialogs, toasts. */
  modal: 520,
  /** Details, results, settings. */
  content: 720,
  /** Lists and grids. */
  list: 1000,
} as const;

export type ContentWidth = "form" | "content" | "list";

/** Horizontal gutter every screen keeps between content and the edge. */
export const SCREEN_GUTTER = 20;

/** Gap between grid columns (matches the cards' 12dp row spacing). */
export const GRID_GAP = 12;

export interface Responsive {
  width: number;
  height: number;
  size: WindowSize;
  /** Window is at least 600dp wide. */
  isTablet: boolean;
  isLandscape: boolean;
  /** Suggested list/grid column count: 1 / 2 / 3. */
  columns: 1 | 2 | 3;
}

export function sizeForWidth(width: number): WindowSize {
  if (width >= 840) return "expanded";
  if (width >= 600) return "medium";
  return "compact";
}

export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();
  const size = sizeForWidth(width);
  return {
    width,
    height,
    size,
    isTablet: size !== "compact",
    isLandscape: width > height,
    columns: size === "expanded" ? 3 : size === "medium" ? 2 : 1,
  };
}
