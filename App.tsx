/**
 * File: App.tsx
 *
 * Purpose:
 *   Application root. Wires the three global pieces together, once:
 *     1. AuthProvider — owns auth state/token (Context + SecureStore)
 *     2. SafeAreaProvider — inset awareness for notches/home bars
 *     3. RootNavigator — renders Splash / auth stack / main tabs based on
 *        that auth state
 *
 * The global.css import is required by NativeWind: Metro processes Tailwind
 * directives from this entry point.
 */
import "./global.css";
import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./contexts/AuthContext";
import { RootNavigator } from "./navigation/RootNavigator";
import { ToastHost } from "./components/ui/Toast";
import { IntroVideoScreen } from "./components/intro/IntroVideoScreen";

export default function App() {
  /**
   * Cold-launch animated intro (Milestone 15 branding). It renders only
   * until finished/skipped — meanwhile the AuthProvider bootstrap runs
   * underneath, so skipping never delays access to auth or data.
   */
  const [introDone, setIntroDone] = useState(false);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        {!introDone ? (
          <IntroVideoScreen
            videoSource={require("./assets/videos/intro.mp4")}
            onFinish={() => setIntroDone(true)}
          />
        ) : (
          <RootNavigator />
        )}
        {/* Global transient feedback (Milestone 15): sits above navigation. */}
        <ToastHost />
      </AuthProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
