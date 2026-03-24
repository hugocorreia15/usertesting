import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import {
  ParticipantForm,
  type ParticipantFormData,
} from "@/components/participants/participant-form";
import {
  useParticipant,
  useUpdateParticipant,
  useInviteParticipant,
} from "@/hooks/use-participants";
import { useSessions } from "@/hooks/use-sessions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Copy, Mail, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/participants/$participantId")({
  component: ParticipantDetailPage,
});

function ParticipantDetailPage() {
  const { participantId } = Route.useParams();
  const { data: participant, isLoading } = useParticipant(participantId);
  const update = useUpdateParticipant();
  const invite = useInviteParticipant();
  const { data: allSessions } = useSessions();
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

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
        auth_user_id: participant.auth_user_id,
        is_anonymous: participant.is_anonymous,
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

  const handleInvite = async () => {
    if (!participant.email) {
      toast.error("Participant needs an email address to be invited");
      return;
    }
    try {
      const creds = await invite.mutateAsync({
        email: participant.email,
        participantId,
        name: participant.name,
      });
      setCredentials(creds);
      toast.success("Portal access created");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to invite participant");
    }
  };

  const canInvite = participant.email && !participant.auth_user_id;
  const hasPortalAccess = !!participant.auth_user_id;

  return (
    <PageWrapper
      title="Edit Participant"
      description={participant.name}
      actions={
        <div className="flex items-center gap-2">
          {hasPortalAccess && (
            <Badge variant="secondary" className="gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Portal Access Active
            </Badge>
          )}
          {canInvite && (
            <Button
              onClick={handleInvite}
              disabled={invite.isPending}
              variant="outline"
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              {invite.isPending ? "Creating..." : "Invite to Portal"}
            </Button>
          )}
        </div>
      }
    >
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

      {/* Credentials Dialog */}
      <Dialog open={!!credentials} onOpenChange={(open) => !open && setCredentials(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Portal Credentials Created</DialogTitle>
            <DialogDescription>
              Share these credentials with {participant.name} so they can log in to the participant portal.
            </DialogDescription>
          </DialogHeader>
          {credentials && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-mono text-sm">{credentials.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(credentials.email);
                      toast.success("Email copied");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Password</p>
                    <p className="font-mono text-sm">{credentials.password}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(credentials.password);
                      toast.success("Password copied");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Email: ${credentials.email}\nPassword: ${credentials.password}`,
                  );
                  toast.success("Credentials copied to clipboard");
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy All
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Make sure to save these credentials — the password cannot be retrieved later.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}
