import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

export interface ParticipantFieldItem {
  key: string;
  label: string;
  field_type: "text" | "number" | "textarea" | "select";
  options: string[];
  sort_order: number;
}

interface ParticipantFieldEditorProps {
  items: ParticipantFieldItem[];
  onChange: (items: ParticipantFieldItem[]) => void;
}

const TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "textarea", label: "Long text" },
  { value: "select", label: "Dropdown" },
] as const;

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
        field_type: "text",
        options: [],
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
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
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

          {item.field_type === "select" && (
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
        </div>
      ))}

      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="mr-2 h-3 w-3" />
        Add Participant Field
      </Button>
    </div>
  );
}
