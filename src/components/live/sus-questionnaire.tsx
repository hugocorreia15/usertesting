import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SUS_QUESTIONS, SUS_SCALE_LABELS } from "@/lib/sus";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SusQuestionnaireProps {
  onSubmit: (answers: { question_number: number; score: number }[]) => void;
  submitting?: boolean;
}

export function SusQuestionnaire({ onSubmit, submitting }: SusQuestionnaireProps) {
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
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-bold">System Usability Scale (SUS)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Please rate your agreement with each statement on a scale of 1
          (Strongly Disagree) to 5 (Strongly Agree).
        </p>
      </div>

      <div className="space-y-3">
        {SUS_QUESTIONS.map((question, i) => {
          const qNum = i + 1;
          return (
            <Card key={qNum} className="bg-transparent backdrop-blur-md">
              <CardContent className="space-y-3 pt-4 pb-3">
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
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={!allAnswered || submitting}
        onClick={handleSubmit}
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : allAnswered ? (
          "Submit SUS Questionnaire"
        ) : (
          `Answer all questions (${Object.keys(ratings).length}/10)`
        )}
      </Button>
    </div>
  );
}
