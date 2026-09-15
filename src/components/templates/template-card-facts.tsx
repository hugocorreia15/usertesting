import { Badge } from "@/components/ui/badge";
import {
  attentionItems,
  countChips,
  readiness,
  reviewChip,
  type Chip,
  type TemplateFacts,
} from "@/lib/template-summary";
import type { Template } from "@/types";

/** Facts from a row plus its counts, in one place so list and preview agree. */
export function factsFor(
  template: Template,
  counts: { tasks: number; sessions: number; inspections: number },
): TemplateFacts {
  return {
    ...counts,
    reviewMode: template.review_mode as TemplateFacts["reviewMode"],
    reviewStatus: template.review_status as TemplateFacts["reviewStatus"],
    approvalInvalidatedAt: template.approval_invalidated_at,
    hasConsent: !!template.consent_text?.trim(),
    isShared: !!template.org_id,
    isPublic: template.is_public,
    requiresInspection: !!template.require_inspection,
  };
}

const toneClass: Record<Chip["tone"], string> = {
  neutral: "",
  good: "border-emerald-500/40 text-emerald-700 dark:text-emerald-400",
  warning: "border-amber-500/50 text-amber-700 dark:text-amber-400",
};

function ChipBadge({ chip }: { chip: Chip }) {
  return (
    <Badge variant="outline" className={`font-normal ${toneClass[chip.tone]}`} title={chip.title}>
      {chip.label}
    </Badge>
  );
}

/**
 * The line of facts on a card: where the study has got to, then what it holds.
 * Readiness comes first because it is the answer to the question someone
 * scanning this page is asking.
 */
export function TemplateCardFacts({ facts }: { facts: TemplateFacts }) {
  const review = reviewChip(facts);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <ChipBadge chip={readiness(facts)} />
      {review && <ChipBadge chip={review} />}
      {countChips(facts).map((c) => (
        <ChipBadge key={c.label} chip={c} />
      ))}
    </div>
  );
}

/** The same problems spelled out, for the preview where there is room. */
export function TemplateAttention({ facts }: { facts: TemplateFacts }) {
  const items = attentionItems(facts);
  if (items.length === 0) return null;
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item} className="text-xs text-amber-700 dark:text-amber-400">
          {item}
        </li>
      ))}
    </ul>
  );
}
