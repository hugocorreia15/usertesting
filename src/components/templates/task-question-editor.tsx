import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, X } from "lucide-react";

export type QuestionType = "open" | "single_choice" | "multiple_choice" | "rating" | "audio" | "video" | "photo";

export interface TaskQuestionItem {
  key: string;
  question_text: string;
  question_type: QuestionType;
  options: string[];
  rating_min: string;
  rating_max: string;
  sort_order: number;
}

interface TaskQuestionEditorProps {
  questions: TaskQuestionItem[];
  onChange: (questions: TaskQuestionItem[]) => void;
}

function makeQuestion(order: number): TaskQuestionItem {
  return {
    key: crypto.randomUUID(),
    question_text: "",
    question_type: "open",
    options: [],
    rating_min: "1",
    rating_max: "5",
    sort_order: order,
  };
}

export function TaskQuestionEditor({ questions, onChange }: TaskQuestionEditorProps) {
  const add = () => onChange([...questions, makeQuestion(questions.length)]);

  const update = (key: string, field: keyof TaskQuestionItem, value: any) => {
    onChange(questions.map((q) => (q.key === key ? { ...q, [field]: value } : q)));
  };

  const remove = (key: string) => onChange(questions.filter((q) => q.key !== key));

  const addOption = (key: string) => {
    onChange(
      questions.map((q) =>
        q.key === key ? { ...q, options: [...q.options, ""] } : q,
      ),
    );
  };

  const updateOption = (key: string, index: number, value: string) => {
    onChange(
      questions.map((q) =>
        q.key === key
          ? { ...q, options: q.options.map((o, i) => (i === index ? value : o)) }
          : q,
      ),
    );
  };

  const removeOption = (key: string, index: number) => {
    onChange(
      questions.map((q) =>
        q.key === key
          ? { ...q, options: q.options.filter((_, i) => i !== index) }
          : q,
      ),
    );
  };

  return (
    <div className="space-y-2 pl-6 border-l-2 border-muted">
      <p className="text-xs font-medium text-muted-foreground">Task Questions</p>
      {questions.map((q, idx) => (
        <div key={q.key} className="space-y-2 rounded-md border p-3 bg-muted/20">
          <div className="flex gap-2">
            <span className="mt-2 text-xs text-muted-foreground">{idx + 1}.</span>
            <Input
              placeholder="Question text"
              value={q.question_text}
              onChange={(e) => update(q.key, "question_text", e.target.value)}
              className="flex-1"
            />
            <Select
              value={q.question_type}
              onValueChange={(v) => update(q.key, "question_type", v)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open Text</SelectItem>
                <SelectItem value="single_choice">Single Choice</SelectItem>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="photo">Photo</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon" onClick={() => remove(q.key)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          {(q.question_type === "single_choice" || q.question_type === "multiple_choice") && (
            <div className="space-y-1 pl-5">
              {q.options.map((opt, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    placeholder={`Option ${i + 1}`}
                    value={opt}
                    onChange={(e) => updateOption(q.key, i, e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="ghost" size="icon" onClick={() => removeOption(q.key, i)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => addOption(q.key)}
                className="text-xs"
              >
                <Plus className="mr-1 h-3 w-3" />
                Add Option
              </Button>
            </div>
          )}

          {q.question_type === "rating" && (
            <div className="flex items-center gap-2 pl-5">
              <Input
                type="number"
                placeholder="Min"
                value={q.rating_min}
                onChange={(e) => update(q.key, "rating_min", e.target.value)}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <Input
                type="number"
                placeholder="Max"
                value={q.rating_max}
                onChange={(e) => update(q.key, "rating_max", e.target.value)}
                className="w-20"
              />
            </div>
          )}
        </div>
      ))}
      <Button type="button" variant="ghost" size="sm" onClick={add} className="text-xs">
        <Plus className="mr-1 h-3 w-3" />
        Add Question
      </Button>
    </div>
  );
}
