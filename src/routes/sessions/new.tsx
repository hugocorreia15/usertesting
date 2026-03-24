import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTemplates, useTemplate } from "@/hooks/use-templates";
import { useParticipants } from "@/hooks/use-participants";
import { useCreateSession } from "@/hooks/use-sessions";
import { useCreateInvitation } from "@/hooks/use-invitations";
import { useAuth } from "@/hooks/use-auth";
import { TaskSelector } from "@/components/sessions/task-selector";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Play, PenLine, Link2, Copy, Check, ExternalLink, Users } from "lucide-react";
import type { TemplateTask } from "@/types";

const PARTICIPANT_FIELDS = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "age", label: "Age" },
  { key: "gender", label: "Gender" },
  { key: "occupation", label: "Occupation" },
  { key: "tech_proficiency", label: "Tech Proficiency" },
  { key: "notes", label: "Notes" },
] as const;

export const Route = createFileRoute("/sessions/new")({
  component: NewSessionPage,
  validateSearch: (search: Record<string, unknown>): { templateId?: string } => ({
    templateId: (search.templateId as string) || undefined,
  }),
});

function NewSessionPage() {
  const navigate = useNavigate();
  const { templateId: preselectedTemplateId } = Route.useSearch();
  const { user } = useAuth();
  const { data: templates } = useTemplates();
  const { data: participants } = useParticipants();
  const createSession = useCreateSession();
  const createInvitation = useCreateInvitation();

  const meta = user?.user_metadata;
  const evaluatorName = meta?.first_name
    ? `${meta.first_name} ${meta.last_name || ""}`.trim()
    : (user?.email ?? "");

  const [templateId, setTemplateId] = useState(preselectedTemplateId ?? "");
  const [participantId, setParticipantId] = useState("");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [orderedTasks, setOrderedTasks] = useState<TemplateTask[]>([]);
  const [collectedFields, setCollectedFields] = useState<string[]>(
    PARTICIPANT_FIELDS.map((f) => f.key),
  );
  const [generatedLink, setGeneratedLink] = useState("");
  const [sharedLink, setSharedLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [sharedCopied, setSharedCopied] = useState(false);

  const { data: selectedTemplate } = useTemplate(templateId || undefined);

  // When template changes, reset task selection to all tasks
  useEffect(() => {
    if (selectedTemplate) {
      const tasks = selectedTemplate.template_tasks;
      setOrderedTasks(tasks);
      setSelectedTaskIds(tasks.map((t) => t.id));
      setGeneratedLink("");
    } else {
      setOrderedTasks([]);
      setSelectedTaskIds([]);
      setGeneratedLink("");
      setSharedLink("");
    }
  }, [selectedTemplate]);

  const canCreateDirect = templateId && participantId && selectedTaskIds.length > 0;
  const canGenerateLink = templateId && selectedTaskIds.length > 0;

  const getOrderedSelectedIds = () => {
    return orderedTasks.filter((t) => selectedTaskIds.includes(t.id)).map((t) => t.id);
  };

  const handleCreate = async (startLive: boolean) => {
    if (!canCreateDirect) return;
    try {
      const session = await createSession.mutateAsync({
        template_id: templateId,
        participant_id: participantId,
        evaluator_name: evaluatorName,
        status: startLive ? "in_progress" : "planned",
        selected_task_ids: getOrderedSelectedIds(),
      });
      toast.success("Session created");
      if (startLive) {
        navigate({
          to: "/sessions/$sessionId/live",
          params: { sessionId: session.id },
        });
      } else {
        navigate({
          to: "/sessions/$sessionId",
          params: { sessionId: session.id },
        });
      }
    } catch {
      toast.error("Failed to create session");
    }
  };

  const handleGenerateLink = async () => {
    if (!canGenerateLink) return;
    try {
      const invitation = await createInvitation.mutateAsync({
        template_id: templateId,
        evaluator_name: evaluatorName,
        selected_task_ids: getOrderedSelectedIds(),
        collected_fields: collectedFields,
        max_responses: 1,
      });
      const url = `${window.location.origin}/join/${invitation.code}`;
      setGeneratedLink(url);
      toast.success("Personal link generated");
    } catch {
      toast.error("Failed to generate link");
    }
  };

  const handleGenerateSharedLink = async () => {
    if (!canGenerateLink) return;
    try {
      const invitation = await createInvitation.mutateAsync({
        template_id: templateId,
        evaluator_name: evaluatorName,
        selected_task_ids: getOrderedSelectedIds(),
        collected_fields: collectedFields,
      });
      const url = `${window.location.origin}/join/${invitation.code}`;
      setSharedLink(url);
      toast.success("Shared link generated");
    } catch {
      toast.error("Failed to generate link");
    }
  };

  const handleCopyLink = async (link: string, setFn: (v: boolean) => void) => {
    await navigator.clipboard.writeText(link);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  return (
    <PageWrapper title="New Session" description="Set up a usability test session">
      <Card className="bg-transparent backdrop-blur-md">
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && orderedTasks.length > 0 && (
            <TaskSelector
              tasks={selectedTemplate.template_tasks}
              groups={selectedTemplate.task_groups ?? []}
              selectedIds={selectedTaskIds}
              onSelectedIdsChange={setSelectedTaskIds}
              orderedTasks={orderedTasks}
              onOrderChange={setOrderedTasks}
            />
          )}

          <Tabs defaultValue="direct" className="pt-2">
            <TabsList>
              <TabsTrigger value="direct">Direct</TabsTrigger>
              <TabsTrigger value="personal">Personal Link</TabsTrigger>
              <TabsTrigger value="shared">Shared Link</TabsTrigger>
            </TabsList>

            <TabsContent value="direct" className="space-y-4">
              <div className="space-y-2">
                <Label>Participant</Label>
                <Select value={participantId} onValueChange={setParticipantId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a participant" />
                  </SelectTrigger>
                  <SelectContent>
                    {participants?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button
                  disabled={!canCreateDirect || createSession.isPending}
                  onClick={() => handleCreate(true)}
                >
                  <Play className="mr-2 h-4 w-4" />
                  Start Live Session
                </Button>
                <Button
                  variant="outline"
                  disabled={!canCreateDirect || createSession.isPending}
                  onClick={() => handleCreate(false)}
                >
                  <PenLine className="mr-2 h-4 w-4" />
                  Enter Data Later
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="personal" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Generate a unique link for a single participant. Once they join, a session is created for them.
              </p>

              <div className="space-y-2">
                <Label>Evaluator</Label>
                <Input value={evaluatorName} readOnly className="bg-muted" />
              </div>

              <CollectedFieldsPicker
                collectedFields={collectedFields}
                onChange={(fields) => {
                  setCollectedFields(fields);
                  setGeneratedLink("");
                }}
              />

              {!generatedLink ? (
                <Button
                  disabled={!canGenerateLink || createInvitation.isPending}
                  onClick={handleGenerateLink}
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  Generate Personal Link
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Shareable Link</Label>
                    <div className="flex gap-2">
                      <Input value={generatedLink} readOnly className="bg-muted font-mono text-sm" />
                      <Button variant="outline" size="icon" onClick={() => handleCopyLink(generatedLink, setCopied)}>
                        {copied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate({ to: "/templates/$templateId", params: { templateId }, search: { tab: "sessions" } })}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Sessions
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="shared" className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Generate a link that multiple participants can use. Each person who opens it gets their own session.
              </p>

              <div className="space-y-2">
                <Label>Evaluator</Label>
                <Input value={evaluatorName} readOnly className="bg-muted" />
              </div>

              <CollectedFieldsPicker
                collectedFields={collectedFields}
                onChange={(fields) => {
                  setCollectedFields(fields);
                  setSharedLink("");
                }}
              />

              {!sharedLink ? (
                <Button
                  disabled={!canGenerateLink || createInvitation.isPending}
                  onClick={handleGenerateSharedLink}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Generate Shared Link
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Shareable Link (unlimited participants)</Label>
                    <div className="flex gap-2">
                      <Input value={sharedLink} readOnly className="bg-muted font-mono text-sm" />
                      <Button variant="outline" size="icon" onClick={() => handleCopyLink(sharedLink, setSharedCopied)}>
                        {sharedCopied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate({ to: "/templates/$templateId", params: { templateId }, search: { tab: "sessions" } })}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Sessions
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}

function CollectedFieldsPicker({
  collectedFields,
  onChange,
}: {
  collectedFields: string[];
  onChange: (fields: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>Collect from participant</Label>
      <p className="text-xs text-muted-foreground">
        Unchecked fields won't be shown. If "Name" is unchecked, a random ID is
        assigned and the participant won't appear in your participants list.
      </p>
      <div className="flex flex-wrap gap-4 pt-1">
        {PARTICIPANT_FIELDS.map((field) => (
          <label key={field.key} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={collectedFields.includes(field.key)}
              onCheckedChange={(checked) => {
                onChange(
                  checked
                    ? [...collectedFields, field.key]
                    : collectedFields.filter((f) => f !== field.key),
                );
              }}
            />
            {field.label}
          </label>
        ))}
      </div>
    </div>
  );
}
