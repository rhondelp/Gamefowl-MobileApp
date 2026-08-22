/**
 * File: screens/profile/ChangePasswordScreen.tsx
 *
 * Purpose:
 *   Separate password-change flow (Milestone 16) — deliberately NOT merged
 *   with profile editing. PUT /auth/me/password with current_password +
 *   new_password + new_password_confirmation.
 *
 *   - Client validation mirrors UpdatePasswordRequest: all three required,
 *     new >= 8 chars (registration's strength rule), confirmation matches,
 *     and (UX nicety) new must differ from current.
 *   - Server errors ("The current password is incorrect.") render inline
 *     under current_password via the standard error envelope mapping.
 *   - The backend keeps THIS session signed in and revokes other devices'
 *     tokens; no re-login is needed here. Fields are never pre-filled or
 *     remembered, and are cleared after success.
 */
import React, { useState } from "react";
import { Text, View } from "react-native";

import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { FormError } from "../../components/ui/FormError";
import { TextField } from "../../components/ui/TextField";
import { showToast } from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";
import { validatePasswordChangeForm } from "../../utils/validation";
import * as authService from "../../services/api/auth";
import { ApiError } from "../../services/api/client";
import type { ProfileStackScreenProps } from "../../navigation/types";

type Props = ProfileStackScreenProps<"ChangePassword">;

export function ChangePasswordScreen({ navigation }: Props) {
  const { token } = useAuth();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmation, setConfirmation] = useState("");
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
    const errors = validatePasswordChangeForm({
      current,
      next,
      confirmation,
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0 || !token) return;

    try {
      setSubmitting(true);
      await authService.changePassword(token, {
        current_password: current,
        new_password: next,
        new_password_confirmation: confirmation,
      });
      showToast("Password changed. Other devices were logged out.");
      // Clear sensitive inputs before leaving — never remember passwords.
      setCurrent("");
      setNext("");
      setConfirmation("");
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
          Changing your password keeps this device signed in and signs out all
          other devices.
        </Text>

        <FormError message={formError} />

        <TextField
          label="Current password *"
          value={current}
          onChangeText={(t) => {
            setCurrent(t);
            clearFieldError("current_password");
          }}
          placeholder="Your current password"
          secure
          error={fieldErrors.current_password ?? null}
        />

        <TextField
          label="New password *"
          value={next}
          onChangeText={(t) => {
            setNext(t);
            clearFieldError("new_password");
          }}
          placeholder="At least 8 characters"
          secure
          error={fieldErrors.new_password ?? null}
        />

        <TextField
          label="Confirm new password *"
          value={confirmation}
          onChangeText={(t) => {
            setConfirmation(t);
            clearFieldError("new_password_confirmation");
          }}
          placeholder="Repeat the new password"
          secure
          error={fieldErrors.new_password_confirmation ?? null}
        />

        <Button
          label="Change Password"
          onPress={() => void handleSubmit()}
          loading={submitting}
        />
      </View>
    </Screen>
  );
}
