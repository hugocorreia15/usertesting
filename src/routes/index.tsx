import { createFileRoute, Link } from "@tanstack/react-router";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTemplates } from "@/hooks/use-templates";
import { useParticipants } from "@/hooks/use-participants";
import { useSessions } from "@/hooks/use-sessions";
import { FileText, Users, ClipboardList, Plus } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: templates } = useTemplates();
  const { data: participants } = useParticipants();
  const { data: sessions } = useSessions();

  const completedSessions =
    sessions?.filter((s: any) => s.status === "completed").length ?? 0;

  return (
    <PageWrapper title="Dashboard" description="Overview of your usability testing">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card data-animate-card className="bg-transparent backdrop-blur-md transition-all duration-200 hover:bg-muted/50 hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-500/10">
              <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates?.length ?? 0}</div>
          </CardContent>
        </Card>
        <Card data-animate-card className="bg-transparent backdrop-blur-md transition-all duration-200 hover:bg-muted/50 hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-500/10">
              <Users className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {participants?.length ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card data-animate-card className="bg-transparent backdrop-blur-md transition-all duration-200 hover:bg-muted/50 hover:-translate-y-0.5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Sessions (Completed)
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-500/10">
              <ClipboardList className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedSessions} / {sessions?.length ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/templates/new">
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/participants/new">
            <Plus className="mr-2 h-4 w-4" />
            New Participant
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/sessions/new" search={{}}>
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </Link>
        </Button>
      </div>

      {sessions && sessions.length > 0 && (
        <Card className="bg-transparent backdrop-blur-md">
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sessions.slice(0, 5).map((session: any) => (
                <Link
                  key={session.id}
                  to="/sessions/$sessionId"
                  params={{ sessionId: session.id }}
                  className="flex items-center justify-between rounded-md border p-3 transition-all duration-200 hover:bg-muted hover:border-l-2 hover:border-l-accent"
                >
                  <div>
                    <p className="font-medium">{session.templates?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.participants?.name} &middot;{" "}
                      {session.evaluator_name}
                    </p>
                  </div>
                  <span className="text-xs capitalize text-muted-foreground">
                    {session.status}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </PageWrapper>
  );
}
