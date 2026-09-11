import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  ClipboardCheck,
  Clock,
  RotateCcw,
  Send,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  REVIEW_MODES,
  REVIEW_STATUS_LABEL,
  gateClosed,
  reviewActions,
  type OrgRole,
  type ReviewMode,
} from "@/lib/review-gate";
import {
  useRequestReview,
  useReviewTemplate,
  useSetReviewMode,
} from "@/hooks/use-review";
import type { TemplateWithRelations } from "@/types";

const STATUS_ICON = {
  draft: RotateCcw,
  submitted: Clock,
  approved: CheckCircle2,
  changes_requested: XCircle,
} as const;

const STATUS_TONE: Record<string, string> = {
  draft: "text-muted-foreground",
  submitted: "text-amber-600 dark:text-amber-400",
  approved: "text-green-600 dark:text-green-400",
  changes_requested: "text-destructive",
};

/**
 * The instructor gate. Only shown on organization templates; hidden entirely
 * when the mode is off and the viewer cannot turn it on.
 *
 * The gate closes on recruiting, not on rehearsal: while a required review is
 * unapproved, join links are refused, but sessions can still be run and are
 * recorded as pilots, excluded from this template's analytics.
 */
export function ReviewGateCard({
  template,
  role,
  canEdit,
}: {
  template: TemplateWithRelations;
  role: OrgRole;
  canEdit: boolean;
}) {
  const [note, setNote] = useState("");
  const setMode = useSetReviewMode();
  const requestReview = useRequestReview();
  const review = useReviewTemplate();

  const actions = reviewActions(template, role, canEdit);
  if (!actions.active && !actions.canSetMode) return null;

  const Icon = STATUS_ICON[template.review_status];
  const closed = gateClosed(template);
  const busy = setMode.isPending || requestReview.isPending || review.isPending;

  return (
    <Card className="bg-transparent backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-base">
          <ClipboardCheck className="h-4 w-4 text-primary" />
          Instructor review
          {actions.active && (
            <Badge variant={closed ? "secondary" : "outline"} className="gap-1">
              <Icon className={`h-3 w-3 ${STATUS_TONE[template.review_status]}`} />
              {REVIEW_STATUS_LABEL[template.review_status]}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {actions.canSetMode && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Review is</span>
            <Select
              value={template.review_mode}
              disabled={busy}
              onValueChange={(v) =>
                setMode.mutate(
                  { templateId: template.id, mode: v as ReviewMode },
                  {
                    onSuccess: () => toast.success("Review mode updated"),
                    onError: (e: unknown) =>
                      toast.error(
                        e instanceof Error ? e.message : "Failed to update",
                      ),
                  },
                )
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REVIEW_MODES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">
              {REVIEW_MODES.find((m) => m.value === template.review_mode)?.hint}
            </span>
          </div>
        )}

        {closed && (
          <p className="rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">
            Join links are unavailable until this protocol is approved.
            Sessions can still be run to rehearse it; they are recorded as
            pilots and left out of this template's analytics, so the reviewer
            can see how the protocol behaves before approving it.
          </p>
        )}

        {template.approval_invalidated_at && template.review_status === "draft" && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            The protocol changed after it was last submitted, so it returned to
            draft on{" "}
            {new Date(template.approval_invalidated_at).toLocaleString()}.
          </p>
        )}

        {template.review_note && template.review_status !== "approved" && (
          <div className="rounded-md border-l-2 border-destructive bg-muted/40 p-3">
            <p className="text-xs font-medium">Reviewer asked for changes</p>
            <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
              {template.review_note}
            </p>
          </div>
        )}

        {template.review_status === "approved" && template.reviewed_at && (
          <p className="text-xs text-muted-foreground">
            Approved on {new Date(template.reviewed_at).toLocaleString()}.
            {template.review_note ? ` Note: ${template.review_note}` : ""}
          </p>
        )}

        {actions.canRequest && (
          <Button
            size="sm"
            disabled={busy}
            onClick={() =>
              requestReview.mutate(template.id, {
                onSuccess: () => toast.success("Sent for review"),
                onError: (e: unknown) =>
                  toast.error(e instanceof Error ? e.message : "Failed to send"),
              })
            }
          >
            <Send className="mr-2 h-4 w-4" />
            Request review
          </Button>
        )}

        {actions.canDecide && (
          <div className="space-y-2">
            <Textarea
              rows={3}
              value={note}
              placeholder="Feedback for the team (required when asking for changes)"
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                disabled={busy}
                onClick={() =>
                  review.mutate(
                    { templateId: template.id, decision: "approved", note },
                    {
                      onSuccess: () => {
                        setNote("");
                        toast.success("Protocol approved");
                      },
                      onError: (e: unknown) =>
                        toast.error(
                          e instanceof Error ? e.message : "Failed to approve",
                        ),
                    },
                  )
                }
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy || !note.trim()}
                onClick={() =>
                  review.mutate(
                    {
                      templateId: template.id,
                      decision: "changes_requested",
                      note,
                    },
                    {
                      onSuccess: () => {
                        setNote("");
                        toast.success("Changes requested");
                      },
                      onError: (e: unknown) =>
                        toast.error(
                          e instanceof Error ? e.message : "Failed to send",
                        ),
                    },
                  )
                }
              >
                <XCircle className="mr-2 h-4 w-4" />
                Request changes
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
