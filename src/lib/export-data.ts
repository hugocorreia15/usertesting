// Raw data export: every measurement a study produced as flat CSV
// tables (zipped) or one JSON document, for analysis in R/SPSS/JASP.
// Indicators are intentionally NOT exported pre-computed (except the
// session SUS score for convenience) — the raw rows are the artifact.

import { zipSync, strToU8 } from "fflate";
import { calculateSusScore } from "@/lib/sus";
import type { ModerationEvent } from "@/lib/moderation";
import type {
  Inspection,
  InspectionEvaluator,
  InspectionFinding,
  InspectionProblem,
  ProblemEvidence,
  SessionReflection,
  TestProblem,
  TemplateReviewEvent,
  AutoEvent,
  ObserverNote,
  RaterScore,
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

/**
 * Everything beyond the template and its sessions is optional, and passed as
 * one object: the list grew past the point where positional arguments could be
 * read at a call site.
 */
export interface ExportExtras {
  autoEvents?: AutoEvent[];
  observerNotes?: ObserverNote[];
  raterScores?: RaterScore[];
  reflections?: SessionReflection[];
  reviewEvents?: TemplateReviewEvent[];
  inspections?: Inspection[];
  inspectionEvaluators?: InspectionEvaluator[];
  inspectionFindings?: InspectionFinding[];
  inspectionProblems?: InspectionProblem[];
  testProblems?: TestProblem[];
  problemEvidence?: ProblemEvidence[];
  moderationEvents?: ModerationEvent[];
}

export function buildExportTables(
  template: TemplateWithRelations,
  sessions: TestSessionWithRelations[],
  {
    autoEvents = [],
    observerNotes = [],
    raterScores = [],
    reflections = [],
    reviewEvents = [],
    inspections = [],
    inspectionEvaluators = [],
    inspectionFindings = [],
    inspectionProblems = [],
    testProblems = [],
    problemEvidence = [],
    moderationEvents = [],
  }: ExportExtras = {},
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
      "is_pilot",
      "consent_accepted_at",
      "consent_method",
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
      s.is_pilot ? "true" : "false",
      s.consent_accepted_at,
      s.consent_method,
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

  const raterScoresT: ExportTable = {
    headers: [
      "session_id",
      "rater_email",
      "task_id",
      "completion_status",
      "action_count",
      "error_count",
      "hesitation_count",
      "seq_rating",
    ],
    rows: raterScores
      .filter((r) => sessionIds.has(r.session_id))
      .map((r) => [
        r.session_id,
        r.rater_email,
        r.task_id,
        r.completion_status,
        r.action_count,
        r.error_count,
        r.hesitation_count,
        r.seq_rating,
      ]),
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

  // Only submitted reflections are exported. A draft has not been written for
  // anyone yet, and the database would not return a teammate's draft anyway.
  const reflectionsT: ExportTable = {
    headers: [
      "session_id",
      "user_id",
      "surprised",
      "protocol_change",
      "may_have_led",
      "submitted_at",
    ],
    rows: reflections
      .filter((r) => sessionIds.has(r.session_id) && r.submitted_at)
      .map((r) => [
        r.session_id,
        r.user_id,
        r.surprised,
        r.protocol_change,
        r.may_have_led,
        r.submitted_at,
      ]),
  };

  // Review history, oldest first. A submission's snapshot is the protocol as
  // it was submitted, so consecutive submissions are the before and after of
  // one revision.
  const reviewEventsT: ExportTable = {
    headers: ["seq", "event", "created_at", "actor_id", "review_mode", "note", "backfilled", "protocol_snapshot"],
    rows: [...reviewEvents]
      .filter((e) => e.template_id === template.id)
      .sort((a, b) => a.seq - b.seq)
      .map((e) => [
        e.seq,
        e.event,
        e.created_at,
        e.actor_id,
        e.review_mode,
        e.note,
        e.backfilled ? 1 : 0,
        e.protocol_snapshot ? JSON.stringify(e.protocol_snapshot) : null,
      ]),
  };

  const inspectionIds = new Set(
    inspections.filter((i) => i.template_id === template.id).map((i) => i.id),
  );
  const inspectionsT: ExportTable = {
    headers: ["inspection_id", "subject_name", "subject_kind", "status", "created_at", "collection_closed_at"],
    rows: inspections
      .filter((i) => inspectionIds.has(i.id))
      .map((i) => [i.id, i.subject_name, i.subject_kind, i.status, i.created_at, i.collection_closed_at]),
  };
  const inspectionEvaluatorsT: ExportTable = {
    headers: ["inspection_id", "evaluator_id", "user_id", "submitted_at"],
    rows: inspectionEvaluators
      .filter((e) => inspectionIds.has(e.inspection_id))
      .map((e) => [e.inspection_id, e.id, e.user_id, e.submitted_at]),
  };
  // Only findings the exporting user may read are present: an inspection still
  // collecting passes contributes only the exporter's own.
  const inspectionFindingsT: ExportTable = {
    headers: ["inspection_id", "evaluator_id", "heuristic_id", "location", "description", "severity", "problem_id", "created_at"],
    rows: inspectionFindings
      .filter((f) => inspectionIds.has(f.inspection_id))
      .map((f) => [f.inspection_id, f.evaluator_id, f.heuristic_id, f.location, f.description, f.severity, f.problem_id, f.created_at]),
  };
  const inspectionProblemsT: ExportTable = {
    headers: ["inspection_id", "problem_id", "title", "heuristic_id", "agreed_severity", "test_outcome"],
    rows: inspectionProblems
      .filter((p) => inspectionIds.has(p.inspection_id))
      .map((p) => [p.inspection_id, p.id, p.title, p.heuristic_id, p.agreed_severity, p.test_outcome]),
  };

  // After testing: problems only testing found, and every problem's evidence.
  const testProblemsT: ExportTable = {
    headers: ["test_problem_id", "title", "severity", "heuristic_id", "created_at"],
    rows: testProblems
      .filter((t) => t.template_id === template.id)
      .map((t) => [t.id, t.title, t.severity, t.heuristic_id, t.created_at]),
  };
  const problemEvidenceT: ExportTable = {
    headers: ["problem_kind", "problem_id", "session_id", "created_at"],
    rows: problemEvidence
      .filter((e) => e.template_id === template.id)
      .map((e) => [
        e.inspection_problem_id ? "predicted" : "test_only",
        e.inspection_problem_id ?? e.test_problem_id,
        e.session_id,
        e.created_at,
      ]),
  };

  // Corrections made while logging. The logging_started marker is kept: it is
  // what distinguishes a session logged without corrections from one that was
  // never recorded.
  const moderationEventsT: ExportTable = {
    headers: ["session_id", "seq", "kind", "task_id", "task_index", "timer_seconds", "occurred_at"],
    rows: moderationEvents
      .filter((e) => sessionIds.has(e.session_id))
      .sort((a, b) => a.seq - b.seq)
      .map((e) => [e.session_id, e.seq, e.kind, e.task_id, e.task_index, e.timer_seconds, e.occurred_at]),
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
    rater_scores: raterScoresT,
    reflections: reflectionsT,
    review_events: reviewEventsT,
    inspections: inspectionsT,
    inspection_evaluators: inspectionEvaluatorsT,
    inspection_findings: inspectionFindingsT,
    inspection_problems: inspectionProblemsT,
    test_problems: testProblemsT,
    problem_evidence: problemEvidenceT,
    moderation_events: moderationEventsT,
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
  extras: ExportExtras = {},
) {
  const tables = buildExportTables(template, sessions, extras);
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
  extras: ExportExtras = {},
) {
  const tables = buildExportTables(template, sessions, extras);
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
