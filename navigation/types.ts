/**
 * File: navigation/types.ts
 *
 * Purpose:
 *   TypeScript definitions for every named route in the app. React
 *   Navigation uses these so `navigation.navigate("GamefowlDetails", ...)`
 *   is fully typed — typos or missing params become compile errors instead
 *   of silent runtime bugs.
 *
 * Three navigators exist today:
 *   - AuthStackParamList: pre-login flow (Login <-> Register)
 *   - MainTabParamList:   post-login tabs (Dashboard + Profile; Health
 *                         Assessment/History tabs arrive in later milestones)
 *   - DashboardStackParamList: stack nested under the Dashboard tab holding
 *                         the whole bird-management flow.
 */
import type { NavigatorScreenParams } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

/** Bird-management stack nested inside the Dashboard tab. */
export type DashboardStackParamList = {
  Dashboard: undefined;
  MyGamefowl: undefined;
  GamefowlDetails: { gamefowlId: number };
  AddGamefowl: undefined;
  EditGamefowl: { gamefowlId: number };
  /** Milestone 11 diagnostic flow. */
  SymptomSelect: { gamefowlId: number; birdName?: string };
  /** historical=true frames results as a saved past record (M12 timeline). */
  AssessmentResult: { assessmentId: number; historical?: boolean };
  /** Milestone 12 history + manual records. */
  HealthHistory: { gamefowlId: number; birdName?: string };
  AddHealthRecord: { gamefowlId: number; birdName?: string };
  HealthRecordDetail: { gamefowlId: number; recordId: number };
};

/**
 * Admin management stack (Milestone 14) — registered ONLY when the signed-in
 * user has role "admin". Because unregistered screens cannot be navigated to
 * at all, this single registration point is also the route-level guard.
 */
export type AdminStackParamList = {
  AdminDashboard: undefined;
  AdminUsers: undefined;
  AdminUserDetail: { userId: number };
  AdminDiseases: undefined;
  /** diseaseId omitted = create mode; present = edit mode. */
  AdminDiseaseForm: { diseaseId?: number };
  AdminDiseaseDetail: { diseaseId: number };
  AdminSymptoms: undefined;
  AdminSymptomForm: { symptomId?: number };
  AdminRecommendations: undefined;
  AdminRecommendationForm: { recommendationId?: number };
};

/** Self-service profile flows (Milestone 16) nested under the Profile tab. */
export type ProfileStackParamList = {
  ProfileMain: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
};

export type MainTabParamList = {
  DashboardTab: NavigatorScreenParams<DashboardStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
  /** Present in the param list only so typing stays complete; the SCREEN is
   *  conditionally registered per role (see RootNavigator). */
  AdminTab?: NavigatorScreenParams<AdminStackParamList>;
};

/** Handy alias for screens living in the auth stack. */
export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

/** Handy alias for screens living in the dashboard stack. */
export type DashboardStackScreenProps<T extends keyof DashboardStackParamList> =
  NativeStackScreenProps<DashboardStackParamList, T>;

/** Handy alias for screens living in the admin stack. */
export type AdminStackScreenProps<T extends keyof AdminStackParamList> =
  NativeStackScreenProps<AdminStackParamList, T>;

/** Handy alias for screens living in the profile stack. */
export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
  NativeStackScreenProps<ProfileStackParamList, T>;
