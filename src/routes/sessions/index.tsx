import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useSessions, useDeleteSession, useSessionsRealtime } from "@/hooks/use-sessions";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useViewMode } from "@/hooks/use-view-mode";
import { Plus, Trash2, ExternalLink, ClipboardList, Pencil, List, LayoutGrid } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/sessions/")({
  component: SessionsPage,
});

const statusStyles: Record<string, string> = {
  planned:
    "ring-1 ring-amber-400/30 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/20",
  in_progress:
    "ring-1 ring-indigo-400/30 bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-400/20",
  completed:
    "ring-1 ring-emerald-400/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20",
};

function SessionsPage() {
  const { data: sessions, isLoading } = useSessions();
  useSessionsRealtime();
  const deleteSession = useDeleteSession();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useViewMode("sessions-view");
  const [previewSession, setPreviewSession] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const filtered = sessions?.filter(
    (s: any) => statusFilter === "all" || s.status === statusFilter,
  );

  return (
    <PageWrapper
      title="Sessions"
      description="Manage usability test sessions"
      actions={
        <Button asChild>
          <Link to="/sessions/new" search={{}}>
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </Link>
        </Button>
      }
    >
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex rounded-md border">
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-r-none"
            onClick={() => setViewMode("table")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "card" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-l-none"
            onClick={() => setViewMode("card")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading && <p className="text-muted-foreground">Loading...</p>}

      {filtered && filtered.length === 0 && (
        <EmptyState
          variant="sessions"
          title="No sessions found"
          description="Create a new test session to start collecting usability data from your participants."
          action={
            <Button asChild>
              <Link to="/sessions/new" search={{}}>
                <Plus className="mr-2 h-4 w-4" />
                New Session
              </Link>
            </Button>
          }
        />
      )}

      {filtered && filtered.length > 0 && viewMode === "table" && (
        <div className="rounded-md border bg-transparent backdrop-blur-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Participant</TableHead>
                <TableHead>Evaluator</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s: any) => (
                <TableRow
                  key={s.id}
                  className="cursor-pointer"
                  onClick={() => setPreviewSession(s)}
                >
                  <TableCell className="font-medium">
                    {s.templates?.name}
                  </TableCell>
                  <TableCell>{s.participants?.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.evaluator_name}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[s.status] || ""}`}
                    >
                      {s.status.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate({
                            to: "/sessions/$sessionId",
                            params: { sessionId: s.id },
                          });
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(s);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {filtered && filtered.length > 0 && viewMode === "card" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s: any) => (
            <Card
              key={s.id}
              className="cursor-pointer bg-transparent backdrop-blur-md transition-colors hover:bg-muted/50"
              onClick={() => setPreviewSession(s)}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium leading-tight">
                  {s.templates?.name}
                </CardTitle>
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[s.status] || ""}`}
                >
                  {s.status.replace("_", " ")}
                </span>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Participant:</span>{" "}
                    {s.participants?.name || "—"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Evaluator:</span>{" "}
                    {s.evaluator_name || "—"}
                  </p>
                  <p className="text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1 border-t pt-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate({
                        to: "/sessions/$sessionId",
                        params: { sessionId: s.id },
                      });
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(s);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        open={!!previewSession}
        onOpenChange={(open) => !open && setPreviewSession(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>
                  {previewSession?.templates?.name}
                </DialogTitle>
                <DialogDescription>Session details</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator />
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                Participant
              </p>
              <p className="mt-0.5 text-foreground">
                {previewSession?.participants?.name || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                Evaluator
              </p>
              <p className="mt-0.5 text-foreground">
                {previewSession?.evaluator_name || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                Status
              </p>
              <div className="mt-0.5">
                {previewSession && (
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[previewSession.status] || ""}`}
                  >
                    {previewSession.status.replace("_", " ")}
                  </span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                Created
              </p>
              <p className="mt-0.5 text-foreground">
                {previewSession
                  ? new Date(previewSession.created_at).toLocaleDateString()
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                Started
              </p>
              <p className="mt-0.5 text-foreground">
                {previewSession?.started_at
                  ? new Date(previewSession.started_at).toLocaleDateString()
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                Completed
              </p>
              <p className="mt-0.5 text-foreground">
                {previewSession?.completed_at
                  ? new Date(previewSession.completed_at).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>
          {previewSession?.notes && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                  Notes
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {previewSession.notes}
                </p>
              </div>
            </>
          )}
          <Separator />
          <DialogFooter>
            <div className="flex w-full items-center justify-between">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setPreviewSession(null);
                    navigate({
                      to: "/sessions/$sessionId",
                      params: { sessionId: previewSession.id },
                    });
                  }}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-destructive hover:text-white hover:border-destructive"
                  onClick={() => {
                    setPreviewSession(null);
                    setDeleteTarget(previewSession);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
              <DialogClose asChild>
                <Button variant="ghost" size="sm">
                  Close
                </Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete session"
        description="Are you sure you want to delete this session? This action cannot be undone."
        onConfirm={() => {
          deleteSession.mutate(deleteTarget.id, {
            onSuccess: () => toast.success("Session deleted"),
            onError: () => toast.error("Failed to delete"),
          });
        }}
      />
    </PageWrapper>
  );
}
