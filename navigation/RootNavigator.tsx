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
import { ActivityIndicator, Image, Text, View } from "react-native";
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
import { HealthHistoryScreen } from "../screens/history/HealthHistoryScreen";
import { AddHealthRecordScreen } from "../screens/history/AddHealthRecordScreen";
import { HealthRecordDetailScreen } from "../screens/history/HealthRecordDetailScreen";
import { AdminDashboardScreen } from "../screens/admin/AdminDashboardScreen";
import { AdminUsersScreen } from "../screens/admin/AdminUsersScreen";
import { AdminUserDetailScreen } from "../screens/admin/AdminUserDetailScreen";
import { AdminDiseasesScreen } from "../screens/admin/AdminDiseasesScreen";
import { AdminDiseaseFormScreen } from "../screens/admin/AdminDiseaseFormScreen";
import { AdminDiseaseDetailScreen } from "../screens/admin/AdminDiseaseDetailScreen";
import { AdminSymptomsScreen } from "../screens/admin/AdminSymptomsScreen";
import { AdminSymptomFormScreen } from "../screens/admin/AdminSymptomFormScreen";
import { AdminRecommendationsScreen } from "../screens/admin/AdminRecommendationsScreen";
import { AdminRecommendationFormScreen } from "../screens/admin/AdminRecommendationFormScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { EditProfileScreen } from "../screens/profile/EditProfileScreen";
import { ChangePasswordScreen } from "../screens/profile/ChangePasswordScreen";
import type {
  AuthStackParamList,
  DashboardStackParamList,
  AdminStackParamList,
  MainTabParamList,
  ProfileStackParamList,
} from "./types";

// Typing the navigators with our param lists is what makes screen props
// (navigation/route) fully typed on both sides.
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();
const AdminStack = createNativeStackNavigator<AdminStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const MainTabs = createBottomTabNavigator<MainTabParamList>();

/**
 * Self-service account stack (Milestone 16): settings main + edit profile +
 * change password. Headers shown — the forms rely on the back button.
 */
function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerTitleStyle: { fontWeight: "600" },
        headerShadowVisible: false,
        headerTintColor: "#111827",
        animation: "slide_from_right",
      }}
    >
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: "Edit Profile" }}
      />
      <ProfileStack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: "Change Password" }}
      />
    </ProfileStack.Navigator>
  );
}

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
        // Consistent push feel on both platforms (Milestone 15 motion pass).
        animation: "slide_from_right",
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
      <DashboardStack.Screen
        name="HealthHistory"
        component={HealthHistoryScreen}
        options={{ title: "Health History" }}
      />
      <DashboardStack.Screen
        name="AddHealthRecord"
        component={AddHealthRecordScreen}
        options={{ title: "Log Health Record" }}
      />
      <DashboardStack.Screen
        name="HealthRecordDetail"
        component={HealthRecordDetailScreen}
        options={{ title: "Record Detail" }}
      />
    </DashboardStack.Navigator>
  );
}

/**
 * Admin management stack (Milestone 14): dashboard stats, user management,
 * and full knowledge-base CRUD. Mounted ONLY inside the role-conditional
 * Admin tab below.
 */
function AdminStackScreen() {
  return (
    <AdminStack.Navigator
      screenOptions={{
        headerTitleStyle: { fontWeight: "600" },
        headerShadowVisible: false,
        headerTintColor: "#111827",
        animation: "slide_from_right",
      }}
    >
      <AdminStack.Screen
        name="AdminDashboard"
        component={AdminDashboardScreen}
        options={{ title: "Admin" }}
      />
      <AdminStack.Screen
        name="AdminUsers"
        component={AdminUsersScreen}
        options={{ title: "User Management" }}
      />
      <AdminStack.Screen
        name="AdminUserDetail"
        component={AdminUserDetailScreen}
        options={{ title: "User Detail" }}
      />
      <AdminStack.Screen
        name="AdminDiseases"
        component={AdminDiseasesScreen}
        options={{ title: "Diseases" }}
      />
      <AdminStack.Screen
        name="AdminDiseaseDetail"
        component={AdminDiseaseDetailScreen}
        options={{ title: "Disease Detail" }}
      />
      <AdminStack.Screen
        name="AdminDiseaseForm"
        component={AdminDiseaseFormScreen}
        options={{ title: "Disease" }}
      />
      <AdminStack.Screen
        name="AdminSymptoms"
        component={AdminSymptomsScreen}
        options={{ title: "Symptoms" }}
      />
      <AdminStack.Screen
        name="AdminSymptomForm"
        component={AdminSymptomFormScreen}
        options={{ title: "Symptom" }}
      />
      <AdminStack.Screen
        name="AdminRecommendations"
        component={AdminRecommendationsScreen}
        options={{ title: "Recommendations" }}
      />
      <AdminStack.Screen
        name="AdminRecommendationForm"
        component={AdminRecommendationFormScreen}
        options={{ title: "Recommendation" }}
      />
    </AdminStack.Navigator>
  );
}

/**
 * Post-login area. The Admin tab is registered ONLY when the signed-in user
 * has role "admin" — a single central check at the navigation level. An
 * owner's navigator literally contains no admin screens, so neither the tab
 * bar nor any navigate() call can reach them (route-level guard, not just a
 * hidden button).
 */
function MainTabsScreen({ isAdmin }: { isAdmin: boolean }) {
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
      {isAdmin ? (
        <MainTabs.Screen
          name="AdminTab"
          component={AdminStackScreen}
          options={{
            title: "Admin",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="shield-checkmark" size={size} color={color} />
            ),
          }}
        />
      ) : null}
      <MainTabs.Screen
        name="ProfileTab"
        component={ProfileStackScreen}
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
  const { status, user } = useAuth();

  // Bootstrap in progress: show a branded splash and render nothing else,
  // so neither auth screens nor app content can flash before we know the
  // real auth state.
  if (status === "loading") {
    return (
      <View className="flex-1 items-center justify-center bg-brand-600">
        <Image
          source={require("../assets/images/app_icon_white.png")}
          style={{ width: 110, height: 110, resizeMode: "contain" }}
        />
        <ActivityIndicator color="#ffffff" style={{ marginTop: 16 }} />
        <Text className="mt-3 text-sm text-brand-100">Checking session…</Text>
      </View>
    );
  }

  const isAdmin = user?.role === "admin";

  return (
    <NavigationContainer>
      {status === "signedIn" ? (
        <MainTabsScreen isAdmin={isAdmin} />
      ) : (
        <AuthStackScreen />
      )}
    </NavigationContainer>
  );
}
