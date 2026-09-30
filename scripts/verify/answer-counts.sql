-- ============================================================
-- Verification for migration 062 (what a removal would destroy)
-- ============================================================
-- Paste into the Supabase SQL editor and run. Scratch organization, template,
-- participant and session; everything it makes is deleted.
--
-- The function reports how much participant data hangs off each question, so
-- the editor can warn before a removal cascades it away. It must therefore
-- report accurately to someone entitled to the template, and nothing at all to
-- anyone else.

BEGIN;

CREATE TEMP TABLE _result(seq int, check_name text, outcome text, detail text) ON COMMIT DROP;
CREATE TEMP TABLE _fx(k text PRIMARY KEY, v uuid) ON COMMIT DROP;
GRANT ALL ON _result TO authenticated;
GRANT ALL ON _fx TO authenticated;

DO $fx$
DECLARE
  v_a uuid; v_c uuid; v_tpl uuid; v_task uuid; v_q uuid; v_iq uuid;
  v_et uuid; v_p uuid; v_sess uuid; v_tr uuid;
BEGIN
  SELECT id INTO v_a FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_c FROM auth.users WHERE id <> v_a ORDER BY created_at LIMIT 1;
  IF v_c IS NULL THEN
    INSERT INTO _result VALUES (0, 'setup', 'SKIP', 'needs two accounts');
    RETURN;
  END IF;

  INSERT INTO templates (name, user_id) VALUES ('ZZ counts template', v_a)
    RETURNING id INTO v_tpl;
  INSERT INTO template_tasks (template_id, name, sort_order)
    VALUES (v_tpl, 'ZZ task', 0) RETURNING id INTO v_task;

  INSERT INTO task_questions (task_id, question_text, question_type, sort_order)
    VALUES (v_task, 'ZZ how easy was it', 'rating', 0) RETURNING id INTO v_q;
  INSERT INTO template_questions (template_id, question_text, sort_order)
    VALUES (v_tpl, 'ZZ what stood out', 0) RETURNING id INTO v_iq;
  INSERT INTO template_error_types (template_id, code, label)
    VALUES (v_tpl, 'ZZ', 'ZZ wrong button') RETURNING id INTO v_et;

  INSERT INTO participants (name) VALUES ('ZZ counts participant') RETURNING id INTO v_p;
  INSERT INTO test_sessions (template_id, participant_id, evaluator_name)
    VALUES (v_tpl, v_p, 'ZZ evaluator') RETURNING id INTO v_sess;
  INSERT INTO task_results (session_id, task_id) VALUES (v_sess, v_task)
    RETURNING id INTO v_tr;

  -- Two answers to the task question, one interview answer, three logged errors.
  INSERT INTO task_question_answers (task_result_id, question_id, rating_value)
    VALUES (v_tr, v_q, 6);
  INSERT INTO interview_answers (session_id, question_id, answer_text)
    VALUES (v_sess, v_iq, 'ZZ answer');
  INSERT INTO error_logs (task_result_id, error_type_id)
    SELECT v_tr, v_et FROM generate_series(1, 3);

  INSERT INTO _fx VALUES ('A', v_a), ('C', v_c), ('tpl', v_tpl), ('q', v_q),
                         ('iq', v_iq), ('et', v_et), ('p', v_p);
END $fx$;

SET LOCAL ROLE authenticated;

DO $rls$
DECLARE v_a uuid; v_c uuid; v_tpl uuid; v_q uuid; v_iq uuid; v_et uuid; v_n bigint; v_rows int;
BEGIN
  SELECT v INTO v_c FROM _fx WHERE k = 'C';
  IF v_c IS NULL THEN RETURN; END IF;
  SELECT v INTO v_a FROM _fx WHERE k = 'A';
  SELECT v INTO v_tpl FROM _fx WHERE k = 'tpl';
  SELECT v INTO v_q FROM _fx WHERE k = 'q';
  SELECT v INTO v_iq FROM _fx WHERE k = 'iq';
  SELECT v INTO v_et FROM _fx WHERE k = 'et';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a::text)::text, true);

  SELECT n INTO v_n FROM template_answer_counts(v_tpl) WHERE ref_id = v_q;
  INSERT INTO _result VALUES (1, 'counts answers to a task question',
    CASE WHEN v_n = 1 THEN 'PASS' ELSE 'FAIL' END, 'n=' || COALESCE(v_n::text, 'null'));

  SELECT n INTO v_n FROM template_answer_counts(v_tpl) WHERE ref_id = v_iq;
  INSERT INTO _result VALUES (2, 'counts answers to an interview question',
    CASE WHEN v_n = 1 THEN 'PASS' ELSE 'FAIL' END, 'n=' || COALESCE(v_n::text, 'null'));

  SELECT n INTO v_n FROM template_answer_counts(v_tpl) WHERE ref_id = v_et;
  INSERT INTO _result VALUES (3, 'counts errors logged against a type',
    CASE WHEN v_n = 3 THEN 'PASS' ELSE 'FAIL' END, 'n=' || COALESCE(v_n::text, 'null'));

  SELECT count(*) INTO v_rows FROM template_answer_counts(v_tpl);
  INSERT INTO _result VALUES (4, 'reports only what actually holds data',
    CASE WHEN v_rows = 3 THEN 'PASS' ELSE 'FAIL' END, 'rows=' || v_rows);

  -- ── from outside the template ─────────────────────────────
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_c::text)::text, true);
  SELECT count(*) INTO v_rows FROM template_answer_counts(v_tpl);
  INSERT INTO _result VALUES (5, 'tells someone else nothing, not even a count',
    CASE WHEN v_rows = 0 THEN 'PASS' ELSE 'FAIL' END, 'rows=' || v_rows);
END $rls$;

RESET ROLE;

DO $clean$
DECLARE v_tpl uuid; v_p uuid;
BEGIN
  SELECT v INTO v_tpl FROM _fx WHERE k = 'tpl';
  SELECT v INTO v_p FROM _fx WHERE k = 'p';
  IF v_tpl IS NOT NULL THEN
    -- test_sessions.template_id and .participant_id do not cascade.
    DELETE FROM test_sessions WHERE template_id = v_tpl;
    DELETE FROM templates WHERE id = v_tpl;
  END IF;
  IF v_p IS NOT NULL THEN DELETE FROM participants WHERE id = v_p; END IF;
END $clean$;

SELECT seq, check_name, outcome, left(detail, 90) AS detail FROM _result ORDER BY seq;

COMMIT;
