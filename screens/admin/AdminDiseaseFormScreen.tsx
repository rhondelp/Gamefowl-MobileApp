/**
 * File: screens/admin/AdminDiseaseFormScreen.tsx
 *
 * Purpose:
 *   Create AND edit a knowledge-base disease (one screen, mode decided by
 *   whether route params carry a diseaseId). Field rules mirror the
 *   backend's Store/UpdateDiseaseRequest exactly (validated in
 *   utils/validation.ts); severity is chip-selected from the backend's
 *   four-value enum. Backend 422 field errors render inline.
 *
 *   is_active only appears in edit mode — new diseases always start active,
 *   matching the controller's explicit default.
 */
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { FormError } from "../../components/ui/FormError";
import { ErrorState } from "../../components/ui/ErrorState";
import { TextField } from "../../components/ui/TextField";
import { useAuth } from "../../contexts/AuthContext";
import * as adminApi from "../../services/api/admin";
import { ApiError } from "../../services/api/client";
import { validateAdminDiseaseForm } from "../../utils/validation";
import type { DiseaseSeverity } from "../../types/api";
import type {
  AdminDiseasePayload,
} from "../../types/admin";
import type { AdminStackScreenProps } from "../../navigation/types";

type Props = AdminStackScreenProps<"AdminDiseaseForm">;

const SEVERITY_OPTIONS: DiseaseSeverity[] = [
  "mild",
  "moderate",
  "severe",
  "critical",
];

interface FormState {
  name: string;
  description: string;
  severity: DiseaseSeverity;
  generalInfo: string;
  recommendedAction: string;
  preventionInfo: string;
  vetWarning: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  severity: "moderate",
  generalInfo: "",
  recommendedAction: "",
  preventionInfo: "",
  vetWarning: "",
};

