import { Link } from "@tanstack/react-router";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calculateSusScore } from "@/lib/sus";
import type { TestSessionWithRelations, Participant } from "@/types";

interface TemplateParticipantsTabProps {
  sessions: TestSessionWithRelations[];
}

interface ParticipantRow {
  participant: Participant;
  sessionCount: number;
  completedCount: number;
  avgSusScore: number | null;
  lastSessionDate: string;
}

function deriveParticipants(
  sessions: TestSessionWithRelations[],
): ParticipantRow[] {
  const map = new Map<
    string,
    {
      participant: Participant;
      sessions: TestSessionWithRelations[];
    }
  >();

  for (const session of sessions) {
    if (!session.participants) continue;
    const pid = session.participant_id;
    if (!map.has(pid)) {
      map.set(pid, { participant: session.participants, sessions: [] });
    }
    map.get(pid)!.sessions.push(session);
  }

  return Array.from(map.values()).map(({ participant, sessions: pSessions }) => {
    const completedCount = pSessions.filter(
      (s) => s.status === "completed",
    ).length;

    const susScores = pSessions
      .map((s) => calculateSusScore(s.sus_answers || []))
      .filter((s): s is number => s != null);

    const avgSusScore =
      susScores.length > 0
        ? Math.round(
            (susScores.reduce((a, b) => a + b, 0) / susScores.length) * 10,
          ) / 10
        : null;

    const lastSessionDate = pSessions.reduce((latest, s) => {
      return s.created_at > latest ? s.created_at : latest;
    }, pSessions[0].created_at);

    return {
      participant,
      sessionCount: pSessions.length,
      completedCount,
      avgSusScore,
      lastSessionDate,
    };
  });
}

export function TemplateParticipantsTab({
  sessions,
}: TemplateParticipantsTabProps) {
  const participants = deriveParticipants(sessions);

  if (participants.length === 0) {
    return (
      <EmptyState
        variant="sessions"
        title="No participants"
        description="No participants have been assigned to sessions for this template."
      />
    );
  }

  return (
    <div className="rounded-md border bg-transparent backdrop-blur-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Tech Proficiency</TableHead>
            <TableHead className="text-center">Sessions</TableHead>
            <TableHead className="text-center">Completed</TableHead>
            <TableHead className="text-center">Avg SUS</TableHead>
            <TableHead>Last Session</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participants.map((row) => (
            <TableRow key={row.participant.id}>
              <TableCell className="font-medium">
                <Link
                  to="/participants/$participantId"
                  params={{ participantId: row.participant.id }}
                  className="text-primary hover:underline"
                >
                  {row.participant.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {row.participant.email || "—"}
              </TableCell>
              <TableCell className="capitalize text-muted-foreground">
                {row.participant.tech_proficiency || "—"}
              </TableCell>
              <TableCell className="text-center">{row.sessionCount}</TableCell>
              <TableCell className="text-center">
                {row.completedCount}
              </TableCell>
              <TableCell className="text-center">
                {row.avgSusScore != null ? row.avgSusScore : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(row.lastSessionDate).toLocaleDateString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
