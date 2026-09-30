-- ============================================================
-- 063 – A protocol edit stops destroying the record of a study
-- ============================================================
-- Two operations still destroyed participant data, and both are ordinary
-- things to do while a study is running.
--
-- Removing a question deleted every answer given to it, through the cascade on
-- question_id. Rewording a question kept the answers but attached them to text
-- nobody was ever asked, which is quieter and worse: an export then shows
-- responses under a question that did not exist when they were given.
--
-- Both are fixed by the same idea. A question that has been answered is a
-- historical fact and stops being editable in place. Removing it archives it;
-- rewording it archives it and creates its successor. The old row keeps its
-- id, its original wording, and every answer attached to it. Nothing is
-- deleted, so nothing has to be recovered.
--
-- A question nobody has answered yet is still just a draft, and is edited and
-- removed as before. Versioning a protocol that has never been run would fill
-- a study with rows that mean nothing.
--
-- WHAT READS WHAT AFTERWARDS
--
-- Anything that runs or edits a protocol wants archived_at IS NULL: the live
-- cockpit, the participant client, the editor. Anything reporting on what
-- happened wants all of it, archived included, or it misreports a study by
-- hiding the questions its participants actually answered. The failure mode of
-- forgetting a filter is an archived question appearing where it is not
-- wanted, which is visible and harmless, rather than data disappearing, which
-- is neither.

ALTER TABLE task_questions
  ADD COLUMN archived_at timestamptz,
  ADD COLUMN superseded_by uuid REFERENCES task_questions(id) ON DELETE SET NULL;

ALTER TABLE template_questions
  ADD COLUMN archived_at timestamptz,
  ADD COLUMN superseded_by uuid REFERENCES template_questions(id) ON DELETE SET NULL;

ALTER TABLE template_error_types
  ADD COLUMN archived_at timestamptz,
  ADD COLUMN superseded_by uuid REFERENCES template_error_types(id) ON DELETE SET NULL;

COMMENT ON COLUMN task_questions.archived_at IS
  'Set when the question left the protocol, by removal or by being reworded. The row and its answers are kept. Null means it is part of the protocol as it stands.';
COMMENT ON COLUMN task_questions.superseded_by IS
  'The question that replaced this one when it was reworded, so an export can follow the wording a participant actually saw to what it became.';

-- Reading a live protocol means reading the questions that are still in it.
CREATE INDEX idx_task_questions_active
  ON task_questions(task_id) WHERE archived_at IS NULL;
CREATE INDEX idx_template_questions_active
  ON template_questions(template_id) WHERE archived_at IS NULL;
CREATE INDEX idx_template_error_types_active
  ON template_error_types(template_id) WHERE archived_at IS NULL;

-- ── the counts keep reporting archived rows ─────────────────
-- An archived question still holds answers. The editor uses these counts to
-- decide whether editing must version rather than overwrite, so hiding them
-- here would reintroduce exactly the loss this migration removes.
CREATE OR REPLACE FUNCTION template_answer_counts(tid uuid)
RETURNS TABLE (kind text, ref_id uuid, n bigint)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT 'task_question'::text, tq.id, count(tqa.id)
    FROM task_questions tq
    JOIN template_tasks tt ON tt.id = tq.task_id
    LEFT JOIN task_question_answers tqa ON tqa.question_id = tq.id
   WHERE tt.template_id = tid
     AND can_use_template(tid)
   GROUP BY tq.id
  HAVING count(tqa.id) > 0

  UNION ALL

  SELECT 'interview_question'::text, q.id, count(ia.id)
    FROM template_questions q
    LEFT JOIN interview_answers ia ON ia.question_id = q.id
   WHERE q.template_id = tid
     AND can_use_template(tid)
   GROUP BY q.id
  HAVING count(ia.id) > 0

  UNION ALL

  SELECT 'error_type'::text, et.id, count(el.id)
    FROM template_error_types et
    LEFT JOIN error_logs el ON el.error_type_id = et.id
   WHERE et.template_id = tid
     AND can_use_template(tid)
   GROUP BY et.id
  HAVING count(el.id) > 0;
$$;

REVOKE ALL ON FUNCTION template_answer_counts(uuid) FROM public;
GRANT EXECUTE ON FUNCTION template_answer_counts(uuid) TO authenticated;
