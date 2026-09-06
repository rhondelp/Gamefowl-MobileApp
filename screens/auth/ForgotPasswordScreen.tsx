/**
 * File: screens/auth/ForgotPasswordScreen.tsx
 *
 * Purpose:
 *   Milestone 17 entry point for the public forgot-password flow. The user
 *   enters an email; we POST it to the backend; the backend ALWAYS answers
 *   the same way (whether or not the email is registered) and then emails
 *   a reset link pointing at a backend-hosted web page.
 *
 *   This screen is intentionally the END of the mobile's responsibility:
 *   no reset form, no deep link, no token handling. The user reads their
 *   email in their mail client, completes the reset in their browser, and
 *   comes back here to log in normally.
 *
 * Two UI modes, one screen:
 *   - Form mode (default + after a retryable error): email input, submit
 *     button, "Back to Login" link.
 *   - Confirmation mode (after a 2xx): neutral copy that DOES NOT reveal
 *     whether the email matched an account, plus a "Back to Login" button.
 *
 * The neutral copy is the security boundary: "If an account exists for that
 * email..." matches the backend's intentionally non-revealing behavior. Any
 * wording that implies verification ("Email sent!", "Account found!")
 * would leak account presence to anyone who can probe the form.
 */
import React, { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../../components/ui/Screen";
import { TextField } from "../../components/ui/TextField";
import { Button } from "../../components/ui/Button";
import { FormError } from "../../components/ui/FormError";
import { requestPasswordReset } from "../../services/api/auth";
import { ApiError } from "../../services/api/client";
import type { AuthStackScreenProps } from "../../navigation/types";

type Props = AuthStackScreenProps<"ForgotPassword">;

/** Pragmatic email shape check; matches the one used in Register and
 *  validateProfileForm. Kept inline because this screen is the only caller
 *  and a shared util isn't justified for one field. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordScreen({ navigation, route }: Props) {
  // Login forwards whatever the user already typed — empty when omitted.
  const [email, setEmail] = useState<string>(route.params?.prefillEmail ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Flips to true on any 2xx response and stays true for the screen's life.
  // We never reset to false: the user is done with the form at that point.
  const [submitted, setSubmitted] = useState(false);

  /** Cheap client-side checks first; returns true when the payload is sane. */
  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    const trimmed = email.trim();
    if (!trimmed) errors.email = "Email is required.";
    else if (!EMAIL_PATTERN.test(trimmed))
      errors.email = "Enter a valid email address.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!validate()) return;

    try {
      setSubmitting(true);
      await requestPasswordReset(email.trim());
      // The backend's 2xx is the success signal — never inspect the body
      // for account existence (it deliberately doesn't say).
      setSubmitted(true);
    } catch (error) {
      // Real failure only: network down, 5xx, etc. The "email not found"
      // case cannot surface here because the backend answers 2xx for it.
      if (error instanceof ApiError) {
        setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const goBackToLogin = () => navigation.navigate("Login");

  return (
    <Screen scroll>
      <View className="mb-8 items-center">
        <Image
          source={require("../../assets/images/main_logo.png")}
          style={{ width: 72, height: 72, resizeMode: "contain" }}
        />
        <Text className="mt-2 text-2xl font-bold text-gray-900">Forgot your password?</Text>
        <Text className="mt-1 text-center text-sm text-gray-500">
          Enter the email on your account and we'll send you a reset link.
        </Text>
      </View>

      {submitted ? (
        // --- Confirmation state (post-2xx) -------------------------------
        // Replaces the form entirely. Copy is intentionally non-revealing
        // so probing the endpoint cannot distinguish "email registered"
        // from "email not registered".
        <View className="rounded-2xl border border-brand-200 bg-brand-50 px-6 py-8">
          <View className="mb-4 self-center rounded-full bg-white p-3">
            <Ionicons name="mail-unread-outline" size={32} color="#2e7d4f" />
          </View>
          <Text className="text-center text-base font-semibold text-gray-900">
            Check your inbox
          </Text>
          <Text className="mt-2 text-center text-sm leading-5 text-gray-700">
            If an account exists for that email, we've sent a password reset
            link. Check your inbox (and spam folder).
          </Text>
          <View className="mt-6">
            <Button label="Back to Login" onPress={goBackToLogin} />
          </View>
        </View>
      ) : (
        // --- Form state (default + after a retryable error) -------------
        <View>
          <FormError message={formError} />

          <TextField
            label="Email"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              // Clear the inline error as soon as the user edits — same UX
              // pattern as the other auth forms.
              if (fieldErrors.email) {
                setFieldErrors((prev) => {
                  if (!prev.email) return prev;
                  const next = { ...prev };
                  delete next.email;
                  return next;
                });
              }
              if (formError) setFormError(null);
            }}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={fieldErrors.email ?? null}
          />

          <Button
            label="Send Reset Link"
            onPress={() => void handleSubmit()}
            loading={submitting}
          />

          <TouchableOpacity
            className="mt-6 self-center"
            onPress={goBackToLogin}
            accessibilityRole="link"
          >
            <Text className="text-sm text-gray-500">
              Remembered it?{" "}
              <Text className="font-semibold text-brand-600">Back to Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </Screen>
  );
}
