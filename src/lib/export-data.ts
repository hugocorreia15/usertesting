// Raw data export: every measurement a study produced as flat CSV
// tables (zipped) or one JSON document, for analysis in R/SPSS/JASP.
// Indicators are intentionally NOT exported pre-computed (except the
// session SUS score for convenience) — the raw rows are the artifact.

import { zipSync, strToU8 } from "fflate";
import { calculateSusScore } from "@/lib/sus";
import type {
  AutoEvent,
  ObserverNote,
  TemplateWithRelations,
  TestSessionWithRelations,
} from "@/types";

export type Cell = string | number | null;

export interface ExportTable {
  headers: string[];
  rows: Cell[][];
}

export function csvEscape(value: Cell): string {
  if (value == null) return "";
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(table: ExportTable): string {
  const lines = [table.headers.map(csvEscape).join(",")];
  for (const row of table.rows) lines.push(row.map(csvEscape).join(","));
  return lines.join("\n") + "\n";
}

export function buildExportTables(
  template: TemplateWithRelations,
  sessions: TestSessionWithRelations[],
  autoEvents: AutoEvent[] = [],
  observerNotes: ObserverNote[] = [],
): Record<string, ExportTable> {
  const interviewQuestionText = new Map(
    template.template_questions.map((q) => [q.id, q.question_text]),
  );
  const errorTypeByld = new Map(
    template.template_error_types.map((et) => [et.id, et.code]),
  );

  const sessionsT: ExportTable = {
    headers: [
      "session_id",
      "participant_id",
      "participant_name",
      "evaluator_name",
      "status",
      "started_at",
      "completed_at",
      "sus_score",
      "notes",
    ],
    rows: sessions.map((s) => [
      s.id,
      s.participant_id,
      s.participants?.name ?? null,
      s.evaluator_name,
      s.status,
      s.started_at,
      s.completed_at,
      calculateSusScore(s.sus_answers || []),
      s.notes,
    ]),
  };

  const taskResultsT: ExportTable = {
    headers: [
      "session_id",
      "task_result_id",
      "sort_order",
      "task_name",
      "completion_status",
      "time_seconds",
      "action_count",
      "error_count",
      "hesitation_count",
      "seq_rating",
      "optimal_time_seconds",
      "optimal_actions",
      "is_practice",
    ],
    rows: [],
  };
  const errorLogsT: ExportTable = {
    headers: [
      "session_id",
      "task_result_id",
      "task_name",
      "error_code",
      "timestamp_seconds",
      "description",
    ],
    rows: [],
  };
  const hesitationLogsT: ExportTable = {
    headers: [
      "session_id",
      "task_result_id",
      "task_name",
      "timestamp_seconds",
      "note",
    ],
    rows: [],
  };
  const answersT: ExportTable = {
    headers: [
      "session_id",
      "task_result_id",
      "task_name",
      "question_text",
      "question_type",
      "answer_text",
      "selected_options",
      "rating_value",
      "media_path",
    ],
    rows: [],
  };
  const interviewT: ExportTable = {
    headers: ["session_id", "question_text", "answer_text"],
    rows: [],
  };
  const susT: ExportTable = {
    headers: ["session_id", "question_number", "score"],
    rows: [],
  };
  const instrumentT: ExportTable = {
    headers: ["session_id", "instrument", "item_number", "score"],
    rows: [],
  };
  const answerCodesT: ExportTable = {
    headers: [
      "session_id",
      "code",
      "source",
      "task_name",
      "question_text",
      "answer_text",
    ],
    rows: [],
  };

  // Answer lookups for resolving qualitative code tags, built once
  // while walking the sessions below.
  const taskAnswerRef = new Map<
    string,
    { sessionId: string; taskName: Cell; questionText: Cell; answerText: Cell }
  >();
  const interviewAnswerRef = new Map<
    string,
    { sessionId: string; questionText: Cell; answerText: Cell }
  >();

  for (const s of sessions) {
    for (const tr of s.task_results ?? []) {
      const taskName = tr.template_tasks?.name ?? null;
      taskResultsT.rows.push([
        s.id,
        tr.id,
        tr.sort_order,
        taskName,
        tr.completion_status,
        tr.time_seconds != null ? Number(tr.time_seconds) : null,
        tr.action_count,
        tr.error_count,
        tr.hesitation_count,
        tr.seq_rating,
        tr.template_tasks?.optimal_time_seconds ?? null,
        tr.template_tasks?.optimal_actions ?? null,
        tr.template_tasks?.is_practice ? "true" : "false",
      ]);

      for (const e of tr.error_logs ?? []) {
        errorLogsT.rows.push([
          s.id,
          tr.id,
          taskName,
          e.error_type_id ? (errorTypeByld.get(e.error_type_id) ?? null) : null,
          e.timestamp_seconds != null ? Number(e.timestamp_seconds) : null,
          e.description,
        ]);
      }
      for (const h of tr.hesitation_logs ?? []) {
        hesitationLogsT.rows.push([
          s.id,
          tr.id,
          taskName,
          h.timestamp_seconds != null ? Number(h.timestamp_seconds) : null,
          h.note,
        ]);
      }

      const questionById = new Map(
        (tr.template_tasks?.task_questions ?? []).map((q) => [q.id, q]),
      );
      for (const a of tr.task_question_answers ?? []) {
        const q = questionById.get(a.question_id);
        taskAnswerRef.set(a.id, {
          sessionId: s.id,
          taskName,
          questionText: q?.question_text ?? null,
          answerText: a.answer_text,
        });
        answersT.rows.push([
          s.id,
          tr.id,
          taskName,
          q?.question_text ?? null,
          q?.question_type ?? null,
          a.answer_text,
          a.selected_options ? a.selected_options.join("|") : null,
          a.rating_value,
          a.media_url,
        ]);
      }
    }

    for (const ia of s.interview_answers ?? []) {
      interviewAnswerRef.set(ia.id, {
        sessionId: s.id,
        questionText: interviewQuestionText.get(ia.question_id) ?? null,
        answerText: ia.answer_text,
      });
      interviewT.rows.push([
        s.id,
        interviewQuestionText.get(ia.question_id) ?? null,
        ia.answer_text,
      ]);
    }
    for (const sa of s.sus_answers ?? []) {
      susT.rows.push([s.id, sa.question_number, sa.score]);
    }
    for (const ia of s.instrument_answers ?? []) {
      instrumentT.rows.push([s.id, ia.instrument, ia.item_number, ia.score]);
    }
  }

  // Qualitative code tags, resolved against the sessions exported
  // above; tags on answers outside those sessions are skipped.
  for (const code of template.template_codes ?? []) {
    for (const ac of code.answer_codes ?? []) {
      if (ac.task_question_answer_id) {
        const ref = taskAnswerRef.get(ac.task_question_answer_id);
        if (!ref) continue;
        answerCodesT.rows.push([
          ref.sessionId,
          code.code,
          "task",
          ref.taskName,
          ref.questionText,
          ref.answerText,
        ]);
      } else if (ac.interview_answer_id) {
        const ref = interviewAnswerRef.get(ac.interview_answer_id);
        if (!ref) continue;
        answerCodesT.rows.push([
          ref.sessionId,
          code.code,
          "interview",
          null,
          ref.questionText,
          ref.answerText,
        ]);
      }
    }
  }

  // Auto-captured interaction events, restricted to the sessions
  // exported above; events from other sessions are skipped.
  const sessionIds = new Set(sessions.map((s) => s.id));
  const autoEventsT: ExportTable = {
    headers: ["session_id", "event_type", "occurred_at", "path", "detail"],
    rows: autoEvents
      .filter((e) => sessionIds.has(e.session_id))
      .map((e) => [e.session_id, e.event_type, e.occurred_at, e.path, e.detail]),
  };

  const observerNotesT: ExportTable = {
    headers: ["session_id", "author_email", "task_index", "note", "created_at"],
    rows: observerNotes
      .filter((n) => sessionIds.has(n.session_id))
      .map((n) => [
        n.session_id,
        n.author_email,
        n.task_index,
        n.note,
        n.created_at,
      ]),
  };

  return {
    sessions: sessionsT,
    task_results: taskResultsT,
    error_logs: errorLogsT,
    hesitation_logs: hesitationLogsT,
    task_question_answers: answersT,
    interview_answers: interviewT,
    sus_answers: susT,
    instrument_answers: instrumentT,
    answer_codes: answerCodesT,
    auto_events: autoEventsT,
    observer_notes: observerNotesT,
  };
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function exportDataZip(
  template: TemplateWithRelations,
  sessions: TestSessionWithRelations[],
  autoEvents: AutoEvent[] = [],
  observerNotes: ObserverNote[] = [],
) {
  const tables = buildExportTables(template, sessions, autoEvents, observerNotes);
  const files: Record<string, Uint8Array> = {};
  for (const [name, table] of Object.entries(tables)) {
    files[`${name}.csv`] = strToU8(toCsv(table));
  }
  const zipped = zipSync(files);
  downloadBlob(
    new Blob([zipped as unknown as BlobPart], { type: "application/zip" }),
    `${slug(template.name)}-data.zip`,
  );
}

export function exportDataJson(
  template: TemplateWithRelations,
  sessions: TestSessionWithRelations[],
  autoEvents: AutoEvent[] = [],
  observerNotes: ObserverNote[] = [],
) {
  const tables = buildExportTables(template, sessions, autoEvents, observerNotes);
  const payload = {
    template: { id: template.id, name: template.name },
    exported_at: new Date().toISOString(),
    tables: Object.fromEntries(
      Object.entries(tables).map(([name, t]) => [
        name,
        t.rows.map((row) =>
          Object.fromEntries(t.headers.map((h, i) => [h, row[i]])),
        ),
      ]),
    ),
  };
  downloadBlob(
    new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
    `${slug(template.name)}-data.json`,
  );
}
