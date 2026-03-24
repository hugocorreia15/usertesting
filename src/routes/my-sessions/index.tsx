import { createFileRoute } from "@tanstack/react-router";
import { useParticipantSessions } from "@/hooks/use-participant-sessions";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Link } from "@tanstack/react-router";
import { CalendarDays } from "lucide-react";

export const Route = createFileRoute("/my-sessions/")({
  component: ParticipantDashboard,
});

function ParticipantDashboard() {
  const { data: sessions, isLoading } = useParticipantSessions();

  return (
    <PageWrapper title="My Sessions" description="View your assigned testing sessions">
      {isLoading && (
        <p className="text-muted-foreground">Loading sessions...</p>
      )}

      {sessions && sessions.length === 0 && (
        <EmptyState
          variant="sessions"
          title="No sessions yet"
          description="You'll see your testing sessions here once an evaluator assigns you."
        />
      )}

      {sessions && sessions.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((session: any) => (
            <Link
              key={session.id}
              to="/my-sessions/$sessionId"
              params={{ sessionId: session.id }}
            >
              <Card className="bg-transparent backdrop-blur-md transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-base leading-tight">
                      {session.templates?.name ?? "Untitled Template"}
                    </h3>
                    <Badge
                      variant={
                        session.status === "completed"
                          ? "default"
                          : session.status === "in_progress"
                            ? "secondary"
                            : "outline"
                      }
                      className="capitalize shrink-0"
                    >
                      {session.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(session.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageWrapper>
  );
}
