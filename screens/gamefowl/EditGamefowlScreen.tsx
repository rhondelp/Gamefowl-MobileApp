/**
 * File: screens/gamefowl/EditGamefowlScreen.tsx
 *
 * Purpose:
 *   Edit-bird screen — the same shared GamefowlForm as Add, pre-filled
 *   from GET /gamefowls/{id}. On success it pops back to Details, which
 *   silently refetches on focus so the new values appear immediately.
 */
import React, { useEffect } from "react";
import { ActivityIndicator, Text, View } from "react-native";

import { Screen } from "../../components/ui/Screen";
import { ErrorState } from "../../components/ui/ErrorState";
import { GamefowlForm, type GamefowlFormValues } from "../../components/gamefowl/GamefowlForm";
import { showToast } from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";
import { useGamefowl } from "../../hooks/useGamefowl";
import * as gamefowlsApi from "../../services/api/gamefowls";
import type { GamefowlPayload } from "../../types/api";
import type { DashboardStackScreenProps } from "../../navigation/types";

type Props = DashboardStackScreenProps<"EditGamefowl">;

/** API resource -> editable string state for the shared form. */
function toFormValues(bird: NonNullable<ReturnType<typeof useGamefowl>["gamefowl"]>): GamefowlFormValues {
  return {
    name: bird.name,
    breed: bird.breed ?? "",
    date_of_birth: bird.date_of_birth ?? "",
    sex: bird.sex,
    color: bird.color ?? "",
    weight: bird.weight === null ? "" : String(bird.weight),
    date_acquired: bird.date_acquired ?? "",
    notes: bird.notes ?? "",
  };
}

export function EditGamefowlScreen({ route, navigation }: Props) {
  const { gamefowlId } = route.params;
  const { token } = useAuth();
  const { gamefowl, loading, error, load } = useGamefowl(gamefowlId);

  // One fetch on mount; no focus revalidation needed here (this screen is
  // always freshly entered and its own submit refreshes Details on pop).
  useEffect(() => {
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gamefowlId]);

  const handleSubmit = async (payload: GamefowlPayload) => {
    if (!token) return;
    await gamefowlsApi.update(token, gamefowlId, payload);
    showToast("Profile changes saved.");
    navigation.goBack();
  };

  if (loading && !gamefowl) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2e7d4f" />
          <Text className="mt-3 text-sm text-gray-500">Loading profile…</Text>
        </View>
      </Screen>
    );
  }

  if (error && !gamefowl) {
    return (
      <Screen>
        <ErrorState message={error} onRetry={() => void load()} />
      </Screen>
    );
  }

  return (
    <Screen scroll key={gamefowl?.id}>
      <View>
        <Text className="mb-6 text-center text-sm text-gray-500">
          Update {gamefowl?.name}&apos;s details below.
        </Text>

        {gamefowl ? (
          <GamefowlForm
            initialValues={toFormValues(gamefowl)}
            submitLabel="Save Changes"
            onSubmit={handleSubmit}
          />
        ) : null}
      </View>
    </Screen>
  );
}
