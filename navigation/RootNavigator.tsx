/**
 * File: navigation/RootNavigator.tsx
 *
 * Purpose:
 *   Decides WHAT the user sees based purely on authentication state from
 *   AuthContext — screens never call navigate() to "log in" or "log out":
 *
 *     status === 'loading'    -> SplashScreen (bootstrap still running)
 *     status === 'signedOut'  -> AuthStack  (Login <-> Register)
 *     status === 'signedIn'   -> MainTabs   (app content; Dashboard today)
 *
 * This state-driven switch is the whole security model for routing: there
 * is no code path where a signed-out user can reach app content, and logout
 * automatically returns to Login because state flips underneath the tree.
 */
import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "../contexts/AuthContext";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterScreen } from "../screens/auth/RegisterScreen";
import { SplashScreen } from "../screens/auth/SplashScreen";
import { DashboardScreen } from "../screens/DashboardScreen";
import type { AuthStackParamList, MainTabParamList } from "./types";

// Typing the navigators with our param lists is what makes screen props
// (navigation/route) fully typed on both sides.
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTabs = createBottomTabNavigator<MainTabParamList>();

/** Pre-login flow. Headers hidden: each screen carries its own branding. */
function AuthStackScreen() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

/**
 * Post-login area. One tab today ("Home"); Milestones 10+ add Birds,
 * Assessments, and History tabs here without touching the auth logic.
 */
function MainTabsScreen() {
  return (
    <MainTabs.Navigator
      screenOptions={{
        headerTitleStyle: { fontWeight: "600" },
        tabBarActiveTintColor: "#2e7d4f",
      }}
    >
      <MainTabs.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          title: "Gamefowl",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="paw" size={size} color={color} />
          ),
        }}
      />
    </MainTabs.Navigator>
  );
}

export function RootNavigator() {
  const { status } = useAuth();

  // Bootstrap in progress: show a minimal splash and render nothing else,
  // so neither auth screens nor app content can flash before we know the
  // real auth state.
  if (status === "loading") {
    return (
      <View className="flex-1 items-center justify-center bg-brand-600">
        <ActivityIndicator color="#ffffff" />
        <Text className="mt-3 text-sm text-brand-100">Checking session…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {status === "signedIn" ? <MainTabsScreen /> : <AuthStackScreen />}
    </NavigationContainer>
  );
}
