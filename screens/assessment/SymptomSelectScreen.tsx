/**
 * File: screens/assessment/SymptomSelectScreen.tsx
 *
 * Purpose:
 *   Step 1 of the diagnostic flow: the owner ticks every sign their bird is
 *   showing, adds optional context (duration / appetite / activity / notes),
 *   and submits. Backend scores it, persists an immutable assessment, and
 *   returns ranked results — we then replace this screen with the Results.
 *
 * UX rules honored:
 *   - Symptoms grouped by category (backend pre-groups), searchable filter
 *     for quick scanning; severity dot per item.
 *   - Context enums use chips (never free text) so only backend-valid
 *     values can be submitted. Age/sex are NOT collected: the server
 *     snapshots them from the bird's profile automatically.
 *   - Continue stays disabled with a visible reason until >= 1 symptom.
 *   - Submission shows a processing overlay (scoring + persistence take a
 *     moment) — never a frozen UI.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { tone } from "../../components/ui/status";

import { Screen } from "../../components/ui/Screen";
import { ErrorState } from "../../components/ui/ErrorState";
import { ChipGroup } from "../../components/ui/ChipGroup";
import { elevation } from "../../components/ui/elevation";
import { notifyError, tapSelection } from "../../components/ui/haptics";
import { Button } from "../../components/ui/Button";
import { EntranceView } from "../../components/ui/EntranceView";
import { SymptomSelectItem } from "../../components/assessment/SymptomSelectItem";
import {
  ACTIVITY_OPTIONS,
  APPETITE_OPTIONS,
  DURATION_OPTIONS,
} from "../../components/assessment/contextOptions";
import { useAuth } from "../../contexts/AuthContext";
import * as symptomsApi from "../../services/api/symptoms";
import * as healthAssessmentsApi from "../../services/api/healthAssessments";
import { ApiError } from "../../services/api/client";
import type {
  AssessmentActivity,
  AssessmentAppetite,
  AssessmentDuration,
  Symptom,
} from "../../types/api";
import type { DashboardStackScreenProps } from "../../navigation/types";

type Props = DashboardStackScreenProps<"SymptomSelect">;

export function SymptomSelectScreen({ route, navigation }: Props) {
  const { gamefowlId, birdName } = route.params;
  const { token } = useAuth();

  // Symptom checklist data
  const [groups, setGroups] = useState<Record<string, Symptom[]> | null>(null);
  const [loadingSymptoms, setLoadingSymptoms] = useState(true);
  const [symptomsError, setSymptomsError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Selection + optional context
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [duration, setDuration] = useState<AssessmentDuration | null>(null);
  const [appetite, setAppetite] = useState<AssessmentAppetite | null>(null);
  const [activity, setActivity] = useState<AssessmentActivity | null>(null);
  const [notes, setNotes] = useState("");

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  /** Flat list derived once groups arrive; keeps filtering simple. */
  const symptoms = useMemo(() => Object.values(groups ?? {}).flat(), [groups]);

  const loadSymptoms = useCallback(async () => {
    if (!token) return;
    try {
      setLoadingSymptoms(true);
      setSymptomsError(null);
      const data = await symptomsApi.listGrouped(token);
      setGroups(data.groups ?? {});
    } catch (err) {
      setSymptomsError(
        err instanceof ApiError
          ? err.message
          : "Could not load the symptom list. Please try again."
      );
    } finally {
      setLoadingSymptoms(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    void loadSymptoms();
  }, [loadSymptoms]);

  /** Search narrows each category independently; empty groups are hidden. */
  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    const needle = search.trim().toLowerCase();
    return Object.entries(groups)
      .map(([category, items]) => ({
        category,
        items: needle
          ? items.filter((s) => s.name.toLowerCase().includes(needle))
          : items,
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, search]);

  const toggleSymptom = useCallback((id: number) => {
    void tapSelection();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setFormError(null);
  }, []);

  /**
   * Client-side guard mirrors the backend's `min:1` rule — but the reason
   * is always VISIBLE on the button area, never a silent dead button.
   */
  const canSubmit = selected.size > 0 && !submitting;

  const handleSubmit = async () => {
    if (!token || selected.size === 0) return;
    try {
      setSubmitting(true);
      setFormError(null);
      const data = await healthAssessmentsApi.submit(token, gamefowlId, {
        symptom_ids: [...selected],
        duration_of_symptoms: duration,
        appetite,
        activity_level: activity,
        additional_notes: notes.trim() || null,
      });
      // Replace so Back from Results skips this finished form and lands on
      // the bird's Details screen.
      navigation.replace("AssessmentResult", { assessmentId: data.id });
    } catch (err) {
      setSubmitting(false);
      void notifyError();
      if (err instanceof ApiError) {
        // Surface backend validation clearly — e.g. an inactive symptom ID
        // somehow submitted must name that problem, not fail generically.
        const firstFieldMessage = err.fieldErrors
          ? Object.values(err.fieldErrors).flat()[0]
          : undefined;
        setFormError(firstFieldMessage ?? err.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    }
  };

  if (loadingSymptoms) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2e7d4f" />
          <Text className="mt-3 text-sm text-ink-tertiary">Loading symptom checklist…</Text>
        </View>
      </Screen>
    );
  }

  if (symptomsError) {
    return (
      <Screen>
        <View className="flex-1 justify-center">
          <ErrorState message={symptomsError} onRetry={() => void loadSymptoms()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {/* Processing overlay while scoring/persisting runs. */}
      <Modal transparent visible={submitting} animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/50 px-8">
          <View className="w-full items-center rounded-card bg-surface-card px-6 py-7" style={elevation.overlay}>
            <View className="h-16 w-16 items-center justify-center rounded-full bg-brand-50">
              <ActivityIndicator size="large" color="#2e7d4f" />
            </View>
            <Text className="mt-4 text-center text-base font-semibold text-ink-primary">
              Analyzing symptoms…
            </Text>
            <Text className="mt-1 text-center text-sm leading-5 text-ink-tertiary">
              Scoring possible conditions against our knowledge base.
            </Text>
          </View>
        </View>
      </Modal>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Who is being assessed */}
        <View className="mt-1 mb-4">
          <Text className="text-lg font-bold text-ink-primary">
            What signs is your bird showing?
          </Text>
          {birdName ? (
            <Text className="mt-0.5 text-sm text-ink-tertiary">
              Assessing <Text className="font-semibold">{birdName}</Text>. Tick all that apply.
            </Text>
          ) : (
            <Text className="mt-0.5 text-sm text-ink-tertiary">Tick all that apply.</Text>
          )}
        </View>

        {/* Search/filter */}
        <View className="mb-4 h-12 flex-row items-center rounded-control border-2 border-gray-300 bg-surface-card px-3.5">
          <Ionicons name="search" size={17} color="#6b7280" />
          <TextInput
            className="ml-2 flex-1 text-base text-ink-primary"
            placeholder="Search symptoms…"
            placeholderTextColor="#9ca3af"
            accessibilityLabel="Search symptoms"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={12}
              onPress={() => setSearch("")}
              style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
            >
              <Ionicons name="close-circle" size={19} color="#9ca3af" />
            </Pressable>
          ) : null}
        </View>

        {filteredGroups.length === 0 ? (
          <Text className="py-6 text-center text-sm text-ink-tertiary">
            No symptoms match “{search.trim()}”.
          </Text>
        ) : (
          filteredGroups.map(({ category, items }) => (
            <View key={category} className="mb-5">
              <Text className="mb-2 text-xs font-semibold uppercase tracking-widest text-brand-600">
                {category}
              </Text>
              {items.map((symptom, index) => (
                <EntranceView key={symptom.id} index={index}>
                  <SymptomSelectItem
                    symptom={symptom}
                    selected={selected.has(symptom.id)}
                    onToggle={toggleSymptom}
                  />
                </EntranceView>
              ))}
            </View>
          ))
        )}

        {/* Optional context — enum chips only, everything skippable. */}
        <Text className="mb-3 text-xs font-semibold uppercase tracking-widest text-brand-600">
          Extra context (optional)
        </Text>
        <ChipGroup
          label="How long have symptoms been present?"
          hint="(optional)"
          options={DURATION_OPTIONS}
          value={duration}
          onChange={setDuration}
        />
        <ChipGroup
          label="Appetite when observed"
          hint="(optional)"
          options={APPETITE_OPTIONS}
          value={appetite}
          onChange={setAppetite}
        />
        <ChipGroup
          label="Activity level when observed"
          hint="(optional)"
          options={ACTIVITY_OPTIONS}
          value={activity}
          onChange={setActivity}
        />

        <View className="mb-2">
          <Text className="mb-1 text-sm font-medium text-ink-secondary">
            Additional notes{" "}
            <Text className="text-xs font-normal text-ink-tertiary">(optional)</Text>
          </Text>
          <TextInput
            className="rounded-control border-2 border-gray-300 bg-surface-card px-4 py-3 text-base text-ink-primary"
            accessibilityLabel="Additional notes"
            style={{ minHeight: 88, textAlignVertical: "top" }}
            placeholder="Anything else the vet-facing record should say…"
            placeholderTextColor="#9ca3af"
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={2000}
            autoCapitalize="sentences"
          />
        </View>
      </ScrollView>

      {/* Sticky action bar */}
      <View className="border-t border-gray-200 bg-surface-card px-1 pb-1 pt-3">
        {formError ? (
          <View
            accessibilityRole="alert"
            className="mb-2 flex-row items-center rounded-control px-3 py-2"
            style={{ backgroundColor: tone("critical").soft }}
          >
            <Ionicons name="alert-circle" size={16} color="#b3401f" />
            <Text
              className="ml-1.5 flex-1 text-sm"
              style={{ color: tone("critical").text }}
            >
              {formError}
            </Text>
          </View>
        ) : null}
        {!canSubmit && !formError ? (
          <Text className="mb-2 text-center text-sm text-ink-tertiary">
            Select at least one symptom to continue.
          </Text>
        ) : (
          <Text className="mb-2 text-center text-sm font-medium text-brand-700">
            {selected.size} {selected.size === 1 ? "symptom" : "symptoms"} selected
          </Text>
        )}
        <View pointerEvents={canSubmit ? "auto" : "none"} className={canSubmit ? "" : "opacity-40"}>
          <Button
            label="Run Health Assessment"
            onPress={() => void handleSubmit()}
            loading={submitting}
          />
        </View>
      </View>
    </Screen>
  );
}
