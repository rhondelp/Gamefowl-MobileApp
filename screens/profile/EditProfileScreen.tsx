/**
 * File: screens/profile/EditProfileScreen.tsx
 *
 * Purpose:
 *   Self-service profile editing (Milestone 16): name + email against
 *   PATCH /auth/me. Pre-filled from the cached auth user; validation mirrors
 *   UpdateProfileRequest (required, email format, lengths); backend errors —
 *   e.g. an email already taken by ANOTHER account — render inline under
 *   their fields. Success updates the auth context (no re-login) with a
 *   toast, then pops back to Settings.
 */
import React, { useState } from "react";
import { Text, View } from "react-native";

import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { FormError } from "../../components/ui/FormError";
import { TextField } from "../../components/ui/TextField";
import { showToast } from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";
import { ApiError } from "../../services/api/client";
import { validateProfileForm } from "../../utils/validation";
import type { ProfileStackScreenProps } from "../../navigation/types";

type Props = ProfileStackScreenProps<"EditProfile">;

export function EditProfileScreen({ navigation }: Props) {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async () => {
    setFormError(null);
    const errors = validateProfileForm({ name, email });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setSubmitting(true);
      await updateProfile(name.trim(), email.trim().toLowerCase());
      showToast("Profile updated.");
      navigation.goBack();
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
      <View>
        <Text className="mb-6 text-center text-sm text-gray-500">
          Your account details are visible only to you and system admins.
        </Text>

        <FormError message={formError} />

        <TextField
          label="Name *"
          value={name}
          onChangeText={(t) => {
            setName(t);
            clearFieldError("name");
          }}
          placeholder="Your full name"
          autoCapitalize="words"
          maxLength={255}
          error={fieldErrors.name ?? null}
        />

        <TextField
          label="Email *"
          value={email}
          onChangeText={(t) => {
            setEmail(t);
            clearFieldError("email");
          }}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          maxLength={255}
          error={fieldErrors.email ?? null}
        />

        <Button
          label="Save Changes"
          onPress={() => void handleSubmit()}
          loading={submitting}
        />
      </View>
    </Screen>
  );
}
