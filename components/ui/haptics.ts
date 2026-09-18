/**
 * File: components/ui/haptics.ts
 *
 * Purpose:
 *   Thin wrappers over expo-haptics so call sites read as intent ("this was
 *   a selection", "this was a destructive confirm") rather than as hardware
 *   style constants, and so the whole app can be muted from one place.
 *
 *   Every call is fire-and-forget and swallows its own errors: haptics are
 *   unavailable on web, on the simulator, and on devices where the user has
 *   switched system haptics off. A missing buzz must never interrupt the
 *   action it accompanies.
 */
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const supported = Platform.OS === "ios" || Platform.OS === "android";

async function safely(run: () => Promise<void>): Promise<void> {
  if (!supported) return;
  try {
    await run();
  } catch {
    // Haptics are a nicety; never surface or propagate a failure.
  }
}

/** Ticking a symptom, toggling a chip — the lightest possible cue. */
export function tapSelection(): Promise<void> {
  return safely(() => Haptics.selectionAsync());
}

/** A committed action, e.g. opening the assessment flow from the FAB. */
export function tapMedium(): Promise<void> {
  return safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

/** A submit that succeeded. */
export function notifySuccess(): Promise<void> {
  return safely(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
  );
}

/** A submit that failed validation or the request. */
export function notifyError(): Promise<void> {
  return safely(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
  );
}

/** Raising a destructive confirmation (delete, deactivate, log out). */
export function warnDestructive(): Promise<void> {
  return safely(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
  );
}
