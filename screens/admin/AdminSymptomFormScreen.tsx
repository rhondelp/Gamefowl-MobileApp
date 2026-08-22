/**
 * File: screens/admin/AdminSymptomFormScreen.tsx
 *
 * Purpose:
 *   Create AND edit a knowledge-base symptom (mode from optional symptomId).
 *   Rules mirror the backend's Store/UpdateSymptomRequest (name unique<=255,
 *   category<=100 required, description<=2000, severity enum chips).
 *
 *   Deactivation lives here as a visible Active toggle in edit mode — the
 *   backend's DELETE endpoint just sets is_active:false anyway, so one
 *   control covers both deactivate and reactivate.
 */
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { FormError } from "../../components/ui/FormError";
import { ErrorState } from "../../components/ui/ErrorState";
import { TextField } from "../../components/ui/TextField";
import { showToast } from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";
import * as adminApi from "../../services/api/admin";
import { ApiError } from "../../services/api/client";
import { validateAdminSymptomForm } from "../../utils/validation";
import type { SymptomSeverity } from "../../types/api";
import type { AdminStackScreenProps } from "../../navigation/types";

type Props = AdminStackScreenProps<"AdminSymptomForm">;

const SEVERITY_OPTIONS: SymptomSeverity[] = ["mild", "moderate", "severe"];

interface FormState {
  name: string;
  category: string;
  description: string;
  severity: SymptomSeverity;
}

const EMPTY_FORM: FormState = {
  name: "",
  category: "",
  description: "",
  severity: "mild",
};

export function AdminSymptomFormScreen({ route, navigation }: Props) {
  const symptomId = route.params?.symptomId;
  const isEdit = typeof symptomId === "number";
  const { token } = useAuth();

  const [values, setValues] = useState<FormState>(EMPTY_FORM);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit || !token) return;
    void (async () => {
      try {
        const data = await adminApi.listSymptoms(token);
        const found = data.items.find((s) => s.id === symptomId);
        if (!found) {
          // No single-symptom GET exists; resolve from the flat list.
          throw new ApiError(404, "Symptom not found.");
        }
        setValues({
          name: found.name,
          category: found.category,
          description: found.description ?? "",
          severity: found.severity,
        });
        setIsActive(found.is_active);
      } catch (err) {
        setLoadError(
          err instanceof ApiError ? err.message : "Could not load the symptom."
        );
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symptomId]);

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
    const errors = validateAdminSymptomForm(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = {
      name: values.name.trim(),
      description: values.description.trim() || null,
      category: values.category.trim(),
      severity: values.severity,
    };

    try {
      setSubmitting(true);
      if (isEdit) {
        // is_active rides along on updates (backend admin-only field).
        await adminApi.updateSymptom(token!, symptomId!, {
          ...payload,
          is_active: isActive,
        });
        showToast("Symptom saved.");
      } else {
        await adminApi.createSymptom(token!, payload);
        showToast("Symptom added to the checklist.");
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
          {isEdit ? "Edit Symptom" : "Add Symptom"}
        </Text>
        <Text className="mb-6 text-center text-sm text-gray-500">
          Owners tick these when reporting a sick bird.
        </Text>

        <FormError message={formError} />

        <TextField
          label="Name *"
          value={values.name}
          onChangeText={(t) => {
            setValues((prev) => ({ ...prev, name: t }));
            clearFieldError("name");
          }}
          placeholder="e.g. Purple comb"
          autoCapitalize="sentences"
          maxLength={255}
          error={fieldErrors.name ?? null}
        />

        <TextField
          label="Category *"
          value={values.category}
          onChangeText={(t) => {
            setValues((prev) => ({ ...prev, category: t }));
            clearFieldError("category");
          }}
          placeholder="e.g. respiratory"
          autoCapitalize="none"
          maxLength={100}
          error={fieldErrors.category ?? null}
        />

        {/* Severity chips — exact backend enum. */}
        <View className="mb-4">
          <Text className="mb-1 text-sm font-medium text-gray-700">Severity *</Text>
          <View className="flex-row">
            {SEVERITY_OPTIONS.map((option) => {
              const selected = values.severity === option;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() =>
                    setValues((prev) => ({ ...prev, severity: option }))
                  }
                  className={`mr-2 flex-1 items-center rounded-xl border py-3 ${
                    selected
                      ? "border-brand-600 bg-brand-600"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold capitalize ${
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
          label="Description"
          value={values.description}
          onChangeText={(t) => setValues((prev) => ({ ...prev, description: t }))}
          placeholder="Optional clarification shown in the checklist…"
          multiline
          maxLength={2000}
          autoCapitalize="sentences"
          error={fieldErrors.description ?? null}
        />

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
                Inactive symptoms vanish from owner checklists and are ignored by
                the engine.
              </Text>
            </View>
          </Pressable>
        ) : null}

        <Button
          label={isEdit ? "Save Changes" : "Add Symptom"}
          onPress={() => void handleSubmit()}
          loading={submitting}
        />
      </View>
    </Screen>
  );
}
