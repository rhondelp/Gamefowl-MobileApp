/**
 * File: components/assessment/DiseaseResultCard.tsx
 *
 * Purpose:
 *   One ranked possible-condition card on the Diagnostic Results screen
 *   (the fresh result and a Past Assessment both render through here).
 *   Collapsed: rank, disease name, visual match score, severity chip, and a
 *   vet-warning strip when the engine flagged one. Expanded: the plain-
 *   language "Why did the system suggest this?" explanation — matched
 *   symptoms (checkmarks) vs missing ones ("would score higher if also
 *   seen") — plus recommended action / prevention tips from the disease's
 *   knowledge-base entry (passed in pre-fetched; absent while loading or if
 *   that fetch failed).
 *
 *   Below that, "Recommended care": the care advice snapshotted onto this
 *   result at submission time (title, category tag, advice per entry). Open
 *   by default on the top-ranked card, collapsible on the rest. Nothing is
 *   fetched or invented here — an assessment saved before the snapshot
 *   existed says so instead.
 */
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type {
  AssessmentRecommendation,
  AssessmentResultItem,
  DiseaseInfo,
} from "../../types/api";
import { RadialScore } from "./RadialScore";
import { careCategoryIcon } from "./careCategories";
import { elevation } from "../ui/elevation";
import { isCriticalSeverity, palette, severityTone, tone } from "../ui/status";

interface DiseaseResultCardProps {
  result: AssessmentResultItem;
  /** Knowledge-base content fetched separately (optional by design). */
  detail?: DiseaseInfo | null;
}

