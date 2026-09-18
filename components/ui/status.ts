/**
 * File: components/ui/status.ts
 *
 * Purpose:
 *   Maps the app's several severity vocabularies onto the four shared status
 *   tones in palette.js, so one condition reads the same color everywhere it
 *   appears. Presentation only — no value here changes what the backend says
 *   or what any screen decides to do.
 *
 *   The backend speaks three different vocabularies:
 *     health status      healthy | needs_attention | stale | no_data
 *     disease severity   mild | moderate | severe | critical
 *     symptom severity   mild | moderate | severe
 */
import { brand, status as statusPalette, surface, text } from "./palette";

export type StatusTone = "healthy" | "attention" | "critical" | "neutral";

export interface ToneStyle {
  /** Fills, rings, dots — raw hex for SVG/icon props that take no className. */
  solid: string;
  soft: string;
  text: string;
  border: string;
  /** Tailwind classes for the common "soft chip with matching label" case. */
  chipClass: string;
  textClass: string;
}

const TONE_CLASSES: Record<StatusTone, { chipClass: string; textClass: string }> = {
  healthy: { chipClass: "bg-healthy-soft", textClass: "text-healthy-text" },
  attention: { chipClass: "bg-attention-soft", textClass: "text-attention-text" },
  critical: { chipClass: "bg-critical-soft", textClass: "text-critical-text" },
  neutral: { chipClass: "bg-neutral-soft", textClass: "text-neutral-text" },
};

export function tone(name: StatusTone): ToneStyle {
  return { ...statusPalette[name], ...TONE_CLASSES[name] };
}

/** Derived health status from GET /gamefowls/{id}/health-status. */
export function healthStatusTone(status: string): StatusTone {
  switch (status) {
    case "healthy":
      return "healthy";
    case "needs_attention":
      return "attention";
    // Stale data is a prompt to re-assess, not an all-clear.
    case "stale":
      return "attention";
    default:
      return "neutral";
  }
}

/** Disease or symptom severity as stored on the assessment snapshot. */
export function severityTone(severity: string | null | undefined): StatusTone {
  switch (severity) {
    case "mild":
      return "healthy";
    case "moderate":
      return "attention";
    case "severe":
    case "critical":
      return "critical";
    default:
      return "neutral";
  }
}

/** Critical is the only severity that earns a solid (not soft) fill. */
export function isCriticalSeverity(severity: string | null | undefined): boolean {
  return severity === "critical";
}

export const palette = { brand, status: statusPalette, surface, text };
