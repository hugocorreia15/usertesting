import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buildCodeMatrix } from "@/lib/coding";
import type {
  TemplateCodeWithAnswers,
  TestSessionWithRelations,
} from "@/types";

interface CodeMatrixProps {
  codes: TemplateCodeWithAnswers[];
  sessions: TestSessionWithRelations[];
}

export function CodeMatrix({ codes, sessions }: CodeMatrixProps) {
  const rows = buildCodeMatrix(codes, sessions);
  const totalsBySession = sessions.map((s) =>
    rows.reduce((sum, r) => sum + (r.countsBySession[s.id] ?? 0), 0),
  );
  const grandTotal = rows.reduce((sum, r) => sum + r.total, 0);

  return (
    <Card className="bg-transparent backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-base">
          Code frequency matrix
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          How often each code was applied per session.
        </p>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No codes defined yet.
          </p>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No sessions yet — the matrix fills in as sessions are coded.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-36">Code</TableHead>
                  {sessions.map((s) => (
                    <TableHead key={s.id} className="text-center">
                      {s.participants?.name ?? "Unknown"}
                    </TableHead>
                  ))}
                  <TableHead className="text-center font-semibold">
                    Total
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.codeId}>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: r.color }}
                        />
                        <span className="font-medium">{r.code}</span>
                      </span>
                      {r.description && (
                        <span className="block pl-4.5 text-xs text-muted-foreground">
                          {r.description}
                        </span>
                      )}
                    </TableCell>
                    {sessions.map((s) => {
                      const count = r.countsBySession[s.id] ?? 0;
                      return (
                        <TableCell
                          key={s.id}
                          className={
                            count > 0
                              ? "text-center font-medium"
                              : "text-center text-muted-foreground/50"
                          }
                        >
                          {count}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-semibold">
                      {r.total}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-semibold">All codes</TableCell>
                  {totalsBySession.map((t, i) => (
                    <TableCell
                      key={sessions[i].id}
                      className="text-center font-semibold"
                    >
                      {t}
                    </TableCell>
                  ))}
                  <TableCell className="text-center font-semibold">
                    {grandTotal}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
