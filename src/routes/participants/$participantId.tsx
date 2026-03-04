import { createFileRoute } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/page-wrapper";
import {
  ParticipantForm,
  type ParticipantFormData,
} from "@/components/participants/participant-form";
import {
  useParticipant,
  useUpdateParticipant,
} from "@/hooks/use-participants";
import { useSessions } from "@/hooks/use-sessions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export const Route = createFileRoute("/participants/$participantId")({
  component: ParticipantDetailPage,
});

function ParticipantDetailPage() {
  const { participantId } = Route.useParams();
  const { data: participant, isLoading } = useParticipant(participantId);
  const update = useUpdateParticipant();
  const { data: allSessions } = useSessions();

  const sessions = allSessions?.filter(
    (s: any) => s.participant_id === participantId,
  );

  if (isLoading) return <p className="p-6 text-muted-foreground">Loading...</p>;
  if (!participant)
    return <p className="p-6 text-muted-foreground">Participant not found.</p>;

  const handleSubmit = async (data: ParticipantFormData) => {
    try {
      await update.mutateAsync({
        id: participantId,
        created_at: participant.created_at,
        user_id: participant.user_id,
        name: data.name,
        email: data.email || null,
        age: data.age ? parseInt(data.age) : null,
        gender: data.gender || null,
        occupation: data.occupation || null,
        tech_proficiency:
          (data.tech_proficiency as "low" | "medium" | "high") || null,
        notes: data.notes || null,
      });
      toast.success("Participant updated");
    } catch {
      toast.error("Failed to update participant");
    }
  };

  return (
    <PageWrapper title="Edit Participant" description={participant.name}>
      <ParticipantForm
        initial={participant}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
      />

      {sessions && sessions.length > 0 && (
        <Card className="bg-transparent backdrop-blur-md">
          <CardHeader>
            <CardTitle>Session History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sessions.map((s: any) => (
              <Link
                key={s.id}
                to="/sessions/$sessionId"
                params={{ sessionId: s.id }}
                className="flex items-center justify-between rounded-md border p-3 transition-colors hover:bg-muted"
              >
                <div>
                  <p className="font-medium">{s.templates?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {s.status}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </PageWrapper>
  );
}
