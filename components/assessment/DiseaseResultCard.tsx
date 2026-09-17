/**
 * File: components/assessment/DiseaseResultCard.tsx
 *
 * Purpose:
 *   One ranked possible-condition card on the Diagnostic Results screen.
 *   Collapsed: rank, disease name, visual match score, severity chip, and a
 *   vet-warning strip when the engine flagged one. Expanded: the plain-
 *   language "Why did the system suggest this?" explanation — matched
 *   symptoms (checkmarks) vs missing ones ("would score higher if also
 *   seen") — plus recommended action / prevention tips from the disease's
 *   knowledge-base entry (passed in pre-fetched; absent while loading or if
 *   that fetch failed).
 */
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { AssessmentResultItem, DiseaseInfo } from "../../types/api";
import { MatchScoreBadge } from "./MatchScoreBadge";
import { scoreTier } from "./scoreTiers";
import { AnimatedScoreBar } from "./AnimatedScoreBar";
import { elevation } from "../ui/elevation";

// Chip background and label color are kept as separate classes: React Native
// does not inherit text color across a View boundary, so a combined
// "bg-x text-y" string would silently drop the label color.
const SEVERITY_CHIP: Record<string, { chip: string; text: string }> = {
  mild: { chip: "bg-green-100", text: "text-green-800" },
  moderate: { chip: "bg-amber-100", text: "text-amber-800" },
  severe: { chip: "bg-red-100", text: "text-red-800" },
  critical: { chip: "bg-alert", text: "text-white" },
};

interface DiseaseResultCardProps {
  result: AssessmentResultItem;
  /** Knowledge-base content fetched separately (optional by design). */
  detail?: DiseaseInfo | null;
}

export function DiseaseResultCard({ result, detail = null }: DiseaseResultCardProps) {
  const [expanded, setExpanded] = useState(false);
  const tier = scoreTier(result.match_score);

  const severity = SEVERITY_CHIP[result.severity_at_assessment] ?? {
    chip: "bg-gray-100",
    text: "text-gray-700",
  };

  // The top-ranked result is the screen's headline — give it a brand ring so
  // it outranks the cards below it visually, not just by position.
  const isTop = result.rank === 1;

  return (
    <View
      className={`mb-3 overflow-hidden rounded-2xl bg-white ${
        isTop ? "border-2 border-brand-600" : "border border-gray-100"
      }`}
      style={isTop ? elevation.raised : elevation.card}
    >
      {/* Vet warning sits ABOVE everything in the card — unmissable. */}
      {result.vet_warning_at_assessment ? (
        <View className="flex-row items-start border-b border-red-200 bg-red-50 px-4 py-2.5">
          <Ionicons name="warning" size={16} color="#b3401f" />
          <Text className="ml-2 flex-1 text-xs font-medium leading-4 text-alert">
            {result.vet_warning_at_assessment}
          </Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${result.possible_disease.name}, ${result.match_score} percent match`}
        onPress={() => setExpanded((prev) => !prev)}
        className="px-4 pb-3 pt-3.5 active:bg-gray-50"
      >
        <View className="flex-row items-center">
          <View
            className={`h-7 w-7 items-center justify-center rounded-full ${
              isTop ? "bg-brand-600" : "bg-gray-100"
            }`}
          >
            <Text
              className={`text-xs font-bold ${isTop ? "text-white" : "text-gray-600"}`}
            >
              {result.rank}
            </Text>
          </View>
          <Text className="ml-2.5 flex-1 text-base font-semibold text-gray-900">
            {result.possible_disease.name}
          </Text>
          <MatchScoreBadge score={result.match_score} />
        </View>

        {/* Score as an animated bar, not just a number (UX spec). */}
        <View className="mt-3">
          <AnimatedScoreBar score={result.match_score} tier={tier} delayMs={(result.rank - 1) * 120} />
        </View>

        <View className="mt-2.5 flex-row items-center">
          <View className={`rounded-full px-2.5 py-1 ${severity.chip}`}>
            <Text
              className={`text-[10px] font-semibold uppercase tracking-wide ${severity.text}`}
            >
              {result.severity_at_assessment} severity
            </Text>
          </View>
          {/* Reads as the affordance it is, rather than grey hint text. */}
          <View className="ml-auto flex-row items-center">
            <Text className="text-xs font-semibold text-brand-700">
              {expanded ? "Hide details" : "Why this?"}
            </Text>
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={13}
              color="#215838"
              style={{ marginLeft: 2 }}
            />
          </View>
        </View>
      </Pressable>

      {expanded ? (
        <View className="border-t border-gray-100 px-4 pb-4 pt-3">
          {/* WHY: matched evidence first. */}
          <Text className="text-sm font-semibold text-gray-900">
            Symptoms that match ({result.matched_symptoms.length})
          </Text>
          {result.matched_symptoms.map((name) => (
            <View key={name} className="mt-1.5 flex-row items-start">
              <Ionicons name="checkmark-circle" size={15} color="#276a43" style={{ marginTop: 1 }} />
              <Text className="ml-1.5 flex-1 text-sm leading-5 text-gray-700">{name}</Text>
            </View>
          ))}

          {/* WHY NOT HIGHER: transparent missing-evidence list. */}
          {result.missing_symptoms.length > 0 ? (
            <>
              <Text className="mt-4 text-sm font-semibold text-gray-900">
                Not reported ({result.missing_symptoms.length})
              </Text>
              <Text className="mt-0.5 text-xs leading-4 text-gray-500">
                This condition would score higher if your bird also showed these:
              </Text>
              {result.missing_symptoms.map((name) => (
                <View key={name} className="mt-1.5 flex-row items-start">
                  <Ionicons name="remove-circle-outline" size={15} color="#9ca3af" style={{ marginTop: 1 }} />
                  <Text className="ml-1.5 flex-1 text-sm leading-5 text-gray-500">{name}</Text>
                </View>
              ))}
            </>
          ) : null}

          {/* Educational content from the knowledge base (enrichment fetch). */}
          {detail?.recommended_action ? (
            <>
              <Text className="mt-4 text-sm font-semibold text-gray-900">What to do</Text>
              <Text className="mt-0.5 text-sm leading-5 text-gray-700">
                {detail.recommended_action}
              </Text>
            </>
          ) : null}
          {detail?.prevention_info ? (
            <>
              <Text className="mt-4 text-sm font-semibold text-gray-900">Prevention tips</Text>
              <Text className="mt-0.5 text-sm leading-5 text-gray-700">
                {detail.prevention_info}
              </Text>
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
