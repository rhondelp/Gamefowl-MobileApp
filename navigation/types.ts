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

export type MainTabParamList = {
  DashboardTab: NavigatorScreenParams<DashboardStackParamList>;
  ProfileTab: undefined;
};

/** Handy alias for screens living in the auth stack. */
export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

/** Handy alias for screens living in the dashboard stack. */
export type DashboardStackScreenProps<T extends keyof DashboardStackParamList> =
  NativeStackScreenProps<DashboardStackParamList, T>;
