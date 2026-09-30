-- ============================================================
-- Verification for migration 063 (archive instead of delete)
-- ============================================================
-- Paste into the Supabase SQL editor and run. Scratch template, participant
-- and session; everything it makes is deleted.
--
-- The property under test is that a protocol edit cannot destroy the record of
-- a study: an answered question can be taken out of the protocol and reworded,
-- and its answers are still there afterwards, still attached to the wording
-- they were given under.

BEGIN;

CREATE TEMP TABLE _result(seq int, check_name text, outcome text, detail text) ON COMMIT DROP;
CREATE TEMP TABLE _fx(k text PRIMARY KEY, v uuid) ON COMMIT DROP;

DO $fx$
DECLARE
  v_a uuid; v_tpl uuid; v_task uuid; v_q uuid; v_p uuid; v_sess uuid; v_tr uuid;
BEGIN
  SELECT id INTO v_a FROM auth.users ORDER BY created_at LIMIT 1;

  INSERT INTO templates (name, user_id) VALUES ('ZZ archive template', v_a)
    RETURNING id INTO v_tpl;
  INSERT INTO template_tasks (template_id, name, sort_order)
    VALUES (v_tpl, 'ZZ task', 0) RETURNING id INTO v_task;
  INSERT INTO task_questions (task_id, question_text, question_type, sort_order)
    VALUES (v_task, 'ZZ original wording', 'text', 0) RETURNING id INTO v_q;

  INSERT INTO participants (name) VALUES ('ZZ archive participant') RETURNING id INTO v_p;
  INSERT INTO test_sessions (template_id, participant_id, evaluator_name)
    VALUES (v_tpl, v_p, 'ZZ evaluator') RETURNING id INTO v_sess;
  INSERT INTO task_results (session_id, task_id) VALUES (v_sess, v_task)
    RETURNING id INTO v_tr;
  INSERT INTO task_question_answers (task_result_id, question_id, answer_text)
    VALUES (v_tr, v_q, 'ZZ the participant answer');

  INSERT INTO _fx VALUES ('tpl', v_tpl), ('task', v_task), ('q', v_q), ('p', v_p);
END $fx$;

DO $checks$
DECLARE v_tpl uuid; v_task uuid; v_q uuid; v_new uuid; n int; txt text; arch timestamptz;
BEGIN
  SELECT v INTO v_tpl FROM _fx WHERE k = 'tpl';
  SELECT v INTO v_task FROM _fx WHERE k = 'task';
  SELECT v INTO v_q FROM _fx WHERE k = 'q';

  -- ── the columns exist and default to active ───────────────
  SELECT archived_at INTO arch FROM task_questions WHERE id = v_q;
  INSERT INTO _result VALUES (1, 'a question starts in the protocol',
    CASE WHEN arch IS NULL THEN 'PASS' ELSE 'FAIL' END, '');

  -- ── rewording: the original keeps its wording and its answer ──
  INSERT INTO task_questions (task_id, question_text, question_type, sort_order)
    VALUES (v_task, 'ZZ reworded', 'text', 0) RETURNING id INTO v_new;
  UPDATE task_questions
     SET archived_at = now(), superseded_by = v_new
   WHERE id = v_q;

  SELECT question_text INTO txt FROM task_questions WHERE id = v_q;
  INSERT INTO _result VALUES (2, 'the answered question keeps the wording it was asked with',
    CASE WHEN txt = 'ZZ original wording' THEN 'PASS' ELSE 'FAIL' END, txt);

  SELECT count(*) INTO n FROM task_question_answers WHERE question_id = v_q;
  INSERT INTO _result VALUES (3, 'and keeps its answer',
    CASE WHEN n = 1 THEN 'PASS' ELSE 'FAIL' END, 'answers=' || n);

  SELECT count(*) INTO n FROM task_questions
   WHERE task_id = v_task AND archived_at IS NULL;
  INSERT INTO _result VALUES (4, 'the protocol now holds only the new wording',
    CASE WHEN n = 1 THEN 'PASS' ELSE 'FAIL' END, 'active=' || n);

  SELECT count(*) INTO n FROM task_questions
   WHERE id = v_q AND superseded_by = v_new;
  INSERT INTO _result VALUES (5, 'the old version points at what replaced it',
    CASE WHEN n = 1 THEN 'PASS' ELSE 'FAIL' END, '');

  -- ── removal: archiving leaves the answer alone ────────────
  UPDATE task_questions SET archived_at = now() WHERE id = v_new;
  SELECT count(*) INTO n FROM task_question_answers WHERE question_id = v_q;
  INSERT INTO _result VALUES (6, 'archiving never touches an answer',
    CASE WHEN n = 1 THEN 'PASS' ELSE 'FAIL' END, 'answers=' || n);

  SELECT count(*) INTO n FROM task_questions
   WHERE task_id = v_task AND archived_at IS NULL;
  INSERT INTO _result VALUES (7, 'and the protocol is left with nothing to ask',
    CASE WHEN n = 0 THEN 'PASS' ELSE 'FAIL' END, 'active=' || n);

  -- ── the counts still see archived rows ────────────────────
  -- The editor uses them to decide whether an edit must version rather than
  -- overwrite, so an archived question holding answers has to keep reporting.
  SELECT n INTO n FROM template_answer_counts(v_tpl) WHERE ref_id = v_q;
  INSERT INTO _result VALUES (8, 'an archived question still reports what it holds',
    CASE WHEN n = 1 THEN 'PASS' ELSE 'FAIL' END, 'n=' || COALESCE(n::text, 'null'));

  -- ── deleting is still what destroys ───────────────────────
  -- Stated rather than assumed: this is why the client archives.
  DELETE FROM task_questions WHERE id = v_q;
  SELECT count(*) INTO n FROM task_question_answers WHERE question_id = v_q;
  INSERT INTO _result VALUES (9, 'deleting a question still takes its answers, which is why nothing deletes one',
    CASE WHEN n = 0 THEN 'PASS' ELSE 'FAIL' END, 'answers left=' || n);
END $checks$;

DO $clean$
DECLARE v_tpl uuid; v_p uuid;
BEGIN
  SELECT v INTO v_tpl FROM _fx WHERE k = 'tpl';
  SELECT v INTO v_p FROM _fx WHERE k = 'p';
  DELETE FROM test_sessions WHERE template_id = v_tpl;
  DELETE FROM templates WHERE id = v_tpl;
  DELETE FROM participants WHERE id = v_p;
END $clean$;

SELECT seq, check_name, outcome, left(detail, 90) AS detail FROM _result ORDER BY seq;

COMMIT;
