import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight, MessageSquare, X } from "lucide-react";
import {
  TaskQuestionEditor,
  type TaskQuestionItem,
} from "@/components/templates/task-question-editor";
import { useState } from "react";

export interface TaskGroupItem {
  key: string;
  name: string;
  sort_order: number;
}

export interface TaskItem {
  key: string;
  name: string;
  description: string;
  group_key: string;
  optimal_time_seconds: string;
  optimal_actions: string;
  sort_order: number;
  task_questions: TaskQuestionItem[];
}

interface TaskListEditorProps {
  groups: TaskGroupItem[];
  onGroupsChange: (groups: TaskGroupItem[]) => void;
  tasks: TaskItem[];
  onChange: (tasks: TaskItem[]) => void;
}

function makeTask(groupKey: string, order: number): TaskItem {
  return {
    key: crypto.randomUUID(),
    name: "",
    description: "",
    group_key: groupKey,
    optimal_time_seconds: "",
    optimal_actions: "",
    sort_order: order,
    task_questions: [],
  };
}

export function TaskListEditor({ groups, onGroupsChange, tasks, onChange }: TaskListEditorProps) {
  const [newGroupName, setNewGroupName] = useState("");
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [activeTab, setActiveTab] = useState(groups[0]?.key ?? "");

  const addGroup = () => {
    const name = newGroupName.trim();
    if (!name || groups.some((g) => g.name.toLowerCase() === name.toLowerCase())) return;
    const newGroup: TaskGroupItem = {
      key: crypto.randomUUID(),
      name,
      sort_order: groups.length,
    };
    onGroupsChange([...groups, newGroup]);
    setActiveTab(newGroup.key);
    setNewGroupName("");
  };

  const removeGroup = (groupKey: string) => {
    const remaining = groups.filter((g) => g.key !== groupKey);
    if (remaining.length === 0) return;
    // Move tasks from removed group to first remaining group
    const updated = tasks.map((t) =>
      t.group_key === groupKey ? { ...t, group_key: remaining[0].key } : t,
    );
    onChange(updated);
    onGroupsChange(remaining);
    if (activeTab === groupKey) setActiveTab(remaining[0].key);
  };

  const renameGroup = (groupKey: string) => {
    const name = editGroupName.trim();
    const group = groups.find((g) => g.key === groupKey);
    if (!name || (name !== group?.name && groups.some((g) => g.name.toLowerCase() === name.toLowerCase()))) {
      setEditingGroup(null);
      return;
    }
    onGroupsChange(groups.map((g) => (g.key === groupKey ? { ...g, name } : g)));
    setEditingGroup(null);
  };

  const addTask = (groupKey: string) => {
    onChange([...tasks, makeTask(groupKey, tasks.length)]);
  };

  const updateTask = (key: string, field: keyof TaskItem, value: any) => {
    onChange(tasks.map((t) => (t.key === key ? { ...t, [field]: value } : t)));
  };

  const removeTask = (key: string) => {
    onChange(tasks.filter((t) => t.key !== key));
  };

  const renderTasks = (items: TaskItem[]) =>
    items.map((task) => (
      <TaskRow
        key={task.key}
        task={task}
        onUpdate={(field, value) => updateTask(task.key, field, value)}
        onRemove={() => removeTask(task.key)}
      />
    ));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Create a task group..."
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGroup())}
          className="h-8 w-44 text-xs"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={addGroup}
          disabled={!newGroupName.trim()}
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Group
        </Button>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Create a task group to start adding tasks.
        </p>
      ) : (
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
            {groups.map((group) => {
              const count = tasks.filter((t) => t.group_key === group.key).length;
              return (
                <TabsTrigger key={group.key} value={group.key} className="gap-1.5">
                  {editingGroup === group.key ? (
                    <div onClick={(e) => e.stopPropagation()}>
                      <Input
                        value={editGroupName}
                        onChange={(e) => setEditGroupName(e.target.value)}
                        onBlur={() => renameGroup(group.key)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); renameGroup(group.key); }
                          if (e.key === "Escape") setEditingGroup(null);
                        }}
                        autoFocus
                        className="h-5 w-20 text-xs px-1"
                      />
                    </div>
                  ) : (
                    <span
                      onDoubleClick={() => { setEditingGroup(group.key); setEditGroupName(group.name); }}
                    >
                      {group.name} ({count})
                    </span>
                  )}
                  {groups.length > 1 && editingGroup !== group.key && (
                    <span
                      role="button"
                      onClick={(e) => { e.stopPropagation(); removeGroup(group.key); }}
                      className="ml-1 rounded-full p-0.5 hover:bg-muted cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        {groups.map((group) => (
          <TabsContent key={group.key} value={group.key} className="space-y-3">
            {renderTasks(tasks.filter((t) => t.group_key === group.key))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addTask(group.key)}
            >
              <Plus className="mr-2 h-3 w-3" />
              Add Task
            </Button>
          </TabsContent>
        ))}
      </Tabs>
      )}
    </div>
  );
}

function TaskRow({
  task,
  onUpdate,
  onRemove,
}: {
  task: TaskItem;
  onUpdate: (field: keyof TaskItem, value: any) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(task.task_questions.length > 0);
  const qCount = task.task_questions.length;

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex gap-3">
        <GripVertical className="mt-2 h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Task name"
              value={task.name}
              onChange={(e) => onUpdate("name", e.target.value)}
            />
            <Input
              placeholder="Optimal time (s)"
              type="number"
              className="w-36"
              value={task.optimal_time_seconds}
              onChange={(e) => onUpdate("optimal_time_seconds", e.target.value)}
            />
            <Input
              placeholder="Optimal actions"
              type="number"
              className="w-36"
              value={task.optimal_actions}
              onChange={(e) => onUpdate("optimal_actions", e.target.value)}
            />
          </div>
          <Textarea
            placeholder="Task description / instructions"
            value={task.description}
            onChange={(e) => onUpdate("description", e.target.value)}
            rows={2}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="text-xs gap-1.5">
            {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <MessageSquare className="h-3 w-3" />
            Questions{qCount > 0 && ` (${qCount})`}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <TaskQuestionEditor
            questions={task.task_questions}
            onChange={(qs) => onUpdate("task_questions", qs)}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
