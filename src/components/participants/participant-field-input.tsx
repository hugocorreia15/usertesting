import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  decodeMultiValue,
  encodeMultiValue,
  ratingScale,
  type ParticipantFieldType,
} from "@/lib/participant-fields";

export interface ParticipantFieldDef {
  id: string;
  label: string;
  field_type: ParticipantFieldType;
  options?: string[] | null;
  rating_min?: number | null;
  rating_max?: number | null;
}

/**
 * One participant field, rendered the same way on the join form and on the
 * evaluator's participant record. Values are always carried as a string;
 * multiple choice encodes its selection as JSON (see lib/participant-fields).
 */
export function ParticipantFieldInput({
  field,
  value,
  onChange,
  selectPlaceholder = "Select an option",
}: {
  field: ParticipantFieldDef;
  value: string;
  onChange: (next: string) => void;
  selectPlaceholder?: string;
}) {
  const inputId = `pf-${field.id}`;

  if (field.field_type === "textarea") {
    return (
      <Textarea
        id={inputId}
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (field.field_type === "select") {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full" id={inputId}>
          <SelectValue placeholder={selectPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {(field.options ?? []).map((opt) => (
            <SelectItem key={opt} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (field.field_type === "multiple_choice") {
    const selected = decodeMultiValue(value);
    return (
      <div
        role="group"
        aria-labelledby={`${inputId}-label`}
        className="space-y-2"
      >
        {(field.options ?? []).map((opt) => (
          <label key={opt} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={selected.includes(opt)}
              onCheckedChange={(checked) =>
                onChange(
                  encodeMultiValue(
                    checked
                      ? [...selected, opt]
                      : selected.filter((o) => o !== opt),
                  ),
                )
              }
            />
            {opt}
          </label>
        ))}
      </div>
    );
  }

  if (field.field_type === "rating") {
    const scale = ratingScale(field);
    return (
      <div
        role="group"
        aria-labelledby={`${inputId}-label`}
        className="flex flex-wrap gap-2"
      >
        {scale.map((n) => {
          const active = value === String(n);
          return (
            <button
              key={n}
              type="button"
              aria-label={`${field.label}: ${n}`}
              aria-pressed={active}
              onClick={() => onChange(active ? "" : String(n))}
              className={cn(
                "h-10 min-w-10 rounded-md border px-3 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <Input
      id={inputId}
      type={field.field_type === "number" ? "number" : "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
