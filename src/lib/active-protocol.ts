/**
 * Hide the parts of a protocol that have been archived.
 *
 * A question or error type that participants answered is archived rather than
 * deleted when it leaves the protocol, so the study keeps its record
 * (migration 063). Everything that runs or edits the protocol therefore has to
 * ask for the current version: the editor, the live cockpit, the participant
 * client.
 *
 * Reporting is the exception and must not use this. A report that hides the
 * questions its participants actually answered describes a study that did not
 * happen.
 */
import type { TemplateWithRelations } from "@/types";

type MaybeArchived = { archived_at?: string | null };

export function activeOnly<T extends MaybeArchived>(rows: readonly T[] | null | undefined): T[] {
  return (rows ?? []).filter((r) => !r.archived_at);
}

/** The whole protocol, with archived rows removed wherever they nest. */
export function activeProtocol<T extends TemplateWithRelations>(template: T): T {
  return {
    ...template,
    template_tasks: template.template_tasks.map((task) => ({
      ...task,
      task_questions: activeOnly(task.task_questions),
    })),
    template_questions: activeOnly(template.template_questions),
    template_error_types: activeOnly(template.template_error_types),
  };
}
