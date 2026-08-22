/**
 * File: screens/admin/AdminRecommendationFormScreen.tsx
 *
 * Purpose:
 *   Create AND edit a care recommendation (mode from optional
 *   recommendationId). Category is chip-selected from the backend's fixed
 *   CATEGORIES list; validation mirrors Store/UpdateRecommendationRequest.
 *   The Active toggle (edit mode only) covers deactivate/reactivate — the
 *   backend's DELETE is just is_active:false. Linking to diseases lives on
 *   the Disease Detail screen by design.
 */
import React, { useEffect, useState } from "react";
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
import { validateAdminRecommendationForm } from "../../utils/validation";
import {
  RECOMMENDATION_CATEGORIES,
  type RecommendationCategory,
} from "../../types/admin";
import type { AdminStackScreenProps } from "../../navigation/types";

type Props = AdminStackScreenProps<"AdminRecommendationForm">;

export function AdminRecommendationFormScreen({ route, navigation }: Props) {
  const recommendationId = route.params?.recommendationId;
  const isEdit = typeof recommendationId === "number";
  const { token } = useAuth();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<RecommendationCategory>("monitoring");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // No single-recommendation GET exists; resolve from the flat list.
  useEffect(() => {
    if (!isEdit || !token) return;
    void (async () => {
      try {
        const data = await adminApi.listRecommendations(token);
        const found = data.items.find((r) => r.id === recommendationId);
        if (!found) throw new ApiError(404, "Recommendation not found.");
        setTitle(found.title);
        setContent(found.content);
        setCategory(found.category);
        setIsActive(found.is_active);
      } catch (err) {
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "Could not load the recommendation."
        );
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendationId]);

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
    const errors = validateAdminRecommendationForm({ title, content });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setSubmitting(true);
      if (isEdit) {
        await adminApi.updateRecommendation(token!, recommendationId!, {
          title: title.trim(),
          content: content.trim(),
          category,
          is_active: isActive,
        });
      } else {
        await adminApi.createRecommendation(token!, {
          title: title.trim(),
          content: content.trim(),
          category,
        });
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
          {isEdit ? "Edit Recommendation" : "Add Recommendation"}
        </Text>
        <Text className="mb-6 text-center text-sm text-gray-500">
          Care guidance linked to diseases and shown on results.
        </Text>

        <FormError message={formError} />

        <TextField
          label="Title *"
          value={title}
          onChangeText={(t) => {
            setTitle(t);
            clearFieldError("title");
          }}
          placeholder="e.g. Isolate affected birds immediately"
          autoCapitalize="sentences"
          maxLength={255}
          error={fieldErrors.title ?? null}
        />

        {/* Category chips — exact backend CATEGORIES enum. */}
        <View className="mb-4">
          <Text className="mb-1 text-sm font-medium text-gray-700">Category *</Text>
          <View className="flex-row flex-wrap">
            {RECOMMENDATION_CATEGORIES.map((option) => {
              const selected = category === option;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setCategory(option);
                    clearFieldError("category");
                  }}
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
        </View>

        <TextField
          label="Content *"
          value={content}
          onChangeText={(t) => {
            setContent(t);
            clearFieldError("content");
          }}
          placeholder="The guidance owners will read…"
          multiline
          maxLength={5000}
          autoCapitalize="sentences"
          error={fieldErrors.content ?? null}
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
                Inactive recommendations stay editable but stop appearing to owners.
              </Text>
            </View>
          </Pressable>
        ) : null}

        <Button
          label={isEdit ? "Save Changes" : "Add Recommendation"}
          onPress={() => void handleSubmit()}
          loading={submitting}
        />
      </View>
    </Screen>
  );
}
