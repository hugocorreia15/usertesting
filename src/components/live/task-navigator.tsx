import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  SkipForward,
  ChevronLeft,
  RotateCcw,
} from "lucide-react";
import type { TemplateTask } from "@/types";

interface TaskNavigatorProps {
  tasks: TemplateTask[];
  groupName?: string;
  currentIndex: number;
  onComplete: (status: "success" | "partial" | "failure") => void;
  onSkip: () => void;
  onPrevious: () => void;
  onReset: () => void;
  blocked?: boolean;
}

export function TaskNavigator({
  tasks,
  groupName,
  currentIndex,
  onComplete,
  onSkip,
  onPrevious,
  onReset,
  blocked = false,
}: TaskNavigatorProps) {
  const task = tasks[currentIndex];
  if (!task) return null;

  return (
    <Card className="bg-transparent backdrop-blur-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Task {currentIndex + 1} of {tasks.length}
          </CardTitle>
          {groupName && (
            <Badge variant="secondary" className="capitalize">
              {groupName}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">
            {task.name}
            {task.is_practice && (
              <Badge variant="outline" className="ml-2 align-middle text-xs">
                practice
              </Badge>
            )}
          </h3>
          {task.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {task.description}
            </p>
          )}
        </div>

        <div className="flex gap-2 text-sm text-muted-foreground">
          {task.optimal_time_seconds && (
            <span>Optimal: {task.optimal_time_seconds}s</span>
          )}
          {task.optimal_actions && (
            <span>Actions: {task.optimal_actions}</span>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex gap-1">
          {tasks.map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                i < currentIndex
                  ? "bg-gradient-to-r from-indigo-500 to-teal-400"
                  : i === currentIndex
                    ? "bg-primary/50 animate-pulse"
                    : "bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <Button
            onClick={onPrevious}
            disabled={currentIndex === 0}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>
          <Button
            onClick={onReset}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
          >
            <RotateCcw className="mr-1 h-4 w-4" />
            Reset Task
          </Button>
        </div>

        {blocked && (
          <p className="rounded-md bg-amber-500/10 px-3 py-2 text-center text-sm text-amber-600 dark:text-amber-400">
            Waiting for the participant to finish answering the previous
            task's questions…
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button
            onClick={() => onComplete("success")}
            disabled={blocked}
            className="bg-green-600 hover:bg-green-700 min-h-[48px]"
          >
            <CheckCircle className="mr-1 h-4 w-4" />
            Success
          </Button>
          <Button
            onClick={() => onComplete("partial")}
            disabled={blocked}
            className="bg-yellow-600 hover:bg-yellow-700 min-h-[48px]"
          >
            <AlertTriangle className="mr-1 h-4 w-4" />
            Partial
          </Button>
          <Button
            onClick={() => onComplete("failure")}
            disabled={blocked}
            variant="destructive"
            className="min-h-[48px]"
          >
            <XCircle className="mr-1 h-4 w-4" />
            Failure
          </Button>
          <Button
            onClick={onSkip}
            disabled={blocked}
            variant="outline"
            className="min-h-[48px]"
          >
            <SkipForward className="mr-1 h-4 w-4" />
            Skip
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
