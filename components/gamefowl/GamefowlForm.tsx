/**
 * File: components/gamefowl/GamefowlForm.tsx
 *
 * Purpose:
 *   ONE form for creating and editing a gamefowl profile — Add and Edit
 *   screens render this with different props instead of duplicating fields.
 *
 * Validation strategy mirrors the backend's Store/UpdateGamefowlRequest
 * exactly so users get the same feedback offline that Laravel would give:
 *   - name:      required, max 255
 *   - breed/color: optional, max 100
 *   - dates:     optional "YYYY-MM-DD", not in the future
 *   - sex:       one of male/female/unknown (chip control enforces this)
 *   - weight:    optional number 0–20 kg (backend bounds catch typos)
 *   - notes:     optional, max 2000
 *
 * Errors from the API arrive as ApiError and are mapped back onto the same
 * per-field display slots, so client- and server-side messages look alike.
 */
import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { TextField } from "../ui/TextField";
import { Button } from "../ui/Button";
import { FormError } from "../ui/FormError";
import { ApiError } from "../../services/api/client";
import { validateGamefowlForm } from "../../utils/validation";
import type { GamefowlPayload, GamefowlSex } from "../../types/api";

/** Editable string state of the form (numbers/dates kept as strings). */
export interface GamefowlFormValues {
  name: string;
  breed: string;
  date_of_birth: string;
  sex: GamefowlSex;
  color: string;
  weight: string;
  date_acquired: string;
  notes: string;
}

export const EMPTY_GAMEFOWL_FORM: GamefowlFormValues = {
  name: "",
  breed: "",
  date_of_birth: "",
  sex: "unknown",
  color: "",
  weight: "",
  date_acquired: "",
  notes: "",
};

interface GamefowlFormProps {
  /** Pre-fill for edit mode; omit on Add. */
  initialValues?: GamefowlFormValues;
  submitLabel: string;
  /**
   * Async create/update handler owned by the screen (it knows how to
   * navigate on success). Thrown ApiErrors are rendered inline here.
   */
  onSubmit: (payload: GamefowlPayload) => Promise<void>;
}

const SEX_OPTIONS: { value: GamefowlSex; label: string }[] = [
  { value: "unknown", label: "Unknown" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export function GamefowlForm({
  initialValues = EMPTY_GAMEFOWL_FORM,
  submitLabel,
  onSubmit,
}: GamefowlFormProps) {
  const [values, setValues] = useState<GamefowlFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const setField = <K extends keyof GamefowlFormValues>(key: K, text: string) => {
    // Clear that field's error as soon as the user edits it again.
    setValues((prev) => ({ ...prev, [key]: text }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  /** Client-side rules live in utils/validation.ts (unit-tested there). */
  const validate = (): boolean => {
    const errors = validateGamefowlForm(values);
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!validate()) return;

    try {
      setSubmitting(true);
      await onSubmit({
        name: values.name.trim(),
        breed: values.breed.trim() || null,
        date_of_birth: values.date_of_birth.trim() || null,
        sex: values.sex,
        color: values.color.trim() || null,
        weight: values.weight.trim() === "" ? null : Number(values.weight),
        date_acquired: values.date_acquired.trim() || null,
        notes: values.notes.trim() || null,
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

      <TextField
        label="Name *"
        value={values.name}
        onChangeText={(text) => setField("name", text)}
        placeholder="e.g. Mang Tasoy"
        autoCapitalize="words"
        maxLength={255}
        error={fieldErrors.name ?? null}
      />

      <TextField
        label="Breed"
        value={values.breed}
        onChangeText={(text) => setField("breed", text)}
        placeholder="e.g. Hatch"
        autoCapitalize="words"
        maxLength={100}
        error={fieldErrors.breed ?? null}
      />

      {/* Sex: chips instead of free text so only valid enum values exist. */}
      <View className="mb-4">
        <Text className="mb-1 text-sm font-medium text-gray-700">Sex *</Text>
        <View className="flex-row">
          {SEX_OPTIONS.map((option) => {
            const selected = values.sex === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setField("sex", option.value)}
                className={`mr-2 flex-1 items-center rounded-xl border py-3 ${
                  selected ? "border-brand-600 bg-brand-600" : "border-gray-300 bg-white"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    selected ? "text-white" : "text-gray-700"
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {fieldErrors.sex ? (
          <Text className="mt-1 text-sm text-alert">{fieldErrors.sex}</Text>
        ) : null}
      </View>

      <TextField
        label="Color"
        value={values.color}
        onChangeText={(text) => setField("color", text)}
        placeholder="e.g. Black breasted red"
        autoCapitalize="sentences"
        maxLength={100}
        error={fieldErrors.color ?? null}
      />

      <TextField
        label="Weight (kg)"
        value={values.weight}
        onChangeText={(text) => setField("weight", text)}
        placeholder="e.g. 2.4"
        keyboardType="decimal-pad"
        error={fieldErrors.weight ?? null}
      />

      <TextField
        label="Date of birth"
        value={values.date_of_birth}
        onChangeText={(text) => setField("date_of_birth", text)}
        placeholder="YYYY-MM-DD"
        error={fieldErrors.date_of_birth ?? null}
      />

      <TextField
        label="Date acquired"
        value={values.date_acquired}
        onChangeText={(text) => setField("date_acquired", text)}
        placeholder="YYYY-MM-DD"
        error={fieldErrors.date_acquired ?? null}
      />

      <TextField
        label="Notes"
        value={values.notes}
        onChangeText={(text) => setField("notes", text)}
        placeholder="Lineage, fighting style, health remarks…"
        multiline
        maxLength={2000}
        autoCapitalize="sentences"
        error={fieldErrors.notes ?? null}
      />

      <Button label={submitLabel} onPress={handleSubmit} loading={submitting} />
    </View>
  );
}
