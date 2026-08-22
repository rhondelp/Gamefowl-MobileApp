/**
 * File: navigation/RootNavigator.tsx
 *
 * Purpose:
 *   Decides WHAT the user sees based purely on authentication state from
 *   AuthContext — screens never call navigate() to "log in" or "log out":
 *
 *     status === 'loading'    -> SplashScreen (bootstrap still running)
 *     status === 'signedOut'  -> AuthStack  (Login <-> Register)
 *     status === 'signedIn'   -> MainTabs   (Dashboard + Profile)
 *
 * Structure since Milestone 10:
 *   Each tab owns a native stack. The Dashboard tab's stack carries the
 *   whole bird-management flow (list -> details -> add/edit) so push/pop
 *   animations work inside the tab while later milestones can simply add
 *   new tabs (Health Assessment, History) without touching auth logic.
 *
 * Headers: the tab navigator hides its own header and each stack screen
 * shows one — except Dashboard itself, which renders its custom greeting.
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
import { DashboardScreen } from "../screens/DashboardScreen";
import { MyGamefowlScreen } from "../screens/gamefowl/MyGamefowlScreen";
import { GamefowlDetailsScreen } from "../screens/gamefowl/GamefowlDetailsScreen";
import { AddGamefowlScreen } from "../screens/gamefowl/AddGamefowlScreen";
import { EditGamefowlScreen } from "../screens/gamefowl/EditGamefowlScreen";
import { SymptomSelectScreen } from "../screens/assessment/SymptomSelectScreen";
import { AssessmentResultScreen } from "../screens/assessment/AssessmentResultScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import type {
  AuthStackParamList,
  DashboardStackParamList,
  MainTabParamList,
} from "./types";

// Typing the navigators with our param lists is what makes screen props
// (navigation/route) fully typed on both sides.
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();
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

/** Bird-management flow stacked under the Dashboard tab. */
function DashboardStackScreen() {
  return (
    <DashboardStack.Navigator
      screenOptions={{
        headerTitleStyle: { fontWeight: "600" },
        headerShadowVisible: false,
        headerTintColor: "#111827",
      }}
    >
      {/* Custom-greeting landing screen: no system header on top of it. */}
      <DashboardStack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <DashboardStack.Screen
        name="MyGamefowl"
        component={MyGamefowlScreen}
        options={{ title: "My Gamefowl" }}
      />
      <DashboardStack.Screen
        name="GamefowlDetails"
        component={GamefowlDetailsScreen}
        options={{ title: "Bird Details" }}
      />
      <DashboardStack.Screen
        name="AddGamefowl"
        component={AddGamefowlScreen}
        options={{ title: "Add Gamefowl" }}
      />
      <DashboardStack.Screen
        name="EditGamefowl"
        component={EditGamefowlScreen}
        options={{ title: "Edit Profile" }}
      />
      <DashboardStack.Screen
        name="SymptomSelect"
        component={SymptomSelectScreen}
        options={{ title: "Health Assessment" }}
      />
      <DashboardStack.Screen
        name="AssessmentResult"
        component={AssessmentResultScreen}
        options={{ title: "Results" }}
      />
    </DashboardStack.Navigator>
  );
}

/**
 * Post-login area. Two tabs today (bird management + account); Health
 * Assessment/History tabs arrive in later milestones here.
 */
function MainTabsScreen() {
  return (
    <MainTabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2e7d4f",
      }}
    >
      <MainTabs.Screen
        name="DashboardTab"
        component={DashboardStackScreen}
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <MainTabs.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
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
