import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageWrapper } from "@/components/layout/page-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
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
import {
  useParticipants,
  useDeleteParticipant,
} from "@/hooks/use-participants";
import { useSessions } from "@/hooks/use-sessions";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useViewMode } from "@/hooks/use-view-mode";
import { Plus, Trash2, Search, Pencil, User, List, LayoutGrid } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/participants/")({
  component: ParticipantsPage,
});

function ParticipantsPage() {
  const { data: participants, isLoading } = useParticipants();
  const { data: allSessions } = useSessions();
  const deleteParticipant = useDeleteParticipant();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useViewMode("participants-view");
  const [previewParticipant, setPreviewParticipant] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const participantSessions = allSessions?.filter(
    (s: any) => s.participant_id === previewParticipant?.id,
  );

  const filtered = participants?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PageWrapper
      title="Participants"
      description="Manage test participants"
      actions={
        <Button asChild>
          <Link to="/participants/new">
            <Plus className="mr-2 h-4 w-4" />
            New Participant
          </Link>
        </Button>
      }
    >
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search participants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
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

      {filtered && filtered.length === 0 && !search && (
        <EmptyState
          variant="participants"
          title="No participants yet"
          description="Add your first participant to start running usability test sessions."
          action={
            <Button asChild>
              <Link to="/participants/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Participant
              </Link>
            </Button>
          }
        />
      )}

      {filtered && filtered.length === 0 && search && (
        <p className="text-center text-muted-foreground py-8">
          No participants match your search.
        </p>
      )}

      {filtered && filtered.length > 0 && viewMode === "table" && (
        <div className="rounded-md border bg-transparent backdrop-blur-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Occupation</TableHead>
                <TableHead>Tech Proficiency</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => setPreviewParticipant(p)}
                >
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.email || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {p.occupation || "—"}
                  </TableCell>
                  <TableCell>
                    {p.tech_proficiency && (
                      <Badge variant="secondary" className="capitalize">
                        {p.tech_proficiency}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate({
                            to: "/participants/$participantId",
                            params: { participantId: p.id },
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
                          setDeleteTarget(p);
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
          {filtered.map((p) => (
            <Card
              key={p.id}
              className="cursor-pointer bg-transparent backdrop-blur-md transition-colors hover:bg-muted/50"
              onClick={() => setPreviewParticipant(p)}
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium leading-tight">
                  {p.name}
                </CardTitle>
                {p.tech_proficiency && (
                  <Badge variant="secondary" className="shrink-0 capitalize text-xs">
                    {p.tech_proficiency}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    {p.email || "—"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Occupation:</span>{" "}
                    {p.occupation || "—"}
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
                        to: "/participants/$participantId",
                        params: { participantId: p.id },
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
                      setDeleteTarget(p);
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
        open={!!previewParticipant}
        onOpenChange={(open) => !open && setPreviewParticipant(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle>{previewParticipant?.name}</DialogTitle>
                <DialogDescription>
                  {previewParticipant?.email || "No email"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator />
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                Age
              </p>
              <p className="mt-0.5 text-foreground">
                {previewParticipant?.age || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                Gender
              </p>
              <p className="mt-0.5 text-foreground">
                {previewParticipant?.gender || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                Occupation
              </p>
              <p className="mt-0.5 text-foreground">
                {previewParticipant?.occupation || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                Tech Proficiency
              </p>
              <p className="mt-0.5 capitalize text-foreground">
                {previewParticipant?.tech_proficiency || "—"}
              </p>
            </div>
          </div>
          {previewParticipant?.notes && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                  Notes
                </p>
                <p className="mt-1 text-sm text-foreground">
                  {previewParticipant.notes}
                </p>
              </div>
            </>
          )}
          <Separator />
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              Session History
            </p>
            {participantSessions && participantSessions.length > 0 ? (
              <div className="mt-2 space-y-1.5">
                {participantSessions.map((s: any) => (
                  <Link
                    key={s.id}
                    to="/sessions/$sessionId"
                    params={{ sessionId: s.id }}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted"
                    onClick={() => setPreviewParticipant(null)}
                  >
                    <div>
                      <p className="font-medium">{s.templates?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="capitalize text-xs">
                      {s.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">
                No sessions yet
              </p>
            )}
          </div>
          <Separator />
          <DialogFooter>
            <div className="flex w-full items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPreviewParticipant(null);
                    navigate({
                      to: "/participants/$participantId",
                      params: { participantId: previewParticipant.id },
                    });
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-destructive hover:text-white hover:border-destructive"
                  onClick={() => {
                    setPreviewParticipant(null);
                    setDeleteTarget(previewParticipant);
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
        title="Delete participant"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={() => {
          deleteParticipant.mutate(deleteTarget.id, {
            onSuccess: () => toast.success("Participant deleted"),
            onError: () => toast.error("Failed to delete"),
          });
        }}
      />
    </PageWrapper>
  );
}
