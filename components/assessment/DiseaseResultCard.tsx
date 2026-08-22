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
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { AssessmentResultItem, DiseaseInfo } from "../../types/api";
import { MatchScoreBadge } from "./MatchScoreBadge";
import { scoreTier, tierBarColor } from "./scoreTiers";

const SEVERITY_CHIP: Record<string, string> = {
  mild: "bg-green-100 text-green-700",
  moderate: "bg-amber-100 text-amber-700",
  severe: "bg-red-100 text-red-700",
  critical: "bg-alert text-white",
};

interface DiseaseResultCardProps {
  result: AssessmentResultItem;
  /** Knowledge-base content fetched separately (optional by design). */
  detail?: DiseaseInfo | null;
}

export function DiseaseResultCard({ result, detail = null }: DiseaseResultCardProps) {
  const [expanded, setExpanded] = useState(false);
  const tier = scoreTier(result.match_score);

  return (
    <View className="mb-3 rounded-2xl border border-gray-200 bg-white">
      {/* Vet warning sits ABOVE everything in the card — unmissable. */}
      {result.vet_warning_at_assessment ? (
        <View className="flex-row items-start rounded-t-2xl bg-red-50 px-4 py-2.5">
          <Ionicons name="warning" size={16} color="#b3401f" />
          <Text className="ml-2 flex-1 text-xs leading-4 font-medium text-alert">
            {result.vet_warning_at_assessment}
          </Text>
        </View>
      ) : null}

      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => setExpanded((prev) => !prev)}
        className="px-4 pt-3.5 pb-3"
      >
        <View className="flex-row items-center">
          <View className="h-7 w-7 items-center justify-center rounded-full bg-gray-100">
            <Text className="text-xs font-bold text-gray-600">#{result.rank}</Text>
          </View>
          <Text className="ml-2.5 flex-1 text-base font-semibold text-gray-900">
            {result.possible_disease.name}
          </Text>
          <MatchScoreBadge score={result.match_score} />
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color="#9ca3af"
            style={{ marginLeft: 8 }}
          />
        </View>

        {/* Score as a bar, not just a number (UX spec). */}
        <View className="mt-3 h-2 flex-row overflow-hidden rounded-full bg-gray-200">
          <View
            className="h-full rounded-full"
            style={{
              width: `${result.match_score}%`,
              backgroundColor: tierBarColor(tier),
            }}
          />
        </View>

        <View className="mt-2.5 flex-row items-center">
          <View
            className={`rounded-full px-2.5 py-1 ${
              SEVERITY_CHIP[result.severity_at_assessment] ?? "bg-gray-100"
            }`}
          >
            <Text
              className={`text-[10px] font-semibold uppercase tracking-wide ${
                result.severity_at_assessment === "critical" ? "text-white" : ""
              }`}
            >
              {result.severity_at_assessment} severity
            </Text>
          </View>
          <Text className="ml-auto text-xs text-gray-400">
            {expanded ? "Hide details" : "Why this?"}
          </Text>
        </View>
      </TouchableOpacity>

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
              <Text className="mt-3 text-sm font-semibold text-gray-900">
                Not reported ({result.missing_symptoms.length})
              </Text>
              <Text className="text-xs text-gray-500">
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
              <Text className="mt-3 text-sm font-semibold text-gray-900">What to do</Text>
              <Text className="mt-0.5 text-sm leading-5 text-gray-700">
                {detail.recommended_action}
              </Text>
            </>
          ) : null}
          {detail?.prevention_info ? (
            <>
              <Text className="mt-3 text-sm font-semibold text-gray-900">Prevention tips</Text>
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
