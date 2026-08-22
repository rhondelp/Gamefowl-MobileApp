/**
 * File: components/ui/Toast.tsx
 *
 * Purpose:
 *   Minimal branded toast for TRANSIENT feedback ("Gamefowl saved.", "Logged
 *   out.", action failures). Custom-built instead of pulling
 *   react-native-toast-message: the app needs one styled banner with three
 *   tones and auto-dismiss — a dependency would buy nothing extra.
 *
 *   Division of labor (Milestone 15 rule): Alert.alert remains exclusively
 *   for destructive-action CONFIRMATIONS; everything non-blocking goes
 *   through here.
 *
 * Usage:
 *   <ToastHost /> once near the app root, then `showToast("...")` anywhere.
 */
import React, { useEffect, useRef, useState } from "react";
import { Animated, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ToastType = "success" | "error" | "info";

type ToastListener = (message: string, type: ToastType) => void;

let listener: ToastListener | null = null;

/** Fire a toast from anywhere in the app (screens, hooks, services). */
export function showToast(message: string, type: ToastType = "success") {
  listener?.(message, type);
}

const TONE: Record<
  ToastType,
  { bg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  success: { bg: "#276a43", icon: "checkmark-circle" },
  error: { bg: "#b3401f", icon: "warning" },
  info: { bg: "#111827", icon: "information-circle" },
};

/** Mount ONCE (App root). Listens to showToast() calls and animates banners. */
export function ToastHost() {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const translateY = useRef(new Animated.Value(-100)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const dismiss = () => {
      Animated.timing(translateY, {
        toValue: -120,
        duration: 180,
        useNativeDriver: true,
      }).start(() => setToast(null));
    };

    listener = (message: string, type: ToastType) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToast({ message, type });
      translateY.setValue(-100);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      hideTimer.current = setTimeout(dismiss, type === "error" ? 3500 : 2200);
    };

    return () => {
      listener = null;
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [translateY]);

  if (!toast) return null;
  const tone = TONE[toast.type];

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[
        {
          position: "absolute",
          left: 16,
          right: 16,
          top: insets.top + 8,
          backgroundColor: tone.bg,
          transform: [{ translateY }],
        },
      ]}
      className="z-50 flex-row items-center rounded-2xl px-4 py-3 shadow-lg"
    >
      <Ionicons name={tone.icon} size={18} color="#ffffff" />
      <Text className="mx-2 flex-1 text-sm font-medium leading-4 text-white">
        {toast.message}
      </Text>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification"
        onPress={() => {
          if (hideTimer.current) clearTimeout(hideTimer.current);
          Animated.timing(translateY, {
            toValue: -120,
            duration: 150,
            useNativeDriver: true,
          }).start(() => setToast(null));
        }}
      >
        <Ionicons name="close" size={16} color="#ffffff" />
      </TouchableOpacity>
    </Animated.View>
  );
}
