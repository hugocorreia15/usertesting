import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Lock, MessageSquareQuote, Send } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  useSaveReflection,
  useSessionReflections,
  useSubmitReflection,
} from "@/hooks/use-reflections";
import {
  MIN_ANSWER_LENGTH,
  REFLECTION_PROMPTS,
  reflectionComplete,
  reflectionEvidence,
  type ReflectionAnswers,
} from "@/lib/reflection";
import type {
  ObserverNote,
  RaterScore,
  SessionReflection,
  TaskResultWithRelations,
} from "@/types";

const EMPTY: ReflectionAnswers = { surprised: "", protocol_change: "", may_have_led: "" };

/**
 * Reflection after a completed session. Shown to anyone who can open the
 * session, but only opened as a form for people who took part in it: the
 * moderator, an observer who took notes, or a co-rater.
 */
export function ReflectionCard({
  sessionId,
  sessionOwnerId,
  taskResults,
  observerNotes,
  raterScores,
}: {
  sessionId: string;
  sessionOwnerId: string | null;
  taskResults: TaskResultWithRelations[];
  observerNotes: ObserverNote[];
  raterScores: RaterScore[];
}) {
  const { user } = useAuth();
  const { data: reflections } = useSessionReflections(sessionId);

  const mine = reflections?.find((r) => r.user_id === user?.id) ?? null;
  const others = (reflections ?? []).filter(
    (r) => r.user_id !== user?.id && r.submitted_at,
  );

  const tookPart =
    !!user &&
    (sessionOwnerId === user.id ||
      observerNotes.some((n) => n.author_id === user.id) ||
      raterScores.some((s) => s.rater_id === user.id));

  const [writing, setWriting] = useState(false);
  const showForm = !mine?.submitted_at && (tookPart || writing || !!mine);

  return (
    <Card className="bg-transparent backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <MessageSquareQuote className="h-4 w-4 text-primary" />
          Reflection
          {mine?.submitted_at && <Badge variant="secondary">Yours is in</Badge>}
          {mine && !mine.submitted_at && <Badge variant="outline">Draft</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 text-sm">
        {showForm && user && (
          <ReflectionForm
            sessionId={sessionId}
            userId={user.id}
            existing={mine}
            taskResults={taskResults}
            observerNotes={observerNotes}
          />
        )}

        {!showForm && !mine && user && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground">
              Took part in this session without logging anything? You can still
              reflect on it.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer"
              onClick={() => setWriting(true)}
            >
              Write a reflection
            </Button>
          </div>
        )}

        {mine?.submitted_at && (
          <ReflectionView reflection={mine} label="You" />
        )}

        {others.length > 0 && (
          <div className="space-y-3 border-t pt-4">
            <p className="font-medium">
              {others.length === 1 ? "Another reflection" : `${others.length} other reflections`}
            </p>
            {others.map((r, i) => (
              <ReflectionView
                key={r.id}
                reflection={r}
                label={r.user_id === sessionOwnerId ? "The moderator" : `Reflection ${i + 1}`}
              />
            ))}
          </div>
        )}

        {!mine?.submitted_at && others.length === 0 && !showForm && (
          <p className="text-xs text-muted-foreground">
            Teammates' reflections appear here once you have submitted your own,
            so that nobody writes theirs after reading someone else's.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ReflectionForm({
  sessionId,
  userId,
  existing,
  taskResults,
  observerNotes,
}: {
  sessionId: string;
  userId: string;
  existing: SessionReflection | null;
  taskResults: TaskResultWithRelations[];
  observerNotes: ObserverNote[];
}) {
  const save = useSaveReflection();
  const submit = useSubmitReflection();
  const [answers, setAnswers] = useState<ReflectionAnswers>(EMPTY);
  const [confirm, setConfirm] = useState(false);

  // Load the stored draft only when the stored version changes. Keying on the
  // object itself would reset the form on every background refetch, such as
  // the one that runs when the window regains focus, and throw away whatever
  // the student had typed but not yet saved.
  const loadedVersion = useRef<string | null>(null);
  useEffect(() => {
    if (!existing || loadedVersion.current === existing.updated_at) return;
    loadedVersion.current = existing.updated_at;
    setAnswers({
      surprised: existing.surprised,
      protocol_change: existing.protocol_change,
      may_have_led: existing.may_have_led,
    });
  }, [existing]);

  const evidence = useMemo(
    () =>
      reflectionEvidence({
        results: taskResults,
        tasks: taskResults.map((tr) => ({
          id: tr.task_id,
          name: tr.template_tasks.name,
          optimal_time_seconds: tr.template_tasks.optimal_time_seconds,
          is_practice: tr.template_tasks.is_practice,
        })),
        notes: observerNotes,
        viewerId: userId,
      }),
    [taskResults, observerNotes, userId],
  );

  const complete = reflectionComplete(answers);
  const dirty =
    !existing ||
    existing.surprised !== answers.surprised ||
    existing.protocol_change !== answers.protocol_change ||
    existing.may_have_led !== answers.may_have_led;

  const saveDraft = (then?: () => void) =>
    save.mutate(
      { sessionId, userId, existingId: existing?.id ?? null, answers },
      {
        onSuccess: () => {
          if (then) then();
          else toast.success("Draft saved. Only you can see it.");
        },
        onError: (e: unknown) =>
          toast.error(e instanceof Error ? e.message : "Could not save"),
      },
    );

  const doSubmit = () => {
    const send = () =>
      submit.mutate(sessionId, {
        onSuccess: () => toast.success("Reflection submitted"),
        onError: (e: unknown) =>
          toast.error(e instanceof Error ? e.message : "Could not submit"),
      });
    // Submission reads what is stored, so an unsaved edit must land first.
    if (dirty) saveDraft(send);
    else send();
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
      <div className="space-y-4">
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Write this before reading anyone else's. It stays a private draft until
          you submit it, and submitting is final.
        </p>

        {REFLECTION_PROMPTS.map((p) => {
          const len = answers[p.key].trim().length;
          return (
            <div key={p.key} className="space-y-1.5">
              <Label htmlFor={`reflect-${p.key}`}>{p.question}</Label>
              <p className="text-xs text-muted-foreground">{p.guidance}</p>
              <Textarea
                id={`reflect-${p.key}`}
                rows={3}
                value={answers[p.key]}
                onChange={(e) =>
                  setAnswers((a) => ({ ...a, [p.key]: e.target.value }))
                }
              />
              {len > 0 && len < MIN_ANSWER_LENGTH && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  A little more: say which task, and what happened.
                </p>
              )}
            </div>
          );
        })}

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="cursor-pointer"
            disabled={!dirty || save.isPending}
            onClick={() => saveDraft()}
          >
            Save draft
          </Button>
          <Button
            size="sm"
            disabled={!complete || save.isPending || submit.isPending}
            onClick={() => setConfirm(true)}
          >
            <Send className="mr-2 h-4 w-4" />
            Submit reflection
          </Button>
        </div>

        <ConfirmDialog
          open={confirm}
          onOpenChange={setConfirm}
          title="Submit your reflection?"
          description="It will be frozen, your instructor will be able to read it, and you will be able to read what teammates wrote about this session once they have submitted theirs."
          confirmLabel="Submit"
          onConfirm={doSubmit}
        />
      </div>

      <aside className="space-y-3 rounded-md border bg-muted/30 p-3 text-xs">
        <p className="font-medium">What the session recorded</p>
        {evidence.quiet ? (
          <p className="text-muted-foreground">
            Nothing stood out: every task succeeded without hesitations or
            errors, and nobody else took notes. That can be true. It is also what
            a session looks like when a moderator quietly helped.
          </p>
        ) : (
          <>
            {evidence.moments.length > 0 && (
              <ul className="space-y-2">
                {evidence.moments.map((m) => (
                  <li key={m.taskId}>
                    <span className="font-medium">{m.taskName}</span>
                    <span className="block text-muted-foreground">{m.reason}</span>
                  </li>
                ))}
              </ul>
            )}
            {evidence.peerNotes.length > 0 && (
              <div className="space-y-1.5 border-t pt-2">
                <p className="font-medium">Noted by someone watching</p>
                <ul className="space-y-1.5">
                  {evidence.peerNotes.slice(0, 6).map((n) => (
                    <li key={n.id} className="text-muted-foreground">
                      {n.task_index !== null ? `Task ${n.task_index + 1}: ` : ""}
                      {n.note}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  );
}

function ReflectionView({
  reflection,
  label,
}: {
  reflection: SessionReflection;
  label: string;
}) {
  return (
    <div className="space-y-2 rounded-md border p-3">
      <p className="text-xs text-muted-foreground">
        {label}
        {reflection.submitted_at
          ? `, submitted ${new Date(reflection.submitted_at).toLocaleString()}`
          : ""}
      </p>
      {REFLECTION_PROMPTS.map((p) => (
        <div key={p.key}>
          <p className="text-xs font-medium">{p.question}</p>
          <p className="whitespace-pre-wrap">{reflection[p.key]}</p>
        </div>
      ))}
    </div>
  );
}
