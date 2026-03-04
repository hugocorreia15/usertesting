import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { SUS_QUESTIONS, SUS_SCALE_LABELS } from "@/lib/sus";
import { cn } from "@/lib/utils";

interface SusQuestionnaireProps {
  open: boolean;
  onSubmit: (answers: { question_number: number; score: number }[]) => void;
}

export function SusQuestionnaire({ open, onSubmit }: SusQuestionnaireProps) {
  const [ratings, setRatings] = useState<Record<number, number>>({});

  const allAnswered = SUS_QUESTIONS.every((_, i) => ratings[i + 1] != null);

  const handleSubmit = () => {
    const answers = Object.entries(ratings).map(([q, s]) => ({
      question_number: Number(q),
      score: s,
    }));
    onSubmit(answers);
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-2xl max-h-[85vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>System Usability Scale (SUS)</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Please rate your agreement with each statement on a scale of 1
          (Strongly Disagree) to 5 (Strongly Agree).
        </p>

        <div className="space-y-4 py-2">
          {SUS_QUESTIONS.map((question, i) => {
            const qNum = i + 1;
            return (
              <div key={qNum} className="rounded-lg border p-3 space-y-2">
                <p className="text-sm font-medium">
                  {qNum}. {question}
                </p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <Button
                      key={score}
                      variant={ratings[qNum] === score ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "h-9 min-w-9 transition-all duration-200",
                        ratings[qNum] === score &&
                          "ring-2 ring-primary ring-offset-2",
                      )}
                      onClick={() =>
                        setRatings((prev) => ({ ...prev, [qNum]: score }))
                      }
                    >
                      {score}
                    </Button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                  <span>{SUS_SCALE_LABELS[0]}</span>
                  <span>{SUS_SCALE_LABELS[4]}</span>
                </div>
              </div>
            );
          })}
        </div>

        <Button
          className="w-full"
          disabled={!allAnswered}
          onClick={handleSubmit}
        >
          {allAnswered
            ? "Submit SUS Questionnaire"
            : `Answer all questions (${Object.keys(ratings).length}/10)`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
