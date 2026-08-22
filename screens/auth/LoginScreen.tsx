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
import { Text, TouchableOpacity, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { TextField } from "../../components/ui/TextField";
import { Button } from "../../components/ui/Button";
import { FormError } from "../../components/ui/FormError";
import { useAuth } from "../../contexts/AuthContext";
import { ApiError } from "../../services/api/client";
import type { AuthStackScreenProps } from "../../navigation/types";

/** Props include navigation for switching to the Register screen. */
type Props = AuthStackScreenProps<"Login">;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();

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
      <View className="mb-10 items-center">
        <Text className="text-3xl font-bold tracking-widest text-brand-600">GAMEFOWL</Text>
        <Text className="mt-1 text-sm text-gray-500">Early Bird Disease Monitoring</Text>
      </View>

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

      <Button label="Log In" onPress={handleSubmit} loading={submitting} />

      <TouchableOpacity
        className="mt-6 self-center"
        onPress={() => navigation.navigate("Register")}
        accessibilityRole="button"
      >
        <Text className="text-sm text-gray-500">
          Don't have an account?{" "}
          <Text className="font-semibold text-brand-600">Create one</Text>
        </Text>
      </TouchableOpacity>
    </Screen>
  );
}
