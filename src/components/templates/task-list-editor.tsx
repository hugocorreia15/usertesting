import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, GripVertical } from "lucide-react";
import type { TaskComplexity } from "@/lib/constants";

export interface TaskItem {
  key: string;
  name: string;
  description: string;
  complexity: TaskComplexity;
  optimal_time_seconds: string;
  optimal_actions: string;
  sort_order: number;
}

interface TaskListEditorProps {
  tasks: TaskItem[];
  onChange: (tasks: TaskItem[]) => void;
}

function makeTask(complexity: TaskComplexity, order: number): TaskItem {
  return {
    key: crypto.randomUUID(),
    name: "",
    description: "",
    complexity,
    optimal_time_seconds: "",
    optimal_actions: "",
    sort_order: order,
  };
}

export function TaskListEditor({ tasks, onChange }: TaskListEditorProps) {
  const simple = tasks.filter((t) => t.complexity === "simple");
  const complex = tasks.filter((t) => t.complexity === "complex");

  const addTask = (complexity: TaskComplexity) => {
    onChange([...tasks, makeTask(complexity, tasks.length)]);
  };

  const updateTask = (key: string, field: keyof TaskItem, value: string) => {
    onChange(
      tasks.map((t) => (t.key === key ? { ...t, [field]: value } : t)),
    );
  };

  const removeTask = (key: string) => {
    onChange(tasks.filter((t) => t.key !== key));
  };

  const renderTasks = (items: TaskItem[]) =>
    items.map((task, i) => (
      <div
        key={task.key}
        className="flex gap-3 rounded-md border p-3"
      >
        <GripVertical className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Task name"
              value={task.name}
              onChange={(e) => updateTask(task.key, "name", e.target.value)}
            />
            <Input
              placeholder="Optimal time (s)"
              type="number"
              className="w-36"
              value={task.optimal_time_seconds}
              onChange={(e) =>
                updateTask(task.key, "optimal_time_seconds", e.target.value)
              }
            />
            <Input
              placeholder="Optimal actions"
              type="number"
              className="w-36"
              value={task.optimal_actions}
              onChange={(e) =>
                updateTask(task.key, "optimal_actions", e.target.value)
              }
            />
          </div>
          <Textarea
            placeholder="Task description / instructions"
            value={task.description}
            onChange={(e) =>
              updateTask(task.key, "description", e.target.value)
            }
            rows={2}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => removeTask(task.key)}
          className="shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ));

  return (
    <div className="space-y-4">
      <Tabs defaultValue="simple">
        <TabsList>
          <TabsTrigger value="simple">
            Simple ({simple.length})
          </TabsTrigger>
          <TabsTrigger value="complex">
            Complex ({complex.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="simple" className="space-y-3">
          {renderTasks(simple)}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addTask("simple")}
          >
            <Plus className="mr-2 h-3 w-3" />
            Add Simple Task
          </Button>
        </TabsContent>
        <TabsContent value="complex" className="space-y-3">
          {renderTasks(complex)}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => addTask("complex")}
          >
            <Plus className="mr-2 h-3 w-3" />
            Add Complex Task
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
