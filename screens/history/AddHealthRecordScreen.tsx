/**
 * File: screens/history/AddHealthRecordScreen.tsx
 *
 * Purpose:
 *   Log a manual health record (vet visit / weight check / vaccination /
 *   general note) for one bird. Thin shell around the shared
 *   HealthRecordForm; on success it pops back — Details refreshes its
 *   status card on focus and the History timeline revalidates too.
 */
import React from "react";
import { Text, View } from "react-native";

import { Screen } from "../../components/ui/Screen";
import { HealthRecordForm } from "../../components/history/HealthRecordForm";
import { showToast } from "../../components/ui/Toast";
import { useAuth } from "../../contexts/AuthContext";
import * as healthHistoryApi from "../../services/api/healthHistory";
import type { HealthRecordPayload } from "../../types/api";
import type { DashboardStackScreenProps } from "../../navigation/types";

type Props = DashboardStackScreenProps<"AddHealthRecord">;

export function AddHealthRecordScreen({ route, navigation }: Props) {
  const { gamefowlId, birdName } = route.params;
  const { token } = useAuth();

  const handleSubmit = async (payload: HealthRecordPayload) => {
    if (!token) return;
    await healthHistoryApi.addRecord(token, gamefowlId, payload);
    showToast("Health record logged.");
    // Back to Details: its focus refetch shows the new latest record, and
    // the timeline picks the entry up on its own next focus.
    navigation.goBack();
  };

  return (
    <Screen scroll>
      <View>
        <Text className="mb-6 text-center text-sm text-gray-500">
          {birdName ? `A manual entry for ${birdName}.` : "A manual logbook entry."}{" "}
          Past events can be backdated.
        </Text>

        <HealthRecordForm onSubmit={handleSubmit} />
      </View>
    </Screen>
  );
}
