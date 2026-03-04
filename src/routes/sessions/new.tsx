import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTemplates } from "@/hooks/use-templates";
import { useParticipants } from "@/hooks/use-participants";
import { useCreateSession } from "@/hooks/use-sessions";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Play, PenLine } from "lucide-react";

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

  const meta = user?.user_metadata;
  const evaluatorName = meta?.first_name
    ? `${meta.first_name} ${meta.last_name || ""}`.trim()
    : (user?.email ?? "");

  const [templateId, setTemplateId] = useState(preselectedTemplateId ?? "");
  const [participantId, setParticipantId] = useState("");

  const canCreate = templateId && participantId;

  const handleCreate = async (startLive: boolean) => {
    if (!canCreate) return;
    try {
      const session = await createSession.mutateAsync({
        template_id: templateId,
        participant_id: participantId,
        evaluator_name: evaluatorName,
        status: startLive ? "in_progress" : "planned",
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

          <div className="flex gap-3 pt-4">
            <Button
              disabled={!canCreate || createSession.isPending}
              onClick={() => handleCreate(true)}
            >
              <Play className="mr-2 h-4 w-4" />
              Start Live Session
            </Button>
            <Button
              variant="outline"
              disabled={!canCreate || createSession.isPending}
              onClick={() => handleCreate(false)}
            >
              <PenLine className="mr-2 h-4 w-4" />
              Enter Data Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
