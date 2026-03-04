import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

export interface QuestionItem {
  key: string;
  question_text: string;
  sort_order: number;
}

interface QuestionEditorProps {
  items: QuestionItem[];
  onChange: (items: QuestionItem[]) => void;
}

export function QuestionEditor({ items, onChange }: QuestionEditorProps) {
  const add = () => {
    onChange([
      ...items,
      { key: crypto.randomUUID(), question_text: "", sort_order: items.length },
    ]);
  };

  const update = (key: string, value: string) => {
    onChange(
      items.map((i) => (i.key === key ? { ...i, question_text: value } : i)),
    );
  };

  const remove = (key: string) => {
    onChange(items.filter((i) => i.key !== key));
  };

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <div key={item.key} className="flex gap-2">
          <span className="mt-2 text-sm text-muted-foreground">{idx + 1}.</span>
          <Input
            placeholder="Interview question"
            value={item.question_text}
            onChange={(e) => update(item.key, e.target.value)}
            className="flex-1"
          />
          <Button variant="ghost" size="icon" onClick={() => remove(item.key)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="mr-2 h-3 w-3" />
        Add Question
      </Button>
    </div>
  );
}
