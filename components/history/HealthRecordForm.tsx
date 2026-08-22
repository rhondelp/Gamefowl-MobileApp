/**
 * File: components/history/HealthRecordForm.tsx
 *
 * Purpose:
 *   Shared form for manually logging a health record. Validation mirrors
 *   StoreHealthRecordRequest exactly:
 *     - type:        required enum (chip control enforces the four values)
 *     - title:       required, max 255
 *     - notes:       optional, max 5000
 *     - recorded_at: optional "YYYY-MM-DD", backdating allowed, future
 *                    dates rejected (backend: before_or_equal:today)
 *     - weight:      optional number 0–20; shown only for weight_check
 *                    entries (kept in payload null otherwise)
 *
 * Backend 422 field errors are mapped back onto the same inline slots.
 */
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { FormError } from "../ui/FormError";
import { ApiError } from "../../services/api/client";
import { todayDateString } from "../../utils/format";
import { validateHealthRecordForm } from "../../utils/validation";
import type {
  HealthRecordPayload,
  HealthRecordType,
} from "../../types/api";

const TYPE_OPTIONS: { value: HealthRecordType; label: string }[] = [
  { value: "vet_visit", label: "Vet visit" },
  { value: "weight_check", label: "Weight check" },
  { value: "vaccination", label: "Vaccination" },
  { value: "general_note", label: "General note" },
];

interface HealthRecordFormProps {
  onSubmit: (payload: HealthRecordPayload) => Promise<void>;
}

export function HealthRecordForm({ onSubmit }: HealthRecordFormProps) {
  const [type, setType] = useState<HealthRecordType>("general_note");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [weight, setWeight] = useState("");
  // Defaults to today; backdating allowed, future rejected client+server.
  const [recordedAt, setRecordedAt] = useState(todayDateString());

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  /** Client-side rules live in utils/validation.ts (unit-tested there). */
  const validate = (): boolean => {
    const errors = validateHealthRecordForm({
      type,
      title,
      notes,
      weight,
      recordedAt,
    });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!validate()) return;

    try {
      setSubmitting(true);
      await onSubmit({
        type,
        title: title.trim(),
        notes: notes.trim() || null,
        recorded_at: recordedAt.trim() || null,
        // Weight is semantically tied to weight checks at this scope.
        weight:
          type === "weight_check" && weight.trim() !== "" ? Number(weight) : null,
      });
      // Success handling (navigation) belongs to the screen.
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.message);
        if (error.fieldErrors) {
          const mapped: Record<string, string> = {};
          for (const [field, messages] of Object.entries(error.fieldErrors)) {
            mapped[field] = messages[0];
          }
          setFieldErrors(mapped);
        }
      } else {
        setFormError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <FormError message={formError} />

      {/* Type: chips instead of free text so only valid enum values exist. */}
      <View className="mb-4">
        <Text className="mb-1 text-sm font-medium text-gray-700">Record type *</Text>
        <View className="flex-row flex-wrap">
          {TYPE_OPTIONS.map((option) => {
            const selected = type === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => {
                  setType(option.value);
                  clearFieldError("type");
                }}
                className={`mr-2 mb-2 rounded-full border px-3.5 py-2 ${
                  selected ? "border-brand-600 bg-brand-600" : "border-gray-300 bg-white"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    selected ? "text-white" : "text-gray-700"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {fieldErrors.type ? (
          <Text className="mt-1 text-sm text-alert">{fieldErrors.type}</Text>
        ) : null}
      </View>

      <TextField
        label="Title *"
        value={title}
        onChangeText={(text) => {
          setTitle(text);
          clearFieldError("title");
        }}
        placeholder="e.g. Quarterly vet checkup"
        autoCapitalize="sentences"
        maxLength={255}
        error={fieldErrors.title ?? null}
      />

      {/* Weight surfaces only when it makes sense (nice-to-have per spec). */}
      {type === "weight_check" ? (
        <TextField
          label="Weight (kg)"
          value={weight}
          onChangeText={(text) => {
            setWeight(text);
            clearFieldError("weight");
          }}
          placeholder="e.g. 2.4"
          keyboardType="decimal-pad"
          error={fieldErrors.weight ?? null}
        />
      ) : null}

      <TextField
        label="Date of event"
        value={recordedAt}
        onChangeText={(text) => {
          setRecordedAt(text);
          clearFieldError("recorded_at");
        }}
        placeholder="YYYY-MM-DD"
        error={fieldErrors.recorded_at ?? null}
      />

      <TextField
        label="Notes"
        value={notes}
        onChangeText={(text) => {
          setNotes(text);
          clearFieldError("notes");
        }}
        placeholder="Diagnosis, treatment given, reminders…"
        multiline
        maxLength={5000}
        autoCapitalize="sentences"
        error={fieldErrors.notes ?? null}
      />

      <Button label="Save Record" onPress={handleSubmit} loading={submitting} />
    </View>
  );
}
