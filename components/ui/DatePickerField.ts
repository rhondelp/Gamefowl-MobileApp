/**
 * File: components/ui/DatePickerField.ts
 *
 * Purpose:
 *   Types-only entry point. Runtime files are platform-resolved by Metro:
 *     - DatePickerField.native.tsx  (Android/iOS — community datetimepicker)
 *     - DatePickerField.web.tsx     (hosted web build — styled text fallback)
 *   This barrel exists so TypeScript can resolve the module name used by
 *   form imports; it is never executed on any platform.
 */
export { DatePickerField } from "./DatePickerField.native";
export type { DatePickerFieldProps } from "./DatePickerField.native";
