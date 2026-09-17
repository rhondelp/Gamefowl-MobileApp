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
import React, { useCallback, useState } from "react";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./contexts/AuthContext";
import { RootNavigator } from "./navigation/RootNavigator";
import { ToastHost } from "./components/ui/Toast";
import { IntroVideoScreen } from "./components/intro/IntroVideoScreen";

// Keep the native splash (app.json's expo-splash-screen config) on screen
// until Poppins is loaded, instead of flashing the system font first.
void SplashScreen.preventAutoHideAsync();

export default function App() {
  /**
   * Cold-launch animated intro (Milestone 15 branding). It renders only
   * until finished/skipped — meanwhile the AuthProvider bootstrap runs
   * underneath, so skipping never delays access to auth or data.
   */
  const [introDone, setIntroDone] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  // `loaded` never flips true on failure (it just stays false), so a real
  // font error is treated as "ready anyway" — falling back to the system
  // font beats leaving the app stuck on the splash screen forever.
  const fontsReady = fontsLoaded || !!fontError;

  // Native splash stays up until this fires — no gap where unstyled text
  // (or a second, home-grown loading screen) would flash.
  const onRootLayout = useCallback(() => {
    if (fontsReady) void SplashScreen.hideAsync();
  }, [fontsReady]);

  if (!fontsReady) return null;

  return (
    <SafeAreaProvider onLayout={onRootLayout}>
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
