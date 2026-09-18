/**
 * File: components/ui/palette.js
 *
 * Purpose:
 *   The single source of truth for color, shared by BOTH tailwind.config.js
 *   (which requires this file to build utility classes) and TypeScript at
 *   runtime (which imports it for raw hex — SVG strokes, Ionicons `color`,
 *   RefreshControl tint, none of which accept a className).
 *
 *   Plain JS on purpose: tailwind.config.js is CommonJS and cannot import a
 *   .ts module without a build step, and duplicating hex in two places is
 *   how palettes drift.
 *
 * Status tones:
 *   Every place the app expresses severity — health-status badges, disease
 *   severity tags, vet warnings, match-score rings — resolves to one of four
 *   tones, so the same condition is never green in one screen and amber in
 *   another:
 *
 *     healthy   green  — all clear
 *     attention amber  — needs attention / stale / moderate
 *     critical  red    — severe or critical
 *     neutral   gray   — no data
 *
 *   Each tone carries: `solid` (fills, rings, dots), `soft` (chip/section
 *   backgrounds), `text` (label on a soft background), and `border`.
 */

const brand = {
  50: "#f0f9f4",
  100: "#dcf0e3",
  500: "#2e7d4f",
  600: "#276a43",
  700: "#215838",
  900: "#123122",
};

/** Warm off-whites — a stark #ffffff canvas is what reads as "sterile". */
const surface = {
  /** Screen background. */
  canvas: "#f5f7f4",
  /** Cards and sheets, lifted off the canvas by shadow rather than a border. */
  card: "#ffffff",
  /** Inset rows / secondary fills inside a card. */
  muted: "#f1f4f1",
  /** Hairlines, used sparingly now that cards carry shadows. */
  line: "#e8ece8",
};

const status = {
  healthy: {
    solid: "#2e7d4f",
    soft: "#e7f4ec",
    text: "#1d6340",
    border: "#c2e3cf",
  },
  attention: {
    solid: "#c8781a",
    soft: "#fdf3e4",
    text: "#8a5216",
    border: "#f0d9b0",
  },
  critical: {
    solid: "#b3401f",
    soft: "#fbeae5",
    text: "#8f3218",
    border: "#f0c6b8",
  },
  neutral: {
    solid: "#7f8998",
    soft: "#eff2f4",
    text: "#59626e",
    border: "#dde3e8",
  },
};

const text = {
  primary: "#182019",
  secondary: "#5b655d",
  tertiary: "#667069",
  inverse: "#ffffff",
};

module.exports = { brand, surface, status, text };
