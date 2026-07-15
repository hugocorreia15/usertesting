import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLang, format } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SusQuestionnaireProps {
  onSubmit: (answers: { question_number: number; score: number }[]) => void;
  submitting?: boolean;
}

export function SusQuestionnaire({ onSubmit, submitting }: SusQuestionnaireProps) {
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const { dict } = useLang();

  const allAnswered = dict.sus.questions.every((_, i) => ratings[i + 1] != null);

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
        <h2 className="text-xl font-bold">{dict.sus.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{dict.sus.hint}</p>
      </div>

      <div className="space-y-3">
        {dict.sus.questions.map((question, i) => {
          const qNum = i + 1;
          return (
            <Card key={qNum} className="bg-transparent backdrop-blur-md">
              <CardContent className="space-y-3 pt-4 pb-3">
                <p className="text-sm font-medium">
                  {qNum}. {question}
                </p>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <Button
                      key={score}
                      variant={ratings[qNum] === score ? "default" : "outline"}
                      aria-label={format(dict.live.ratingOf, { i: score, max: 5 })}
                      aria-pressed={ratings[qNum] === score}
                      size="sm"
                      className={cn(
                        "h-11 min-w-11 transition-all duration-200",
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
                  <span>{dict.sus.scaleLow}</span>
                  <span>{dict.sus.scaleHigh}</span>
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
            {dict.common.submitting}
          </>
        ) : allAnswered ? (
          dict.sus.submitSus
        ) : (
          format(dict.sus.answerAll, { n: Object.keys(ratings).length })
        )}
      </Button>
    </div>
  );
}
