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
 *      any later revisit — same endpoint). Each result carries its own
 *      care-recommendation snapshot, which DiseaseResultCard renders as
 *      "Recommended care" with no extra request.
 *   2. Enrichment: the snapshots do NOT embed a disease's recommended action
 *      or prevention text, so each candidate disease's knowledge-base entry
 *      is fetched (GET /diseases/{id}, <=5 parallel calls) to power "What to
 *      do" / "Prevention tips". Per-disease failures degrade gracefully —
 *      the explanation lists and recommended care never depend on it.
 */
import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "../../components/ui/Screen";
import { Button } from "../../components/ui/Button";
import { ErrorState } from "../../components/ui/ErrorState";
import { EmptyState } from "../../components/ui/EmptyState";
import { elevation } from "../../components/ui/elevation";
import { Skeleton } from "../../components/ui/Skeleton";
import { tone } from "../../components/ui/status";
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
  const { assessmentId, historical = false } = route.params;
  const { token } = useAuth();

  // Historical framing (opened from the M12 timeline): retitle and mark the
  // record as frozen history instead of a fresh live result.
  React.useEffect(() => {
    if (historical) {
      navigation.setOptions({ title: "Past Assessment" });
    }
  }, [historical, navigation]);

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
        {/* Shaped like the real results: summary card, then ranked cards. */}
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel="Scoring your results"
          accessibilityState={{ busy: true }}
        >
          <View
            className="mt-3 rounded-card bg-surface-card px-4 py-3.5"
            style={elevation.card}
          >
            <Skeleton width="60%" height={13} />
            <View className="flex-row mt-3">
              <Skeleton width={72} height={22} radius={11} style={{ marginRight: 6 }} />
              <Skeleton width={88} height={22} radius={11} style={{ marginRight: 6 }} />
              <Skeleton width={64} height={22} radius={11} />
            </View>
          </View>

          {[0, 1, 2].map((i) => (
            <View
              key={i}
              className="px-5 pt-5 pb-4 mt-4 rounded-card bg-surface-card"
              style={elevation.card}
            >
              <View className="flex-row items-center">
                {/* Matches the RadialScore ring. */}
                <Skeleton width={72} height={72} radius={36} />
                <View className="flex-1 ml-4">
                  <Skeleton width="30%" height={10} />
                  <Skeleton width="70%" height={15} style={{ marginTop: 8 }} />
                  <Skeleton width={110} height={22} radius={11} style={{ marginTop: 10 }} />
                </View>
              </View>
              <Skeleton width="55%" height={13} style={{ marginTop: 20 }} />
            </View>
          ))}

          <Text className="mt-5 text-sm font-medium text-center text-ink-tertiary">
            Scoring possible conditions…
          </Text>
        </View>
      </Screen>
    );
  }

  if (error && !assessment) {
    return (
      <Screen>
        <View className="justify-center flex-1">
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
        {/* Historical framing: this is a frozen record, not a fresh run. */}
        {historical && assessment.created_at ? (
          <View className="px-4 py-3 mt-2 border rounded-card border-brand-100 bg-brand-50">
            <View className="flex-row items-start">
              <Ionicons name="archive" size={16} color="#215838" style={{ marginTop: 2 }} />
              <Text className="flex-1 ml-2 text-xs leading-5 text-brand-700">
                Saved assessment from {formatTimestamp(assessment.created_at)} —
                shown exactly as reported at the time. Later knowledge-base
                changes never alter past records.
              </Text>
            </View>
          </View>
        ) : null}

        {/* Escalation banner: shown BEFORE anything else when warranted. */}
        {hasVetWarning ? (
          // Escalation outranks everything else on the screen, so it is the
          // only element here carrying a solid fill and raised depth.
          <View
            className="px-5 py-4 mt-2 rounded-card"
            style={[elevation.raised, { backgroundColor: tone("critical").soft }]}
            accessibilityRole="alert"
          >
            <View className="flex-row items-center">
              <View
                className="items-center justify-center w-10 h-10 rounded-full"
                style={{ backgroundColor: tone("critical").solid }}
              >
                <Ionicons name="medkit" size={20} color="#ffffff" />
              </View>
              <Text
                className="flex-1 ml-3 text-base font-bold"
                style={{ color: tone("critical").text }}
              >
                Veterinary attention advised
              </Text>
            </View>
            <Text
              className="mt-3 text-sm leading-5"
              style={{ color: tone("critical").text }}
            >
              One or more findings below carry an official warning. Consult a
              licensed veterinarian promptly.
            </Text>
          </View>
        ) : null}

        {/* Submission summary */}
        <View
          className="mt-3 rounded-card bg-surface-card px-4 py-3.5"
          style={elevation.card}
        >
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 text-sm font-semibold text-ink-primary">
              Symptoms you reported ({assessment.submitted_symptoms.length})
            </Text>
            <Text className="ml-2 text-xs text-ink-tertiary">
              {formatTimestamp(assessment.created_at)}
            </Text>
          </View>
          <View className="flex-row flex-wrap mt-2">
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
              <View className="pt-2 mt-2 border-t border-gray-100" />
              <Text className="text-xs leading-5 text-ink-tertiary">
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
            <Text className="mt-1.5 text-xs italic leading-4 text-ink-tertiary">
              Notes: “{assessment.additional_notes}”
            </Text>
          ) : null}
        </View>

        {/* Ranked possible conditions */}
        {assessment.results.length === 0 ? (
          <View className="mt-4">
            <EmptyState
              variant="search"
              title="No strong match found"
              message="The reported symptoms did not clearly match a known condition. Keep monitoring your bird, and consult a licensed veterinarian directly if signs persist or worsen."
            />
          </View>
        ) : (
          <>
            <Text className="mt-5 mb-2 text-xs font-semibold tracking-widest uppercase text-brand-600">
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
        <View
          className="px-5 py-4 mt-5 rounded-card"
          style={{ backgroundColor: tone("attention").soft }}
        >
          <View className="flex-row items-start">
            <Ionicons
              name="information-circle"
              size={18}
              color={tone("attention").solid}
              style={{ marginTop: 1 }}
            />
            <View className="ml-2.5 flex-1">
              <Text
                className="text-sm font-bold"
                style={{ color: tone("attention").text }}
              >
                Important reminder
              </Text>
              <Text
                className="mt-1 text-xs leading-5"
                style={{ color: tone("attention").text }}
              >
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