export function DiseaseResultCard({ result, detail = null }: DiseaseResultCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Severity drives every color on this card — chip, ring, rank marker — so
  // one condition never reads as two different urgencies in one view.
  const severity = tone(severityTone(result.severity_at_assessment));
  const critical = isCriticalSeverity(result.severity_at_assessment);

  // The top-ranked result is the screen's headline — lifted higher rather
  // than outlined, so the card set stays borderless.
  const isTop = result.rank === 1;

  return (
    <View
      className="mb-4 overflow-hidden rounded-card bg-surface-card"
      style={isTop ? elevation.raised : elevation.card}
    >
      {/* Vet warning sits ABOVE everything in the card — unmissable. */}
      {result.vet_warning_at_assessment ? (
        <View
          className="flex-row items-start px-4 py-3"
          style={{ backgroundColor: tone("critical").soft }}
        >
          <Ionicons name="warning" size={16} color={tone("critical").solid} />
          <Text
            className="ml-2 flex-1 text-xs font-medium leading-4"
            style={{ color: tone("critical").text }}
          >
            {result.vet_warning_at_assessment}
          </Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${result.possible_disease.name}, ${result.match_score} percent match`}
        onPress={() => setExpanded((prev) => !prev)}
        className="px-5 pb-4 pt-5 active:bg-surface-muted"
      >
        <View className="flex-row items-center">
          <RadialScore
            score={result.match_score}
            severity={result.severity_at_assessment}
            delayMs={(result.rank - 1) * 120}
          />

          <View className="ml-4 flex-1">
            <Text className="text-xs font-semibold uppercase tracking-wider text-ink-tertiary">
              Rank {result.rank}
            </Text>
            <Text className="mt-0.5 text-base font-semibold text-ink-primary">
              {result.possible_disease.name}
            </Text>
            <View
              className="mt-2 self-start rounded-full px-2.5 py-1"
              style={{ backgroundColor: critical ? severity.solid : severity.soft }}
            >
              <Text
                className="text-xs font-semibold uppercase tracking-wide"
                style={{ color: critical ? "#ffffff" : severity.text }}
              >
                {result.severity_at_assessment} severity
              </Text>
            </View>
          </View>
        </View>

        {/* Accordion control — the chevron is the affordance, so it gets the
            whole row rather than sitting as grey hint text in a corner. */}
        <View className="mt-4 flex-row items-center border-t border-surface-line pt-3">
          <Text className="flex-1 text-sm font-medium text-ink-secondary">
            Why did the system suggest this?
          </Text>
          <View className="h-7 w-7 items-center justify-center rounded-full bg-surface-muted">
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={15}
              color="#5b655d"
            />
          </View>
        </View>
      </Pressable>

      {expanded ? (
        <View className="px-5 pb-5">
          {/* WHY: matched evidence first. */}
          <Text className="text-sm font-semibold text-ink-primary">
            Symptoms that match ({result.matched_symptoms.length})
          </Text>
          {result.matched_symptoms.map((name) => (
            <View key={name} className="mt-2 flex-row items-start">
              <Ionicons name="checkmark-circle" size={15} color={tone("healthy").solid} style={{ marginTop: 1 }} />
              <Text className="ml-2 flex-1 text-sm leading-5 text-ink-secondary">{name}</Text>
            </View>
          ))}

          {/* WHY NOT HIGHER: transparent missing-evidence list. */}
          {result.missing_symptoms.length > 0 ? (
            <>
              <Text className="mt-5 text-sm font-semibold text-ink-primary">
                Not reported ({result.missing_symptoms.length})
              </Text>
              <Text className="mt-1 text-xs leading-4 text-ink-tertiary">
                This condition would score higher if your bird also showed these:
              </Text>
              {result.missing_symptoms.map((name) => (
                <View key={name} className="mt-2 flex-row items-start">
                  <Ionicons name="remove-circle-outline" size={15} color={tone("neutral").solid} style={{ marginTop: 1 }} />
                  <Text className="ml-2 flex-1 text-sm leading-5 text-ink-tertiary">{name}</Text>
                </View>
              ))}
            </>
          ) : null}

          {/* Educational content from the knowledge base (enrichment fetch). */}
          {detail?.recommended_action ? (
            <>
              <Text className="mt-5 text-sm font-semibold text-ink-primary">What to do</Text>
              <Text className="mt-1 text-sm leading-5 text-ink-secondary">
                {detail.recommended_action}
              </Text>
            </>
          ) : null}
          {detail?.prevention_info ? (
            <>
              <Text className="mt-5 text-sm font-semibold text-ink-primary">Prevention tips</Text>
              <Text className="mt-1 text-sm leading-5 text-ink-secondary">
                {detail.prevention_info}
              </Text>
            </>
          ) : null}
        </View>
      ) : null}

      <RecommendedCare
        diseaseName={result.possible_disease.name}
        recommendations={result.recommendations}
        initiallyOpen={isTop}
      />
    </View>
  );
}

/**
 * The card's care-advice section. Its toggle row mirrors the "Why…" row
 * above (inset hairline, label, chevron) so the card reads as one stack of
 * sections.
 */
function RecommendedCare({
  diseaseName,
  recommendations,
  initiallyOpen,
}: {
  diseaseName: string;
  /** undefined only when talking to an older API that omits the field. */
  recommendations: AssessmentRecommendation[] | null | undefined;
  initiallyOpen: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);

  // Saved before care advice was snapshotted: say so rather than show
  // today's advice as if it had been recorded that day.
  if (recommendations == null) {
    return (
      <View className="px-5 pb-4">
        <View className="border-t border-surface-line pt-3">
          <Text className="text-sm font-medium text-ink-secondary">Recommended care</Text>
          <Text className="mt-1 text-xs leading-4 text-ink-tertiary">
            Care recommendations weren’t recorded with this assessment.
          </Text>
        </View>
      </View>
    );
  }

  // Recorded, but no advice was linked to this disease at the time.
  if (recommendations.length === 0) return null;

  const count = recommendations.length;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`Recommended care for ${diseaseName}, ${count} ${count === 1 ? "item" : "items"}`}
        onPress={() => setOpen((prev) => !prev)}
        className="px-5 pb-4 active:bg-surface-muted"
      >
        <View className="flex-row items-center border-t border-surface-line pt-3">
          <Text className="flex-1 text-sm font-medium text-ink-secondary">
            Recommended care ({count})
          </Text>
          <View className="h-7 w-7 items-center justify-center rounded-full bg-surface-muted">
            <Ionicons
              name={open ? "chevron-up" : "chevron-down"}
              size={15}
              color="#5b655d"
            />
          </View>
        </View>
      </Pressable>

      {open ? (
        <View className="px-5 pb-5">
          {recommendations.map((recommendation, index) => (
            <CareItem
              key={recommendation.id}
              recommendation={recommendation}
              isFirst={index === 0}
            />
          ))}
        </View>
      ) : null}
    </>
  );
}

/** One snapshotted recommendation: category icon, title, category tag, advice. */
function CareItem({
  recommendation,
  isFirst,
}: {
  recommendation: AssessmentRecommendation;
  isFirst: boolean;
}) {
  return (
    <View
      accessible
      accessibilityLabel={`${recommendation.category}: ${recommendation.title}. ${recommendation.content}`}
      className={`flex-row rounded-control bg-surface-muted px-3.5 py-3 ${isFirst ? "" : "mt-2"}`}
    >
      <View className="h-8 w-8 items-center justify-center rounded-full bg-surface-card">
        <Ionicons
          name={careCategoryIcon(recommendation.category)}
          size={16}
          color={palette.brand[600]}
        />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-sm font-semibold text-ink-primary">
          {recommendation.title}
        </Text>
        <View className="mt-1.5 self-start rounded-full bg-surface-card px-2.5 py-0.5">
          <Text className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            {recommendation.category}
          </Text>
        </View>
        <Text className="mt-2 text-sm leading-5 text-ink-secondary">
          {recommendation.content}
        </Text>
      </View>
    </View>
  );
}
