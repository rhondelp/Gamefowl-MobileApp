/**
 * File: screens/admin/AdminDiseaseDetailScreen.tsx
 *
 * Purpose:
 *   The heart of knowledge-base management: one disease's full profile plus
 *   its WEIGHTED RULES — literally the data DiagnosticEngine reasons over.
 *
 *   - Rule rows show symptom name + a 1–5 weight stepper (PUT /admin/rules)
 *     and remove (DELETE /admin/rules/{id}; rules are the documented
 *     hard-delete exception — past assessments keep their snapshots).
 *   - "Attach symptom" picks from symptoms NOT already linked and posts the
 *     pair with a weight; backend duplicate-pair errors surface inline.
 *   - Linked recommendations can be detached or added from the full
 *     recommendation pool (attach is rejected server-side when duplicated).
 *   - Deactivate/Reactivate uses DELETE/PUT {is_active} respectively.
 */
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { ErrorState } from "../../components/ui/ErrorState";
import { useAuth } from "../../contexts/AuthContext";
import * as adminApi from "../../services/api/admin";
import { ApiError } from "../../services/api/client";
import type {
  AdminDisease,
  AdminRecommendation,
  AdminSymptom,
} from "../../types/admin";
import type { AdminStackScreenProps } from "../../navigation/types";

type Props = AdminStackScreenProps<"AdminDiseaseDetail">;

const SEVERITY_CHIP: Record<string, string> = {
  mild: "bg-green-100",
  moderate: "bg-amber-100",
  severe: "bg-red-100",
  critical: "bg-alert",
};
const SEVERITY_TEXT: Record<string, string> = {
  mild: "text-green-700",
  moderate: "text-amber-700",
  severe: "text-red-700",
  critical: "text-white",
};

