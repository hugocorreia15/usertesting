import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { RemoveWithAnswers } from "./remove-with-answers";

export interface ErrorTypeItem {
  key: string;
  code: string;
  label: string;
}

interface ErrorTypeEditorProps {
  /** How many logged errors each type already holds, by database id. */
  answerCounts?: Map<string, number>;
  items: ErrorTypeItem[];
  onChange: (items: ErrorTypeItem[]) => void;
}

export function ErrorTypeEditor({ items, onChange, answerCounts }: ErrorTypeEditorProps) {
  const add = () => {
    onChange([...items, { key: crypto.randomUUID(), code: "", label: "" }]);
  };

  const update = (key: string, field: "code" | "label", value: string) => {
    onChange(items.map((i) => (i.key === key ? { ...i, [field]: value } : i)));
  };

  const remove = (key: string) => {
    onChange(items.filter((i) => i.key !== key));
  };

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.key} className="flex gap-2">
          <Input
            placeholder="Code (e.g. E1)"
            value={item.code}
            onChange={(e) => update(item.key, "code", e.target.value)}
            className="w-28"
          />
          <Input
            placeholder="Label (e.g. Navigation error)"
            value={item.label}
            onChange={(e) => update(item.key, "label", e.target.value)}
            className="flex-1"
          />
          <RemoveWithAnswers
            label={item.label || item.code}
            noun="logged error"
            count={answerCounts?.get(item.key) ?? 0}
            onRemove={() => remove(item.key)}
          />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="mr-2 h-3 w-3" />
        Add Error Type
      </Button>
    </div>
  );
}
