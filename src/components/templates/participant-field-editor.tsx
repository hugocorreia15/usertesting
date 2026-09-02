import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import {
  PARTICIPANT_FIELD_TYPES,
  needsOptions,
  type ParticipantFieldType,
} from "@/lib/participant-fields";

export interface ParticipantFieldItem {
  key: string;
  label: string;
  field_type: ParticipantFieldType;
  options: string[];
  rating_min: number;
  rating_max: number;
  sort_order: number;
}

interface ParticipantFieldEditorProps {
  items: ParticipantFieldItem[];
  onChange: (items: ParticipantFieldItem[]) => void;
}

export function ParticipantFieldEditor({
  items,
  onChange,
}: ParticipantFieldEditorProps) {
  const add = () => {
    onChange([
      ...items,
      {
        key: crypto.randomUUID(),
        label: "",
        field_type: "textarea",
        options: [],
        rating_min: 1,
        rating_max: 5,
        sort_order: items.length,
      },
    ]);
  };

  const update = (key: string, patch: Partial<ParticipantFieldItem>) => {
    onChange(items.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  };

  const remove = (key: string) => {
    onChange(items.filter((i) => i.key !== key));
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Extra fields collected for each participant in this template (shown on
        the join form and the participant's details).
      </p>

      {items.map((item) => (
        <div
          key={item.key}
          className="space-y-2 rounded-md border p-3"
        >
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Field label (e.g. Department)"
              value={item.label}
              onChange={(e) => update(item.key, { label: e.target.value })}
              className="min-w-[10rem] flex-1"
            />
            <Select
              value={item.field_type}
              onValueChange={(v) =>
                update(item.key, {
                  field_type: v as ParticipantFieldItem["field_type"],
                })
              }
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PARTICIPANT_FIELD_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(item.key)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {needsOptions(item.field_type) && (
            <Input
              placeholder="Options, comma-separated (e.g. Sales, Support, Engineering)"
              value={item.options.join(", ")}
              onChange={(e) =>
                update(item.key, {
                  options: e.target.value
                    .split(",")
                    .map((o) => o.trim())
                    .filter(Boolean),
                })
              }
            />
          )}

          {item.field_type === "rating" && (
            <div className="flex items-center gap-2">
              <Label htmlFor={`min-${item.key}`} className="text-xs text-muted-foreground">
                Scale
              </Label>
              <Input
                id={`min-${item.key}`}
                type="number"
                className="w-20"
                value={item.rating_min}
                onChange={(e) =>
                  update(item.key, { rating_min: Number(e.target.value) })
                }
              />
              <span className="text-xs text-muted-foreground">to</span>
              <Input
                type="number"
                className="w-20"
                aria-label="Rating maximum"
                value={item.rating_max}
                onChange={(e) =>
                  update(item.key, { rating_max: Number(e.target.value) })
                }
              />
            </div>
          )}
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="mr-2 h-3 w-3" />
        Add Participant Field
      </Button>
    </div>
  );
}
