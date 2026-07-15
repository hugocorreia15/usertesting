import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { InstrumentDef } from "@/lib/instruments";
import { useLang, format, localizeInstrument } from "@/lib/i18n";

// Generic renderer for a standardized questionnaire (NASA-TLX, UEQ-S).
// TLX items use a 0–100 stepped slider; 7-point bipolar items render as
// a button row between the two anchors.
export function InstrumentForm({
  def: rawDef,
  onSubmit,
  submitting,
}: {
  def: InstrumentDef;
  onSubmit: (answers: { item_number: number; score: number }[]) => void;
  submitting?: boolean;
}) {
  const [values, setValues] = useState<Record<number, number>>({});
  const { dict } = useLang();
  const def = localizeInstrument(rawDef, dict);
  const allAnswered = def.items.every((i) => values[i.number] != null);

  const set = (item: number, score: number) =>
    setValues((v) => ({ ...v, [item]: score }));

  const isButtonScale = def.max - def.min <= 8;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold">{def.name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{def.description}</p>
      </div>

      {def.items.map((item) => (
        <Card key={item.number} className="bg-transparent backdrop-blur-md">
          <CardContent className="space-y-3 pt-4 pb-3">
            {item.prompt && (
              <CardTitle className="text-sm font-medium">
                {item.prompt}
              </CardTitle>
            )}

            {isButtonScale ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="w-24 text-right text-xs text-muted-foreground">
                  {item.lowAnchor}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(
                    { length: def.max - def.min + 1 },
                    (_, i) => def.min + i,
                  ).map((score) => (
                    <Button
                      key={score}
                      type="button"
                      size="sm"
                      aria-label={format(dict.live.ratingOf, {
                        i: score,
                        max: def.max,
                      })}
                      aria-pressed={values[item.number] === score}
                      variant={
                        values[item.number] === score ? "default" : "outline"
                      }
                      className="h-11 w-11"
                      onClick={() => set(item.number, score)}
                    >
                      {score}
                    </Button>
                  ))}
                </div>
                <span className="w-24 text-xs text-muted-foreground">
                  {item.highAnchor}
                </span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <input
                  type="range"
                  aria-label={item.prompt || `${item.lowAnchor} / ${item.highAnchor}`}
                  min={def.min}
                  max={def.max}
                  step={def.step}
                  value={values[item.number] ?? (def.min + def.max) / 2}
                  onChange={(e) => set(item.number, Number(e.target.value))}
                  // releasing the thumb without moving still counts as an
                  // answer (e.g. deliberately choosing the midpoint)
                  onPointerUp={(e) =>
                    set(item.number, Number((e.target as HTMLInputElement).value))
                  }
                  className={cn(
                    "w-full accent-primary",
                    values[item.number] == null && "opacity-60",
                  )}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{item.lowAnchor}</span>
                  <span
                    className={cn(
                      "font-medium",
                      values[item.number] != null && "text-foreground",
                    )}
                  >
                    {values[item.number] != null
                      ? values[item.number]
                      : dict.instruments.slideToAnswer}
                  </span>
                  <span>{item.highAnchor}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end">
        <Button
          disabled={!allAnswered || submitting}
          onClick={() =>
            onSubmit(
              def.items.map((i) => ({
                item_number: i.number,
                score: values[i.number],
              })),
            )
          }
        >
          {submitting ? dict.common.submitting : dict.common.submit}
        </Button>
      </div>
    </div>
  );
}
