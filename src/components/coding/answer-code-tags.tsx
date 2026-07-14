import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTagAnswer, useUntagAnswer } from "@/hooks/use-codes";
import type { TemplateCode, AnswerCode } from "@/types";
import { Tags } from "lucide-react";
import { toast } from "sonner";

interface AnswerCodeTagsProps {
  templateId: string;
  sessionId: string;
  codes: TemplateCode[];
  /** every tag row loaded for this session */
  answerCodes: AnswerCode[];
  /** which answer this row tags */
  answerRef:
    | { task_question_answer_id: string }
    | { interview_answer_id: string };
}

export function AnswerCodeTags({
  templateId,
  sessionId,
  codes,
  answerCodes,
  answerRef,
}: AnswerCodeTagsProps) {
  const tagAnswer = useTagAnswer();
  const untagAnswer = useUntagAnswer();

  const matches = (ac: AnswerCode) =>
    "task_question_answer_id" in answerRef
      ? ac.task_question_answer_id === answerRef.task_question_answer_id
      : ac.interview_answer_id === answerRef.interview_answer_id;

  const tags = answerCodes.filter(matches);
  const codeById = new Map(codes.map((c) => [c.id, c]));

  const toggle = (codeId: string) => {
    const existing = tags.find((t) => t.code_id === codeId);
    if (existing) {
      untagAnswer.mutate(
        {
          answer_code_id: existing.id,
          session_id: sessionId,
          template_id: templateId,
        },
        { onError: () => toast.error("Failed to remove code") },
      );
    } else {
      tagAnswer.mutate(
        {
          code_id: codeId,
          session_id: sessionId,
          template_id: templateId,
          ref: answerRef,
        },
        { onError: () => toast.error("Failed to tag answer") },
      );
    }
  };

  if (codes.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {tags.map((t) => {
        const code = codeById.get(t.code_id);
        if (!code) return null;
        return (
          <Badge
            key={t.id}
            variant="outline"
            className="gap-1 text-xs"
            style={{ borderColor: code.color, color: code.color }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: code.color }}
            />
            {code.code}
          </Badge>
        );
      })}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground"
          >
            <Tags className="mr-1 h-3 w-3" />
            {tags.length === 0 ? "Add codes" : "Edit"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>Codes</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {codes.map((c) => (
            <DropdownMenuCheckboxItem
              key={c.id}
              checked={tags.some((t) => t.code_id === c.id)}
              onCheckedChange={() => toggle(c.id)}
              onSelect={(e) => e.preventDefault()}
            >
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <span>
                  {c.code}
                  {c.description && (
                    <span className="block text-xs text-muted-foreground">
                      {c.description}
                    </span>
                  )}
                </span>
              </span>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
