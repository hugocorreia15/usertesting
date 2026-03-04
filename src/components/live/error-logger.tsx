import gsap from "gsap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { TemplateErrorType } from "@/types";

interface ErrorLoggerProps {
  errorTypes: TemplateErrorType[];
  errorCounts: Record<string, number>;
  onLogError: (errorTypeId: string) => void;
}

const ERROR_COLORS = [
  "border-red-400/40 hover:bg-red-50 dark:hover:bg-red-500/10",
  "border-orange-400/40 hover:bg-orange-50 dark:hover:bg-orange-500/10",
  "border-amber-400/40 hover:bg-amber-50 dark:hover:bg-amber-500/10",
  "border-rose-400/40 hover:bg-rose-50 dark:hover:bg-rose-500/10",
];

export function ErrorLogger({
  errorTypes,
  errorCounts,
  onLogError,
}: ErrorLoggerProps) {
  const handleClick = (id: string, el: HTMLButtonElement | null, index: number) => {
    if (el) {
      const colors = [
        "rgba(239,68,68,0.3)",
        "rgba(249,115,22,0.3)",
        "rgba(245,158,11,0.3)",
        "rgba(244,63,94,0.3)",
      ];
      gsap.fromTo(
        el,
        { backgroundColor: colors[index % colors.length] },
        { backgroundColor: "transparent", duration: 0.4 },
      );
    }
    onLogError(id);
  };

  return (
    <Card className="bg-transparent backdrop-blur-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Errors</CardTitle>
      </CardHeader>
      <CardContent>
        {errorTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No error types defined.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {errorTypes.map((et, index) => (
              <Button
                key={et.id}
                variant="outline"
                className={`relative min-h-[48px] justify-start ${ERROR_COLORS[index % ERROR_COLORS.length]}`}
                onClick={(e) =>
                  handleClick(et.id, e.currentTarget, index)
                }
              >
                <span className="font-mono text-xs">{et.code}</span>
                <span className="ml-2 truncate text-xs">{et.label}</span>
                {(errorCounts[et.id] || 0) > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-[10px]"
                  >
                    {errorCounts[et.id]}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
