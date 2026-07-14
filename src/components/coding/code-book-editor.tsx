import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useTemplateCodes,
  useCreateCode,
  useUpdateCode,
  useDeleteCode,
} from "@/hooks/use-codes";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_COLORS = [
  "#6366f1", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#22c55e", "#ec4899", "#0ea5e9",
];

interface CodeBookEditorProps {
  templateId: string;
}

export function CodeBookEditor({ templateId }: CodeBookEditorProps) {
  const { data: codes, isLoading } = useTemplateCodes(templateId);
  const createCode = useCreateCode();
  const updateCode = useUpdateCode();
  const deleteCode = useDeleteCode();

  const [newCode, setNewCode] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newColor, setNewColor] = useState(
    DEFAULT_COLORS[0],
  );

  const handleAdd = () => {
    const code = newCode.trim();
    if (!code) return;
    createCode.mutate(
      {
        template_id: templateId,
        code,
        description: newDescription.trim() || null,
        color: newColor,
        sort_order: codes?.length ?? 0,
      },
      {
        onSuccess: () => {
          setNewCode("");
          setNewDescription("");
          setNewColor(
            DEFAULT_COLORS[((codes?.length ?? 0) + 1) % DEFAULT_COLORS.length],
          );
        },
        onError: (e) =>
          toast.error(
            e.message.includes("duplicate")
              ? "A code with that name already exists"
              : "Failed to create code",
          ),
      },
    );
  };

  return (
    <Card className="bg-transparent backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-base">Code book</CardTitle>
        <p className="text-sm text-muted-foreground">
          Define the codes used to tag open-text and interview answers.
          Tag answers from a session's detail page; frequencies appear in
          the matrix below.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading codes…</p>
        ) : (codes ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No codes yet — add the first one below.
          </p>
        ) : (
          <div className="space-y-2">
            {codes!.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-2 rounded-md border p-2"
              >
                <input
                  type="color"
                  aria-label={`Color for ${c.code}`}
                  value={c.color}
                  onChange={(e) =>
                    updateCode.mutate({
                      id: c.id,
                      template_id: templateId,
                      color: e.target.value,
                    })
                  }
                  className="h-7 w-9 shrink-0 cursor-pointer rounded border bg-transparent p-0.5"
                />
                <span className="font-medium">{c.code}</span>
                <Input
                  key={`${c.id}-${c.description ?? ""}`}
                  defaultValue={c.description ?? ""}
                  placeholder="Definition (optional)"
                  onBlur={(e) => {
                    const value = e.target.value.trim() || null;
                    if (value !== c.description)
                      updateCode.mutate({
                        id: c.id,
                        template_id: templateId,
                        description: value,
                      });
                  }}
                  className="h-8 min-w-40 flex-1 text-sm"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() =>
                    deleteCode.mutate(
                      { id: c.id, template_id: templateId },
                      {
                        onError: () => toast.error("Failed to delete code"),
                      },
                    )
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-end gap-2 border-t pt-4">
          <div className="space-y-1">
            <Label htmlFor="new-code-color">Color</Label>
            <input
              id="new-code-color"
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="block h-9 w-12 cursor-pointer rounded-md border bg-transparent p-1"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="new-code-name">Code</Label>
            <Input
              id="new-code-name"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="e.g. NAV-CONFUSION"
              className="w-44"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <div className="min-w-40 flex-1 space-y-1">
            <Label htmlFor="new-code-desc">Definition (optional)</Label>
            <Input
              id="new-code-desc"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="When the participant gets lost in navigation"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <Button
            onClick={handleAdd}
            disabled={!newCode.trim() || createCode.isPending}
          >
            {createCode.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Add code
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