export function AdminDiseaseDetailScreen({ route, navigation }: Props) {
  const { diseaseId } = route.params;
  const { token } = useAuth();

  const [disease, setDisease] = useState<AdminDisease | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Attach-symptom picker state.
  const [showSymptomPicker, setShowSymptomPicker] = useState(false);
  const [symptoms, setSymptoms] = useState<AdminSymptom[]>([]);
  const [selectedSymptomId, setSelectedSymptomId] = useState<number | null>(null);
  const [newWeight, setNewWeight] = useState(3);
  // Attach-recommendation picker state.
  const [showRecPicker, setShowRecPicker] = useState(false);
  const [recommendations, setRecommendations] = useState<AdminRecommendation[]>([]);
  const [selectedRecId, setSelectedRecId] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await adminApi.showDisease(token, diseaseId);
      setDisease(data.disease);
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again."
      );
    }
  }, [token, diseaseId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  /** Confirm-dialog wrapper for destructive actions. */
  const confirmAction = (
    title: string,
    message: string,
    action: () => Promise<void>
  ) => {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              setBusy(true);
              await action();
              await load();
            } catch (err) {
              Alert.alert(
                "Action failed",
                err instanceof ApiError
                  ? err.message
                  : "Something went wrong. Please try again."
              );
            } finally {
              setBusy(false);
            }
          })();
        },
      },
    ]);
  };

  if (loading && !disease) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2e7d4f" />
          <Text className="mt-3 text-sm text-gray-500">Loading disease…</Text>
        </View>
      </Screen>
    );
  }

  if (error && !disease) {
    return (
      <Screen>
        <View className="flex-1 justify-center">
          <ErrorState message={error} onRetry={() => void load()} />
        </View>
      </Screen>
    );
  }

  if (!disease) return null;

  const attachedIds = new Set(disease.rules.map((r) => r.symptom_id));
  const availableSymptoms = symptoms.filter((s) => !attachedIds.has(s.id));
  const linkedRecIds = new Set(disease.recommendations.map((r) => r.id));
  const availableRecs = recommendations.filter((r) => !linkedRecIds.has(r.id));

  /** Load symptom pool on first picker open. */
  const openSymptomPicker = async () => {
    setShowRecPicker(false);
    setShowSymptomPicker((prev) => {
      const next = !prev;
      if (next && symptoms.length === 0 && token) {
        void adminApi
          .listSymptoms(token)
          .then((data) => setSymptoms(data.items))
          .catch(() => setSymptoms([]));
      }
      return next;
    });
  };

  /** Load recommendation pool on first picker open. */
  const openRecPicker = () => {
    setShowSymptomPicker(false);
    setShowRecPicker((prev) => {
      const next = !prev;
      if (next && recommendations.length === 0 && token) {
        void adminApi
          .listRecommendations(token)
          .then((data) => setRecommendations(data.items))
          .catch(() => setRecommendations([]));
      }
      return next;
    });
  };

  return (
    <Screen>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Identity header */}
        <View className="mt-2 flex-row items-center">
          <View className="ml-0 flex-1">
            <Text className="text-lg font-bold text-gray-900">{disease.name}</Text>
            <View className="mt-1 flex-row items-center">
              <View className={`rounded-full px-2 py-0.5 ${SEVERITY_CHIP[disease.severity] ?? "bg-gray-100"}`}>
                <Text className={`text-[10px] font-semibold uppercase ${SEVERITY_TEXT[disease.severity] ?? "text-gray-500"}`}>
                  {disease.severity}
                </Text>
              </View>
              {!disease.is_active ? (
                <View className="ml-2 rounded-full bg-gray-100 px-2 py-0.5">
                  <Text className="text-[10px] font-semibold uppercase text-gray-500">
                    Inactive
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
          <Button
            label="Edit"
            variant="outline"
            onPress={() => navigation.navigate("AdminDiseaseForm", { diseaseId })}
          />
        </View>

        {/* Profile card */}
        <View className="mt-4 rounded-2xl border border-gray-200 bg-white px-4 py-2">
          <InfoBlock label="Description" text={disease.description} />
          <InfoBlock label="Recommended action" text={disease.recommended_action} />
          <InfoBlock label="General info" text={disease.general_info} last />
        </View>

        {(disease.prevention_info || disease.vet_warning) ? (
          <View className="mt-3 rounded-2xl border border-gray-200 bg-white px-4 py-2">
            {disease.vet_warning ? (
              <InfoBlock
                label="Vet warning"
                text={disease.vet_warning}
                tone="alert"
              />
            ) : null}
            <InfoBlock
              label="Prevention tips"
              text={disease.prevention_info}
              last={!disease.vet_warning}
            />
          </View>
        ) : null}

        {/* ------------------------- RULES ------------------------- */}
        <Text className="mb-2 mt-6 text-xs font-semibold uppercase tracking-widest text-brand-600">
          Symptom weights ({disease.rules.length})
        </Text>
        <Text className="mb-2 text-xs leading-4 text-gray-500">
          These pairs are what the engine scores. Weight 5 = highly indicative;
          removing a rule affects future assessments only — past records keep
          their snapshots.
        </Text>
        <View className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          {disease.rules.length === 0 ? (
            <Text className="px-4 py-3 text-sm text-gray-500">
              No rules yet — this disease can never match an assessment until it
              has at least one symptom.
            </Text>
          ) : (
            disease.rules.map((rule, index) => (
              <RuleRow
                key={rule.rule_id}
                rule={rule}
                busy={busy}
                isLast={index === disease.rules.length - 1}
                onChangeWeight={(weight) => {
                  void (async () => {
                    try {
                      setBusy(true);
                      await adminApi.updateRuleWeight(token!, rule.rule_id, weight);
                      await load();
                    } catch (err) {
                      Alert.alert(
                        "Update failed",
                        err instanceof ApiError ? err.message : "Please try again."
                      );
                    } finally {
                      setBusy(false);
                    }
                  })();
                }}
                onRemove={() =>
                  confirmAction(
                    "Remove rule?",
                    `“${rule.symptom_name}” will no longer contribute to ${disease.name}'s score.`,
                    () => adminApi.detachRule(token!, rule.rule_id)
                  )
                }
              />
            ))
          )}
        </View>

        {/* Attach-symptom picker */}
        <Pressable
          accessibilityRole="button"
          onPress={() => void openSymptomPicker()}
          className="mt-3 flex-row items-center rounded-xl border border-dashed border-brand-500 bg-brand-50 px-4 py-3"
        >
          <Ionicons name={showSymptomPicker ? "close" : "add"} size={16} color="#276a43" />
          <Text className="ml-1.5 text-sm font-semibold text-brand-700">
            {showSymptomPicker ? "Cancel" : "Attach a symptom"}
          </Text>
        </Pressable>
        {showSymptomPicker ? (
          <View className="mt-2 rounded-2xl border border-gray-200 bg-white p-3">
            {availableSymptoms.length === 0 ? (
              <Text className="py-1 text-sm text-gray-500">
                {symptoms.length === 0
                  ? "Loading symptoms…"
                  : "Every symptom is already attached to this disease."}
              </Text>
            ) : (
              <>
                {availableSymptoms.map((symptom) => (
                  <Pressable
                    key={symptom.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: selectedSymptomId === symptom.id }}
                    onPress={() => setSelectedSymptomId(symptom.id)}
                    className={`mb-1.5 flex-row items-center rounded-xl border px-3 py-2.5 ${
                      selectedSymptomId === symptom.id
                        ? "border-brand-600 bg-brand-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <Ionicons
                      name={
                        selectedSymptomId === symptom.id
                          ? "radio-button-on"
                          : "radio-button-off"
                      }
                      size={16}
                      color="#276a43"
                    />
                    <Text className="ml-2 flex-1 text-sm text-gray-800">
                      {symptom.name}
                    </Text>
                  </Pressable>
                ))}

                {/* Weight stepper for the pending attachment */}
                <View className="mt-2 flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-gray-700">Weight</Text>
                  <Stepper value={newWeight} onChange={setNewWeight} />
                </View>

                <View className="mt-3">
                  <Button
                    label="Attach Symptom"
                    loading={busy}
                    onPress={() => {
                      if (selectedSymptomId === null) return;
                      void (async () => {
                        try {
                          setBusy(true);
                          await adminApi.attachRule(token!, {
                            disease_id: disease.id,
                            symptom_id: selectedSymptomId,
                            weight: newWeight,
                          });
                          setSelectedSymptomId(null);
                          setShowSymptomPicker(false);
                          setNewWeight(3);
                          await load();
                        } catch (err) {
                          Alert.alert(
                            "Could not attach",
                            err instanceof ApiError ? err.message : "Please try again."
                          );
                        } finally {
                          setBusy(false);
                        }
                      })();
                    }}
                  />
                </View>
              </>
            )}
          </View>
        ) : null}

        {/* -------------------- RECOMMENDATIONS -------------------- */}
        <Text className="mb-2 mt-6 text-xs font-semibold uppercase tracking-widest text-brand-600">
          Linked care recommendations ({disease.recommendations.length})
        </Text>
        <View className="rounded-2xl border border-gray-200 bg-white">
          {disease.recommendations.length === 0 ? (
            <Text className="px-4 py-3 text-sm text-gray-500">
              None linked yet — results will show guidance only from the disease itself.
            </Text>
          ) : (
            disease.recommendations.map((rec, index) => (
              <View
                key={rec.id}
                className={`flex-row items-center px-4 py-3 ${
                  index === disease.recommendations.length - 1 ? "" : "border-b border-gray-100"
                }`}
              >
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-900">{rec.title}</Text>
                  <Text className="text-xs capitalize text-gray-500">{rec.category}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Detach ${rec.title}`}
                  disabled={busy}
                  onPress={() =>
                    confirmAction(
                      "Detach recommendation?",
                      `“${rec.title}” will no longer be linked to ${disease.name}.`,
                      () => adminApi.detachRecommendation(token!, disease.id, rec.id)
                    )
                  }
                >
                  <Ionicons name="trash-outline" size={18} color="#b3401f" />
                </Pressable>
              </View>
            ))
          )}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={openRecPicker}
          className="mt-3 flex-row items-center rounded-xl border border-dashed border-brand-500 bg-brand-50 px-4 py-3"
        >
          <Ionicons name={showRecPicker ? "close" : "add"} size={16} color="#276a43" />
          <Text className="ml-1.5 text-sm font-semibold text-brand-700">
            {showRecPicker ? "Cancel" : "Link a recommendation"}
          </Text>
        </Pressable>
        {showRecPicker ? (
          <View className="mt-2 rounded-2xl border border-gray-200 bg-white p-3">
            {availableRecs.length === 0 ? (
              <Text className="py-1 text-sm text-gray-500">
                {recommendations.length === 0
                  ? "Loading recommendations…"
                  : "All recommendations are already linked."}
              </Text>
            ) : (
              availableRecs.map((rec) => (
                <Pressable
                  key={rec.id}
                  accessibilityRole="button"
                  onPress={() =>
                    confirmAction(
                      "Link recommendation?",
                      `“${rec.title}” (${rec.category}) will appear with ${disease.name}.`,
                      async () => {
                        await adminApi.attachRecommendation(token!, disease.id, rec.id);
                        setShowRecPicker(false);
                      }
                    )
                  }
                  className="mb-1.5 rounded-xl border border-gray-200 px-3 py-2.5 active:bg-brand-50"
                >
                  <Text className="text-sm font-medium text-gray-900">{rec.title}</Text>
                  <Text className="text-xs capitalize text-gray-500">{rec.category}</Text>
                </Pressable>
              ))
            )}
          </View>
        ) : null}

        {/* Lifecycle */}
        <View className="mt-8">
          {disease.is_active ? (
            <Button
              label="Deactivate Disease"
              variant="danger"
              loading={busy}
              onPress={() =>
                confirmAction(
                  "Deactivate disease?",
                  `${disease.name} will disappear from owner-facing screens and future assessments. History keeps its snapshots; you can reactivate anytime.`,
                  () => adminApi.deactivateDisease(token!, disease.id)
                )
              }
            />
          ) : (
            <Button
              label="Reactivate Disease"
              loading={busy}
              onPress={() =>
                confirmAction(
                  "Reactivate disease?",
                  `${disease.name} will become selectable again for owners.`,
                  async () => {
                    await adminApi.updateDisease(token!, disease.id, {
                      is_active: true,
                    });
                  }
                )
              }
            />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

/** One rule row: name + weight stepper + remove. */
function RuleRow({
  rule,
  busy,
  isLast,
  onChangeWeight,
  onRemove,
}: {
  rule: { rule_id: number; symptom_name: string; weight: number };
  busy: boolean;
  isLast: boolean;
  onChangeWeight: (weight: number) => void;
  onRemove: () => void;
}) {
  return (
    <View
      className={`flex-row items-center px-4 py-3 ${isLast ? "" : "border-b border-gray-100"}`}
    >
      <Text className="flex-1 text-sm font-medium text-gray-900" numberOfLines={1}>
        {rule.symptom_name}
      </Text>
      {/* Weight stepper constrained to the backend's 1–5 range. */}
      <View className="flex-row items-center">
        <StepButton
          icon="remove"
          disabled={busy || rule.weight <= 1}
          onPress={() => onChangeWeight(rule.weight - 1)}
        />
        <Text className="w-7 text-center text-sm font-bold text-gray-900">
          {rule.weight}
        </Text>
        <StepButton
          icon="add"
          disabled={busy || rule.weight >= 5}
          onPress={() => onChangeWeight(rule.weight + 1)}
        />
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove rule for ${rule.symptom_name}`}
        disabled={busy}
        onPress={onRemove}
        className="ml-3"
      >
        <Ionicons name="trash-outline" size={17} color="#b3401f" />
      </Pressable>
    </View>
  );
}

function StepButton({
  icon,
  disabled,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      className={`h-7 w-7 items-center justify-center rounded-full border ${
        disabled ? "border-gray-200 opacity-40" : "border-brand-600"
      }`}
    >
      <Ionicons name={icon} size={13} color={disabled ? "#9ca3af" : "#276a43"} />
    </Pressable>
  );
}

/** Compact − value + control for choosing a pending rule weight (1–5). */
function Stepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <View className="flex-row items-center">
      <StepButton icon="remove" disabled={value <= 1} onPress={() => onChange(value - 1)} />
      <Text className="w-8 text-center text-base font-bold text-gray-900">
        {value}
      </Text>
      <StepButton icon="add" disabled={value >= 5} onPress={() => onChange(value + 1)} />
    </View>
  );
}

function InfoBlock({
  label,
  text,
  tone = "normal",
  last = false,
}: {
  label: string;
  text: string | null;
  tone?: "normal" | "alert";
  last?: boolean;
}) {
  if (!text?.trim()) return null;
  return (
    <View className={`py-3 ${last ? "" : "border-b border-gray-100"}`}>
      <Text
        className={`text-xs font-semibold uppercase tracking-wide ${
          tone === "alert" ? "text-alert" : "text-gray-400"
        }`}
      >
        {label}
      </Text>
      <Text className="mt-1 text-sm leading-5 text-gray-800">{text}</Text>
    </View>
  );
}
