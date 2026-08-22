/**
 * File: screens/assessment/AssessmentResultScreen.tsx
 *
 * Purpose:
 *   Step 2 of the diagnostic flow — THE most important screen in the app.
 *   Shows one immutable assessment: ranked possible conditions with visual
 *   match scores, expandable plain-language explanations, educational care
 *   content, a persistent disclaimer, and a no-match state that still
 *   directs the owner to a veterinarian.
 *
 * Data strategy:
 *   1. GET /health-assessments/{id} loads the scored record (also used for
 *      any later revisit — same endpoint).
 *   2. Enrichment: assessment snapshots intentionally do NOT embed care
 *      advice, so each candidate disease's knowledge-base entry is fetched
 *      (GET /diseases/{id}, <=5 parallel calls) to power "What to do" /
 *      "Prevention tips". Per-disease failures degrade gracefully — the
 *      explanation lists never depend on it.
 */
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { ErrorState } from "../../components/ui/ErrorState";
import { EmptyState } from "../../components/ui/EmptyState";
import { DiseaseResultCard } from "../../components/assessment/DiseaseResultCard";
import {
  activityLabel,
  appetiteLabel,
  durationLabel,
} from "../../components/assessment/contextOptions";
import { useAuth } from "../../contexts/AuthContext";
import * as healthAssessmentsApi from "../../services/api/healthAssessments";
import * as diseasesApi from "../../services/api/diseases";
import { ApiError } from "../../services/api/client";
import type { DiseaseInfo, HealthAssessmentDetail } from "../../types/api";
import type { DashboardStackScreenProps } from "../../navigation/types";

type Props = DashboardStackScreenProps<"AssessmentResult">;

function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AssessmentResultScreen({ route, navigation }: Props) {
  const { assessmentId } = route.params;
  const { token } = useAuth();

  const [assessment, setAssessment] = useState<HealthAssessmentDetail | null>(null);
  /** Educational content per disease id; absent entries render without tips. */
  const [detailsById, setDetailsById] = useState<Record<number, DiseaseInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError(null);
      const data = await healthAssessmentsApi.show(token, assessmentId);
      setAssessment(data);

      // Enrichment is best-effort: explanations must survive its failure.
      const diseaseIds = [
        ...new Set(data.results.map((r) => r.possible_disease.id)),
      ];
      const settled = await Promise.allSettled(
        diseaseIds.map((id) => diseasesApi.show(token, id))
      );
      const map: Record<number, DiseaseInfo> = {};
      settled.forEach((outcome, index) => {
        if (outcome.status === "fulfilled") map[diseaseIds[index]] = outcome.value;
      });
      setDetailsById(map);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, assessmentId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !assessment) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2e7d4f" />
          <Text className="mt-3 text-sm text-gray-500">Loading results…</Text>
        </View>
      </Screen>
    );
  }

  if (error && !assessment) {
    return (
      <Screen>
        <View className="flex-1 justify-center">
          <ErrorState message={error} onRetry={() => void load()} />
        </View>
      </Screen>
    );
  }

  if (!assessment) return null;

  const hasVetWarning = assessment.results.some(
    (r) => r.vet_warning_at_assessment !== null
  );

  return (
    <Screen>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Escalation banner: shown BEFORE anything else when warranted. */}
        {hasVetWarning ? (
          <View className="mt-2 rounded-2xl border border-red-300 bg-red-50 px-4 py-3">
            <View className="flex-row items-center">
              <Ionicons name="medkit" size={18} color="#b3401f" />
              <Text className="ml-2 text-sm font-bold text-alert">
                Veterinary attention advised
              </Text>
            </View>
            <Text className="mt-1 text-xs leading-4 text-alert">
              One or more findings below carry an official warning. Consult a
              licensed veterinarian promptly.
            </Text>
          </View>
        ) : null}

        {/* Submission summary */}
        <View className="mt-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-gray-900">
              Symptoms you reported ({assessment.submitted_symptoms.length})
            </Text>
            <Text className="text-xs text-gray-400">
              {formatTimestamp(assessment.created_at)}
            </Text>
          </View>
          <View className="mt-2 flex-row flex-wrap">
            {assessment.submitted_symptoms.map((symptom) => (
              <View
                key={symptom.id}
                className="mb-1.5 mr-1.5 rounded-full bg-brand-50 px-2.5 py-1"
              >
                <Text className="text-xs font-medium text-brand-700">
                  {symptom.name}
                </Text>
              </View>
            ))}
          </View>

          {/* Snapshot context lines — only what was actually captured. */}
          {(assessment.age_at_assessment ||
            assessment.sex_at_assessment ||
            assessment.duration_of_symptoms ||
            assessment.appetite ||
            assessment.activity_level) ? (
            <>
              <View className="mt-2 border-t border-gray-100 pt-2" />
              <Text className="text-xs leading-5 text-gray-500">
                {[
                  assessment.age_at_assessment ? `Age: ${assessment.age_at_assessment}` : null,
                  assessment.sex_at_assessment ? `Sex: ${assessment.sex_at_assessment}` : null,
                  assessment.duration_of_symptoms
                    ? `Duration: ${durationLabel(assessment.duration_of_symptoms)}`
                    : null,
                  assessment.appetite ? `Appetite: ${appetiteLabel(assessment.appetite)}` : null,
                  assessment.activity_level
                    ? `Activity: ${activityLabel(assessment.activity_level)}`
                    : null,
                ]
                  .filter(Boolean)
                  .join("  ·  ")}
              </Text>
            </>
          ) : null}
          {assessment.additional_notes ? (
            <Text className="mt-1.5 text-xs italic leading-4 text-gray-500">
              Notes: “{assessment.additional_notes}”
            </Text>
          ) : null}
        </View>

        {/* Ranked possible conditions */}
        {assessment.results.length === 0 ? (
          <View className="mt-4">
            <EmptyState
              icon="search-outline"
              title="No strong match found"
              message="The reported symptoms did not clearly match a known condition. Keep monitoring your bird, and consult a licensed veterinarian directly if signs persist or worsen."
            />
          </View>
        ) : (
          <>
            <Text className="mb-2 mt-5 text-xs font-semibold uppercase tracking-widest text-brand-600">
              Possible conditions · best match first
            </Text>
            {assessment.results.map((result) => (
              <DiseaseResultCard
                key={result.rank}
                result={result}
                detail={detailsById[result.possible_disease.id]}
              />
            ))}
          </>
        )}

        {/* Unmissable disclaimer — always rendered, exact backend wording. */}
        <View className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3.5">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={18} color="#b45309" style={{ marginTop: 1 }} />
            <View className="ml-2 flex-1">
              <Text className="text-sm font-bold text-amber-800">Important reminder</Text>
              <Text className="mt-1 text-xs leading-4 text-amber-800">
                {assessment.disclaimer}
              </Text>
            </View>
          </View>
        </View>

        {/* Return path to the bird's Details screen. */}
        <View className="mt-4">
          <Button label="Back to Bird Profile" variant="outline" onPress={() => navigation.goBack()} />
        </View>
      </ScrollView>
    </Screen>
  );
}
