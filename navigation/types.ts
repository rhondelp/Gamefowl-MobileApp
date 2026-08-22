/**
 * File: navigation/types.ts
 *
 * Purpose:
 *   TypeScript definitions for every named route in the app. React
 *   Navigation uses these so `navigation.navigate("Register")` is fully
 *   typed — typos or missing params become compile errors instead of
 *   silent runtime bugs.
 *
 * Two stacks exist today:
 *   - AuthStackParamList: pre-login flow (Login <-> Register)
 *   - MainTabParamList: post-login app (currently one Home tab; more tabs
 *     like Birds / History arrive in Milestones 10+).
 */
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
};

/** Handy alias for screens living in the auth stack. */
export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;