export function AdminDiseaseFormScreen({ route, navigation }: Props) {
  const diseaseId = route.params?.diseaseId;
  const isEdit = typeof diseaseId === "number";
  const { token } = useAuth();

  const [values, setValues] = useState<FormState>(EMPTY_FORM);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit mode: prefill once from GET /admin/diseases/{id}.
  useEffect(() => {
    if (!isEdit || !token) return;
    void (async () => {
      try {
        const data = await adminApi.showDisease(token, diseaseId!);
        setValues({
          name: data.disease.name,
          description: data.disease.description ?? "",
          severity: data.disease.severity,
          generalInfo: data.disease.general_info ?? "",
          recommendedAction: data.disease.recommended_action ?? "",
          preventionInfo: data.disease.prevention_info ?? "",
          vetWarning: data.disease.vet_warning ?? "",
        });
        setIsActive(data.disease.is_active);
      } catch (err) {
        setLoadError(
          err instanceof ApiError ? err.message : "Could not load the disease."
        );
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diseaseId]);

  const setField = <K extends keyof FormState>(key: K, text: string) => {
    setValues((prev) => ({ ...prev, [key]: text }));
    setFieldErrors((prev) => {
      const keyName = key === "recommendedAction" ? "recommended_action" : key;
      if (!fieldErrors[keyName]) return prev;
      const next = { ...prev };
      delete next[keyName];
      return next;
    });
  };

  const handleSubmit = async () => {
    setFormError(null);
    const errors = validateAdminDiseaseForm(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload: AdminDiseasePayload = {
      name: values.name.trim(),
      description: values.description.trim(),
      severity: values.severity,
      general_info: values.generalInfo.trim() || null,
      recommended_action: values.recommendedAction.trim(),
      prevention_info: values.preventionInfo.trim() || null,
      vet_warning: values.vetWarning.trim() || null,
    };

    try {
      setSubmitting(true);
      if (isEdit) {
        await adminApi.updateDisease(token!, diseaseId!, payload);
      } else {
        await adminApi.createDisease(token!, payload);
      }
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

  if (loading) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2e7d4f" />
          <Text className="mt-3 text-sm text-gray-500">Loading…</Text>
        </View>
      </Screen>
    );
  }

  if (loadError) {
    return (
      <Screen>
        <View className="flex-1 justify-center">
          <ErrorState message={loadError} onRetry={() => navigation.goBack()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View>
        <Text className="mb-1 text-center text-xl font-bold text-gray-900">
          {isEdit ? "Edit Disease" : "Add Disease"}
        </Text>
        <Text className="mb-6 text-center text-sm text-gray-500">
          This is what the expert system reasons over — keep it accurate.
        </Text>

        <FormError message={formError} />

        <TextField
          label="Name *"
          value={values.name}
          onChangeText={(t) => setField("name", t)}
          placeholder="e.g. Fowl Typhoid"
          autoCapitalize="words"
          maxLength={255}
          error={fieldErrors.name ?? null}
        />

        {/* Severity chips — exact backend enum. */}
        <View className="mb-4">
          <Text className="mb-1 text-sm font-medium text-gray-700">Severity *</Text>
          <View className="flex-row flex-wrap">
            {SEVERITY_OPTIONS.map((option) => {
              const selected = values.severity === option;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setValues((prev) => ({ ...prev, severity: option }))}
                  className={`mr-2 mb-2 rounded-full border px-3.5 py-2 ${
                    selected ? "border-brand-600 bg-brand-600" : "border-gray-300 bg-white"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium capitalize ${
                      selected ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {fieldErrors.severity ? (
            <Text className="mt-1 text-sm text-alert">{fieldErrors.severity}</Text>
          ) : null}
        </View>

        <TextField
          label="Description *"
          value={values.description}
          onChangeText={(t) => setField("description", t)}
          placeholder="What this condition is and how it presents…"
          multiline
          maxLength={2000}
          autoCapitalize="sentences"
          error={fieldErrors.description ?? null}
        />

        <TextField
          label="Recommended action *"
          value={values.recommendedAction}
          onChangeText={(t) => setField("recommendedAction", t)}
          placeholder="Shown to owners as 'What to do' on results…"
          multiline
          maxLength={2000}
          autoCapitalize="sentences"
          error={fieldErrors.recommended_action ?? null}
        />

        <TextField
          label="General info"
          value={values.generalInfo}
          onChangeText={(t) => setField("generalInfo", t)}
          placeholder="Optional background for admins…"
          multiline
          maxLength={5000}
          autoCapitalize="sentences"
          error={fieldErrors.general_info ?? null}
        />

        <TextField
          label="Prevention tips"
          value={values.preventionInfo}
          onChangeText={(t) => setField("preventionInfo", t)}
          placeholder="Shown under results as 'Prevention tips'…"
          multiline
          maxLength={2000}
          autoCapitalize="sentences"
          error={fieldErrors.prevention_info ?? null}
        />

        <TextField
          label="Vet warning"
          value={values.vetWarning}
          onChangeText={(t) => setField("vetWarning", t)}
          placeholder="Only for severe/critical conditions needing a veterinarian…"
          multiline
          maxLength={1000}
          autoCapitalize="sentences"
          error={fieldErrors.vet_warning ?? null}
        />

        {/* Active flag exists only in edit mode; creation starts active. */}
        {isEdit ? (
          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: isActive }}
            onPress={() => setIsActive((prev) => !prev)}
            className="mb-5 flex-row items-center rounded-xl border border-gray-200 bg-white px-4 py-3"
          >
            <Ionicons
              name={isActive ? "toggle" : "toggle-outline"}
              size={26}
              color={isActive ? "#276a43" : "#9ca3af"}
              style={{ transform: [{ rotate: isActive ? "180deg" : "0deg" }] }}
            />
            <View className="ml-3 flex-1">
              <Text className="text-sm font-semibold text-gray-900">Active</Text>
              <Text className="text-xs text-gray-500">
                Inactive diseases are hidden from owner-facing screens.
              </Text>
            </View>
          </Pressable>
        ) : null}

        <Button
          label={isEdit ? "Save Changes" : "Add Disease"}
          onPress={() => void handleSubmit()}
          loading={submitting}
        />
      </View>
    </Screen>
  );
}
