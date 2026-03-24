import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { useInvitationByCode, useJoinSession } from "@/hooks/use-invitations";
import { useSessionByJoinCode } from "@/hooks/use-participant-sessions";
import { ParticipantLiveView } from "@/components/participant/participant-live-view";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/join/$code")({
  component: JoinPage,
});

const joinSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Please enter a valid email").or(z.literal("")).optional(),
  age: z.string().optional(),
  gender: z.string().optional(),
  occupation: z.string().optional(),
  tech_proficiency: z.string().optional(),
  notes: z.string().optional(),
});

type JoinFormValues = z.infer<typeof joinSchema>;

function JoinPage() {
  const { code } = Route.useParams();
  const navigate = useNavigate();

  // 1. Check if this code belongs to an existing session (resume)
  const {
    data: existingSession,
    isLoading: sessionLoading,
  } = useSessionByJoinCode(code);

  // 2. Check if this is an invitation code (new participant)
  const shouldFetchInvitation = !sessionLoading && !existingSession;
  const {
    data: invitation,
    isLoading: invitationLoading,
    error: invitationError,
  } = useInvitationByCode(shouldFetchInvitation ? code : undefined);

  const joinSession = useJoinSession();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<JoinFormValues>({
    resolver: zodResolver(joinSchema),
    defaultValues: {
      name: "",
      email: "",
      age: "",
      gender: "",
      occupation: "",
      tech_proficiency: "",
      notes: "",
    },
    mode: "onBlur",
  });

  // ── Loading state ──
  if (sessionLoading || (shouldFetchInvitation && invitationLoading)) {
    return (
      <div className="flex items-center justify-center gap-2 pt-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // ── Existing session found by join code → show participant live view ──
  if (existingSession) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 pt-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            {existingSession.templates?.name ?? "Usability Test"}
          </h1>
        </div>
        <ParticipantLiveView sessionId={existingSession.id} />
      </div>
    );
  }

  // ── No invitation found ──
  if (invitationError || !invitation) {
    return (
      <div className="mx-auto max-w-2xl pt-12">
        <Card className="bg-transparent backdrop-blur-md">
          <CardContent className="pt-6 text-center">
            <p className="text-lg font-medium text-destructive">
              Invalid or expired link
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              This link is no longer active. Please contact the evaluator for a
              new one.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Invitation found → show join form ──
  const template = invitation.templates;
  const selectedTasks = template.template_tasks.filter((t) =>
    invitation.selected_task_ids.includes(t.id),
  );
  const fields = invitation.collected_fields;
  const has = (f: string) => fields.includes(f);

  const onSubmit = async (data: JoinFormValues) => {
    if (has("name") && !data.name?.trim()) return;
    setSaving(true);
    try {
      const session = await joinSession.mutateAsync({
        invitation,
        participant: {
          name: data.name || "placeholder",
          email: data.email || undefined,
          age: data.age ? parseInt(data.age) : undefined,
          gender: data.gender || undefined,
          occupation: data.occupation || undefined,
          tech_proficiency:
            (data.tech_proficiency as "low" | "medium" | "high") || undefined,
          notes: data.notes || undefined,
        },
      });
      navigate({
        to: "/join/$code",
        params: { code: session.join_code! },
        replace: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const hasAnyField = fields.length > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6 pt-12">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Join Usability Test</h1>
        <p className="mt-1 text-muted-foreground">
          Evaluator: {invitation.evaluator_name}
        </p>
      </div>

      <Card className="bg-transparent backdrop-blur-md">
        <CardHeader>
          <CardTitle>{template.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            {selectedTasks.length} task{selectedTasks.length !== 1 ? "s" : ""} to
            complete:
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedTasks.map((task) => (
              <Badge key={task.id} variant="secondary">
                {task.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)}>
        {hasAnyField && (
          <Card className="bg-transparent backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg">Your Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {has("name") && (
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      {...register("name")}
                    />
                  </div>
                )}
                {has("email") && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@example.com"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-xs text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                )}
                {has("age") && (
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      {...register("age")}
                    />
                  </div>
                )}
                {has("gender") && (
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select
                      value={watch("gender")}
                      onValueChange={(v) => setValue("gender", v)}
                    >
                      <SelectTrigger className={"w-full"}>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {has("occupation") && (
                  <div className="space-y-2">
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      {...register("occupation")}
                    />
                  </div>
                )}
                {has("tech_proficiency") && (
                  <div className="space-y-2">
                    <Label>Tech Proficiency</Label>
                    <Select
                      value={watch("tech_proficiency")}
                      onValueChange={(v) => setValue("tech_proficiency", v)}
                    >
                      <SelectTrigger className={"w-full"}>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              {has("notes") && (
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    {...register("notes")}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={saving}>
            {saving ? "Joining..." : "Join Session"}
          </Button>
        </div>
      </form>
    </div>
  );
}
