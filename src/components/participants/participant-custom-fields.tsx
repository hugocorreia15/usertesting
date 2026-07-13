import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useParticipantCustomFields,
  useSaveParticipantFieldValues,
} from "@/hooks/use-participants";
import { toast } from "sonner";

export function ParticipantCustomFields({
  participantId,
}: {
  participantId: string;
}) {
  const { data, isLoading } = useParticipantCustomFields(participantId);
  const save = useSaveParticipantFieldValues();
  const [draft, setDraft] = useState<Record<string, string>>({});

  if (isLoading || !data || data.groups.length === 0) return null;

  const valueOf = (fieldId: string) =>
    draft[fieldId] ?? data.values[fieldId] ?? "";

  const set = (fieldId: string, value: string) =>
    setDraft((d) => ({ ...d, [fieldId]: value }));

  const handleSave = async (fieldIds: string[]) => {
    try {
      await save.mutateAsync({
        participant_id: participantId,
        values: fieldIds.map((id) => ({
          field_id: id,
          value: valueOf(id),
        })),
      });
      toast.success("Saved");
    } catch {
      toast.error("Failed to save");
    }
  };

  return (
    <>
      {data.groups.map((group) => (
        <Card
          key={group.template_id}
          className="bg-transparent backdrop-blur-md"
        >
          <CardHeader>
            <CardTitle>{group.template_name} — Extra Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {group.fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label>{field.label}</Label>
                  {field.field_type === "textarea" ? (
                    <Textarea
                      rows={3}
                      value={valueOf(field.id)}
                      onChange={(e) => set(field.id, e.target.value)}
                    />
                  ) : field.field_type === "select" ? (
                    <Select
                      value={valueOf(field.id)}
                      onValueChange={(v) => set(field.id, v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {(field.options ?? []).map((opt) => (
                          <SelectItem key={opt} value={opt}>
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={field.field_type === "number" ? "number" : "text"}
                      value={valueOf(field.id)}
                      onChange={(e) => set(field.id, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                disabled={save.isPending}
                onClick={() => handleSave(group.fields.map((f) => f.id))}
              >
                {save.isPending ? "Saving..." : "Save Extra Info"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
