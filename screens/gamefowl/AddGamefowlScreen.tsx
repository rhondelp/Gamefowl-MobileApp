/**
 * File: screens/gamefowl/AddGamefowlScreen.tsx
 *
 * Purpose:
 *   Create-bird screen — a thin shell around the shared GamefowlForm.
 *   On success it REPLACES itself with the new bird's Details screen, so
 *   Android hardware-back from Details lands on Dashboard instead of an
 *   already-submitted form.
 *
 *   Validation lives inside GamefowlForm (mirrors backend rules); backend
 *   422 field errors render inline on the same fields.
 */
import React from "react";
import { Text, View } from "react-native";

import { Screen } from "../../components/ui/Screen";
import { GamefowlForm } from "../../components/gamefowl/GamefowlForm";
import { showToast } from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";
import * as gamefowlsApi from "../../services/api/gamefowls";
import type { GamefowlPayload } from "../../types/api";
import type { DashboardStackScreenProps } from "../../navigation/types";

type Props = DashboardStackScreenProps<"AddGamefowl">;

export function AddGamefowlScreen({ navigation }: Props) {
  const { token } = useAuth();

  const handleSubmit = async (payload: GamefowlPayload) => {
    if (!token) return;
    const data = await gamefowlsApi.create(token, payload);
    showToast(`${data.gamefowl.name} added to your flock.`);
    // Replace so Back skips the finished Add form.
    navigation.replace("GamefowlDetails", { gamefowlId: data.gamefowl.id });
  };

  return (
    <Screen scroll>
      <View>
        <Text className="mb-6 text-center text-sm text-gray-500">
          Only a name is required — you can fill in the rest anytime.
        </Text>

        <GamefowlForm submitLabel="Add Gamefowl" onSubmit={handleSubmit} />
      </View>
    </Screen>
  );
}
