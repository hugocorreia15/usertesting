import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  SkipForward,
} from "lucide-react";
import type { TemplateTask } from "@/types";

interface TaskNavigatorProps {
  tasks: TemplateTask[];
  groupName?: string;
  currentIndex: number;
  onComplete: (status: "success" | "partial" | "failure") => void;
  onSkip: () => void;
}

export function TaskNavigator({
  tasks,
  groupName,
  currentIndex,
  onComplete,
  onSkip,
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
          <h3 className="text-lg font-semibold">{task.name}</h3>
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

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button
            onClick={() => onComplete("success")}
            className="bg-green-600 hover:bg-green-700 min-h-[48px]"
          >
            <CheckCircle className="mr-1 h-4 w-4" />
            Success
          </Button>
          <Button
            onClick={() => onComplete("partial")}
            className="bg-yellow-600 hover:bg-yellow-700 min-h-[48px]"
          >
            <AlertTriangle className="mr-1 h-4 w-4" />
            Partial
          </Button>
          <Button
            onClick={() => onComplete("failure")}
            variant="destructive"
            className="min-h-[48px]"
          >
            <XCircle className="mr-1 h-4 w-4" />
            Failure
          </Button>
          <Button
            onClick={onSkip}
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
