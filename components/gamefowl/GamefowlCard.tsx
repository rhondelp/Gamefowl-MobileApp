/**
 * File: components/gamefowl/GamefowlCard.tsx
 *
 * Purpose:
 *   The single card visual for one bird, reused by the Dashboard summary
 *   list and the My Gamefowl list so both screens look and behave the same.
 *   Shows identity (name/breed), quick vitals (age/sex), and an active or
 *   retired badge. Tap target = whole card.
 */
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { Gamefowl } from "../../types/api";
import { formatAge } from "../../utils/format";

interface GamefowlCardProps {
  gamefowl: Gamefowl;
  onPress: () => void;
}

export function GamefowlCard({ gamefowl, onPress }: GamefowlCardProps) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`View details for ${gamefowl.name}`}
      className="mb-3 rounded-2xl border border-gray-200 bg-white px-4 py-4 active:bg-brand-50"
      onPress={onPress}
    >
      <View className="flex-row items-center">
        {/* Monogram avatar keeps the list light — no image upload exists yet. */}
        <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-100">
          <Text className="text-base font-bold text-brand-700">
            {gamefowl.name.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View className="ml-3 flex-1">
          <View className="flex-row items-center">
            <Text className="flex-shrink text-base font-semibold text-gray-900" numberOfLines={1}>
              {gamefowl.name}
            </Text>
            {/* Retired birds stay visible in "show inactive" lists but read as such. */}
            {!gamefowl.is_active ? (
              <View className="ml-2 rounded-full bg-gray-100 px-2 py-0.5">
                <Text className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                  Inactive
                </Text>
              </View>
            ) : null}
          </View>
          <Text className="mt-0.5 text-sm text-gray-500" numberOfLines={1}>
            {gamefowl.breed?.trim() || "Breed not set"} · {formatAge(gamefowl.age)} ·{" "}
            {gamefowl.sex}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
      </View>
    </TouchableOpacity>
  );
}
