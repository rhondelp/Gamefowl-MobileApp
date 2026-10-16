/**
 * File: screens/auth/LoginScreen.tsx
 *
 * Purpose:
 *   Email + password login form. Calls AuthContext.login() which hits the
 *   real Sanctum backend; on success the RootNavigator automatically moves
 *   to the main app (no manual navigation call needed — auth state drives it).
 *
 * Error handling:
 *   - Client-side inline checks run before any request (fast feedback).
 *   - Server errors arrive as ApiError: banner shows `message` ("Invalid
 *     credentials."), per-field messages render under their inputs.
 *   - 429 rate limiting surfaces friendly copy in the banner.
 */
import React, { useState } from "react";
import { Image, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { Ionicons } from "@expo/vector-icons";
import { tone } from "../../components/ui/status";

import { TextField } from "../../components/ui/TextField";
import { Button } from "../../components/ui/Button";
import { FormError } from "../../components/ui/FormError";
import { useAuth } from "../../contexts/AuthContext";
import { ApiError } from "../../services/api/client";
import type { AuthStackScreenProps } from "../../navigation/types";

/** Props include navigation for switching to the Register screen. */
type Props = AuthStackScreenProps<"Login">;

/** logo-full.png is 684×558 (mark + wordmark, tagline cropped off). */
const LOGO_RATIO = 684 / 558;

export function LoginScreen({ navigation }: Props) {
  const { login, sessionExpired } = useAuth();

  // ~58% of screen width, but capped by height so the whole form still fits
  // above the fold on short phones.
  const { width: winW, height: winH } = useWindowDimensions();
  const logoH = Math.min((winW * 0.58) / LOGO_RATIO, winH * 0.24, 230);

  // Local form state — kept in the screen because only this screen cares.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Field-level validation messages keyed by field name.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // Whole-form error from the server (credentials / rate limit / network).
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** Cheap client-side checks first; returns true when the payload is sane. */
  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!email.trim()) errors.email = "Email is required.";
    if (!password) errors.password = "Password is required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!validate()) return;

    try {
      setSubmitting(true);
      await login(email.trim(), password);
      // No navigate() call: signed-in state re-renders RootNavigator.
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        // Map backend per-field errors onto our fields.
        if (error.fieldErrors) {
          const mapped: Record<string, string> = {};
          for (const [field, messages] of Object.entries(error.fieldErrors)) {
            mapped[field] = messages[0];
          }
          setFieldErrors(mapped);
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll>
      {/* The wordmark is part of the logo image, so it doubles as the title;
          the subtitle stays live text so it's readable and scales. */}
      <View className="mb-8 items-center">
        <Image
          source={require("../../assets/images/logo-full.png")}
          style={{ width: logoH * LOGO_RATIO, height: logoH, resizeMode: "contain" }}
          accessible
          accessibilityRole="image"
          accessibilityLabel="Gamefowl"
        />
        <Text className="mt-3 text-base text-ink-secondary">Early Bird Disease Monitoring</Text>
      </View>

      {/* Forced sign-out explanation (token revoked/expired mid-session). */}
      {sessionExpired ? (
        <View
          accessibilityRole="alert"
          className="mb-4 flex-row items-start rounded-control px-4 py-3"
          style={{ backgroundColor: tone("attention").soft }}
        >
          <Ionicons name="time-outline" size={18} color={tone("attention").solid} />
          <Text
            className="ml-2 flex-1 text-sm leading-5"
            style={{ color: tone("attention").text }}
          >
            Your session has expired or was revoked. Please log in again.
          </Text>
        </View>
      ) : null}

      <FormError message={formError} />

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        error={fieldErrors.email ?? null}
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        secure
        error={fieldErrors.password ?? null}
      />

      {/* Inline link under the password field — only carries a prefill when
          the user has actually typed an email, so an untouched Login lands
          on an empty Forgot Password field. */}
      <TouchableOpacity
        className="-mt-2 mb-4 self-end justify-center px-1"
        style={{ minHeight: 44 }}
        hitSlop={8}
        onPress={() =>
          navigation.navigate("ForgotPassword", {
            prefillEmail: email.trim() || undefined,
          })
        }
        accessibilityRole="link"
        accessibilityLabel="Forgot password"
      >
        <Text className="text-sm font-semibold text-brand-700">
          Forgot Password?
        </Text>
      </TouchableOpacity>

      <Button label="Log In" onPress={handleSubmit} loading={submitting} />

      <TouchableOpacity
        className="mt-4 self-center justify-center px-2"
        style={{ minHeight: 44 }}
        hitSlop={8}
        onPress={() => navigation.navigate("Register")}
        accessibilityRole="button"
        accessibilityLabel="Create an account"
      >
        <Text className="text-sm text-ink-secondary">
          Don't have an account?{" "}
          <Text className="font-semibold text-brand-700">Create one</Text>
        </Text>
      </TouchableOpacity>
    </Screen>
  );
}
