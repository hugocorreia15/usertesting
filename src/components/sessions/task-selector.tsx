import { Reorder, useDragControls } from "framer-motion";
import { GripVertical } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TemplateTask, TaskGroup } from "@/types";

interface TaskSelectorProps {
  tasks: TemplateTask[];
  groups: TaskGroup[];
  selectedIds: string[];
  onSelectedIdsChange: (ids: string[]) => void;
  orderedTasks: TemplateTask[];
  onOrderChange: (tasks: TemplateTask[]) => void;
}

export function TaskSelector({
  tasks,
  groups,
  selectedIds,
  onSelectedIdsChange,
  orderedTasks,
  onOrderChange,
}: TaskSelectorProps) {
  const allSelected = selectedIds.length === tasks.length;
  const groupMap = new Map(groups.map((g) => [g.id, g.name]));

  const toggleAll = () => {
    if (allSelected) {
      onSelectedIdsChange([]);
    } else {
      onSelectedIdsChange(orderedTasks.map((t) => t.id));
    }
  };

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectedIdsChange(selectedIds.filter((x) => x !== id));
    } else {
      onSelectedIdsChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          Tasks ({selectedIds.length}/{tasks.length} selected)
        </p>
        <Button variant="ghost" size="sm" onClick={toggleAll}>
          {allSelected ? "Deselect All" : "Select All"}
        </Button>
      </div>
      <Reorder.Group
        axis="y"
        values={orderedTasks}
        onReorder={onOrderChange}
        className="space-y-1"
      >
        {orderedTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            groupName={task.group_id ? groupMap.get(task.group_id) : undefined}
            selected={selectedIds.includes(task.id)}
            onToggle={() => toggle(task.id)}
          />
        ))}
      </Reorder.Group>
    </div>
  );
}

function TaskItem({
  task,
  groupName,
  selected,
  onToggle,
}: {
  task: TemplateTask;
  groupName?: string;
  selected: boolean;
  onToggle: () => void;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={task}
      dragListener={false}
      dragControls={controls}
      className="flex items-center gap-3 rounded-md border bg-card/50 backdrop-blur-sm px-3 py-2"
    >
      <div
        onPointerDown={(e) => controls.start(e)}
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <Checkbox
        checked={selected}
        onCheckedChange={onToggle}
        id={`task-${task.id}`}
      />
      <label
        htmlFor={`task-${task.id}`}
        className="flex-1 cursor-pointer text-sm"
      >
        {task.name}
      </label>
      {groupName && (
        <Badge variant="outline" className="text-xs capitalize">
          {groupName}
        </Badge>
      )}
    </Reorder.Item>
  );
}
