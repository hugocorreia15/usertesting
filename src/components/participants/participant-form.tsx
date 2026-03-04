import { useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import type { Participant } from "@/types";

interface ParticipantFormProps {
  initial?: Participant;
  onSubmit: (data: ParticipantFormData) => Promise<void>;
  submitLabel: string;
}

export interface ParticipantFormData {
  name: string;
  email: string;
  age: string;
  gender: string;
  occupation: string;
  tech_proficiency: string;
  notes: string;
}

export function ParticipantForm({
  initial,
  onSubmit,
  submitLabel,
}: ParticipantFormProps) {
  const [form, setForm] = useState<ParticipantFormData>({
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    age: initial?.age?.toString() ?? "",
    gender: initial?.gender ?? "",
    occupation: initial?.occupation ?? "",
    tech_proficiency: initial?.tech_proficiency ?? "",
    notes: initial?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);

  const set = (field: keyof ParticipantFormData, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="bg-transparent backdrop-blur-md">
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Participant name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={form.age}
                onChange={(e) => set("age", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Input
                id="gender"
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input
                id="occupation"
                value={form.occupation}
                onChange={(e) => set("occupation", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tech Proficiency</Label>
              <Select
                value={form.tech_proficiency}
                onValueChange={(v) => set("tech_proficiency", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : submitLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
