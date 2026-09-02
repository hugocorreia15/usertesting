/**
 * Template-scoped participant fields: the study-specific attributes collected
 * on the join form and editable later from the participant record.
 *
 * The stored vocabulary is historical — 'textarea' and 'select' predate the
 * task-question types and are shown as "Open Text" and "Single Choice" rather
 * than renamed, so no live study's rows had to be rewritten (migration 049).
 */
export type ParticipantFieldType =
  | "text"
  | "number"
  | "textarea"
  | "select"
  | "multiple_choice"
  | "rating";

export interface ParticipantFieldShape {
  field_type: ParticipantFieldType;
  options?: string[] | null;
  rating_min?: number | null;
  rating_max?: number | null;
}

/** Editor dropdown, in the order the task-question picker uses. */
export const PARTICIPANT_FIELD_TYPES: {
  value: ParticipantFieldType;
  label: string;
}[] = [
  { value: "textarea", label: "Open Text" },
  { value: "select", label: "Single Choice" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "rating", label: "Rating" },
  { value: "text", label: "Short Text" },
  { value: "number", label: "Number" },
];

export const needsOptions = (t: ParticipantFieldType) =>
  t === "select" || t === "multiple_choice";

export const isMultiValue = (t: ParticipantFieldType) => t === "multiple_choice";

/**
 * Multi-select answers are stored as a JSON array in a text column.
 * Decoding tolerates a plain string, so a field switched from single to
 * multiple choice keeps showing the answer already collected.
 */
export function decodeMultiValue(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((v): v is string => typeof v === "string");
      }
    } catch {
      // Fall through: treat unparseable content as a single legacy answer.
    }
  }
  return [trimmed];
}

export function encodeMultiValue(values: string[]): string {
  const cleaned = values.filter((v) => v.trim() !== "");
  return cleaned.length === 0 ? "" : JSON.stringify(cleaned);
}

/** Human-readable form, for tables, reports and exports. */
export function formatParticipantFieldValue(
  field: ParticipantFieldShape,
  raw: string | null | undefined,
): string {
  if (raw == null || raw === "") return "";
  if (isMultiValue(field.field_type)) return decodeMultiValue(raw).join(", ");
  return raw;
}

/** Inclusive rating scale for a field, guarding against inverted bounds. */
export function ratingScale(field: ParticipantFieldShape): number[] {
  const min = field.rating_min ?? 1;
  const max = field.rating_max ?? 5;
  if (max < min) return [min];
  return Array.from({ length: max - min + 1 }, (_, i) => min + i);
}
