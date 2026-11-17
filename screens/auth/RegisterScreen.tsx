/**
 * File: screens/auth/RegisterScreen.tsx
 *
 * Purpose:
 *   Account creation form (name, email, password, password confirmation).
 *   The backend logs the user in as part of registration and returns a
 *   token, so success lands straight in the main app via auth state.
 *
 * Validation layers:
 *   1. Client-side: all fields present, email shape, min length 8,
 *      confirmation matches — instant inline feedback.
 *   2. Server-side: ApiError banner for whole-form problems ("Invalid
 *      credentials" style messages) plus per-field errors mapped from the
 *      backend envelope (duplicate email, weak password...).
 */
import React, { useRef, useState } from "react";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Screen } from "../../components/ui/Screen";
import { TextField } from "../../components/ui/TextField";
import { Button } from "../../components/ui/Button";
import { FormError } from "../../components/ui/FormError";
import { useAuth } from "../../contexts/AuthContext";
import { ApiError } from "../../services/api/client";
import type { AuthStackScreenProps } from "../../navigation/types";

type Props = AuthStackScreenProps<"Register">;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  /** Client checks mirror backend rules so users get instant feedback. */
  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Name is required.";
    if (!email.trim()) errors.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) errors.email = "Enter a valid email address.";
    if (!password) errors.password = "Password is required.";
    else if (password.length < 8) errors.password = "Password must be at least 8 characters.";
    if (passwordConfirmation !== password) {
      errors.password_confirmation = "Passwords do not match.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!validate()) return;

    try {
      setSubmitting(true);
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        passwordConfirmation,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
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
      {/* Title scale matches Login (text-xl) so the form starts higher. */}
      <View className="mb-6">
        <Image
          source={require("../../assets/images/logo-mark.png")}
          style={{ width: 56, height: 56, resizeMode: "contain", alignSelf: "center" }}
        />
        <Text className="mt-2 text-xl font-bold text-center text-ink-primary">Create your account</Text>
        <Text className="mt-1 text-sm text-center text-ink-tertiary">
          Start monitoring your gamefowl's health today.
        </Text>
      </View>

      <FormError message={formError} />

      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="Juan Dela Cruz"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        error={fieldErrors.name ?? null}
      />
      <TextField
        ref={emailRef}
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={fieldErrors.email ?? null}
      />
      <TextField
        ref={passwordRef}
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="At least 8 characters"
        secure
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        error={fieldErrors.password ?? null}
      />
      <TextField
        ref={confirmRef}
        label="Confirm Password"
        value={passwordConfirmation}
        onChangeText={setPasswordConfirmation}
        placeholder="Repeat your password"
        secure
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={() => {
          if (!submitting) void handleSubmit();
        }}
        error={fieldErrors.password_confirmation ?? null}
      />

      <Button label="Create Account" onPress={handleSubmit} loading={submitting} />

      <TouchableOpacity
        className="self-center justify-center px-2 mt-5"
        style={{ minHeight: 44 }}
        onPress={() => navigation.navigate("Login")}
        accessibilityRole="button"
      >
        <Text className="text-sm text-ink-tertiary">
          Already have an account?{" "}
          <Text className="font-semibold text-brand-700">Log in</Text>
        </Text>
      </TouchableOpacity>
    </Screen>
  );
}
