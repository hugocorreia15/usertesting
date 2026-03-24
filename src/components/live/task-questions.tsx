import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MediaCapture } from "@/components/live/media-capture";
import type { TaskQuestion } from "@/types";

interface TaskQuestionsDialogProps {
  open: boolean;
  questions: TaskQuestion[];
  storagePath: string;
  onSubmit: (answers: TaskQuestionAnswerData[]) => void;
}

export interface TaskQuestionAnswerData {
  question_id: string;
  answer_text?: string | null;
  selected_options?: string[] | null;
  rating_value?: number | null;
  media_url?: string | null;
}

export function TaskQuestionsDialog({
  open,
  questions,
  storagePath,
  onSubmit,
}: TaskQuestionsDialogProps) {
  const [answers, setAnswers] = useState<Record<string, TaskQuestionAnswerData>>(() => {
    const init: Record<string, TaskQuestionAnswerData> = {};
    for (const q of questions) {
      init[q.id] = { question_id: q.id };
    }
    return init;
  });

  const updateAnswer = (id: string, data: Partial<TaskQuestionAnswerData>) => {
    setAnswers((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...data },
    }));
  };

  const handleSubmit = () => {
    onSubmit(Object.values(answers));
  };

  const sorted = [...questions].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-h-[80vh] overflow-y-auto sm:max-w-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Task Questions</DialogTitle>
        </DialogHeader>
        <div className="space-y-5 py-2">
          {sorted.map((q) => (
            <QuestionField
              key={q.id}
              question={q}
              value={answers[q.id]}
              storagePath={storagePath}
              onChange={(data) => updateAnswer(q.id, data)}
            />
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={handleSubmit}>Continue</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function QuestionField({
  question,
  value,
  storagePath,
  onChange,
}: {
  question: TaskQuestion;
  value: TaskQuestionAnswerData;
  storagePath: string;
  onChange: (data: Partial<TaskQuestionAnswerData>) => void;
}) {
  const options = (question.options as string[]) ?? [];
  const isMedia = question.question_type === "audio" || question.question_type === "video" || question.question_type === "photo";

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{question.question_text}</Label>

      {question.question_type === "open" && (
        <Textarea
          placeholder="Your answer..."
          value={value.answer_text ?? ""}
          onChange={(e) => onChange({ answer_text: e.target.value })}
          rows={2}
        />
      )}

      {question.question_type === "single_choice" && (
        <RadioGroup
          value={value.selected_options?.[0] ?? ""}
          onValueChange={(v) => onChange({ selected_options: [v] })}
        >
          {options.map((opt) => (
            <div key={opt} className="flex items-center gap-2">
              <RadioGroupItem value={opt} id={`${question.id}-${opt}`} />
              <Label htmlFor={`${question.id}-${opt}`} className="font-normal">
                {opt}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {question.question_type === "multiple_choice" && (
        <div className="space-y-2">
          {options.map((opt) => {
            const selected = value.selected_options ?? [];
            const checked = selected.includes(opt);
            return (
              <div key={opt} className="flex items-center gap-2">
                <Checkbox
                  checked={checked}
                  onCheckedChange={(c) => {
                    const next = c
                      ? [...selected, opt]
                      : selected.filter((o) => o !== opt);
                    onChange({ selected_options: next });
                  }}
                  id={`${question.id}-${opt}`}
                />
                <Label htmlFor={`${question.id}-${opt}`} className="font-normal">
                  {opt}
                </Label>
              </div>
            );
          })}
        </div>
      )}

      {question.question_type === "rating" && (
        <div className="flex items-center gap-2">
          {(() => {
            const min = question.rating_min ?? 1;
            const max = question.rating_max ?? 5;
            const buttons = [];
            for (let i = min; i <= max; i++) {
              buttons.push(
                <Button
                  key={i}
                  type="button"
                  variant={value.rating_value === i ? "default" : "outline"}
                  size="sm"
                  className="h-9 w-9"
                  onClick={() => onChange({ rating_value: i })}
                >
                  {i}
                </Button>,
              );
            }
            return buttons;
          })()}
        </div>
      )}

      {isMedia && (
        <MediaCapture
          type={question.question_type as "audio" | "video" | "photo"}
          value={value.media_url ?? null}
          onChange={(url) => onChange({ media_url: url })}
          storagePath={`${storagePath}/${question.id}`}
        />
      )}
    </div>
  );
}
