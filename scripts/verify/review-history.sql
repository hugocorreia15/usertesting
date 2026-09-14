-- ============================================================
-- Verification for migration 054 (review history)
-- ============================================================
-- Paste into the Supabase SQL editor and run. It creates a scratch
-- organization and template, walks one full review cycle as a student and an
-- instructor, asserts that every step was recorded, prints PASS/FAIL, and
-- deletes everything it made. Runs under the `authenticated` role, because
-- row-level security does not apply to the editor's superuser.
--
--   A  instructor, organization owner
--   B  student, owns the template
--   C  someone outside the organization

BEGIN;

CREATE TEMP TABLE _result(seq int, check_name text, outcome text, detail text) ON COMMIT DROP;
CREATE TEMP TABLE _fx(k text PRIMARY KEY, v uuid) ON COMMIT DROP;
GRANT ALL ON _result TO authenticated;
GRANT ALL ON _fx TO authenticated;

DO $fx$
DECLARE v_a uuid; v_b uuid; v_c uuid; v_org uuid; v_tpl uuid; v_task uuid;
BEGIN
  SELECT id INTO v_a FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_b FROM auth.users WHERE id <> v_a ORDER BY created_at LIMIT 1;
  SELECT id INTO v_c FROM auth.users WHERE id NOT IN (v_a, COALESCE(v_b, v_a)) ORDER BY created_at LIMIT 1;
  IF v_c IS NULL THEN
    INSERT INTO _result VALUES (0, 'setup', 'SKIP', 'needs three accounts');
    RETURN;
  END IF;

  INSERT INTO organizations (name, created_by) VALUES ('ZZ review-history scratch', v_a)
    RETURNING id INTO v_org;
  INSERT INTO organization_members (org_id, user_id, role) VALUES
    (v_org, v_a, 'owner'), (v_org, v_b, 'member');
  INSERT INTO templates (name, user_id, org_id)
    VALUES ('ZZ review-history template', v_b, v_org) RETURNING id INTO v_tpl;
  INSERT INTO template_tasks (template_id, sort_order, name)
    VALUES (v_tpl, 0, 'Original wording') RETURNING id INTO v_task;

  INSERT INTO _fx VALUES ('A', v_a), ('B', v_b), ('C', v_c), ('org', v_org),
                         ('tpl', v_tpl), ('task', v_task);
END $fx$;

SET LOCAL ROLE authenticated;

DO $rls$
DECLARE
  v_a uuid; v_b uuid; v_c uuid; v_tpl uuid; v_task uuid;
  n int; v_seq text; snap1 jsonb; snap2 jsonb;
BEGIN
  SELECT v INTO v_c FROM _fx WHERE k = 'C';
  IF v_c IS NULL THEN RETURN; END IF;
  SELECT v INTO v_a FROM _fx WHERE k = 'A';
  SELECT v INTO v_b FROM _fx WHERE k = 'B';
  SELECT v INTO v_tpl FROM _fx WHERE k = 'tpl';
  SELECT v INTO v_task FROM _fx WHERE k = 'task';

  -- instructor turns review on
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a::text)::text, true);
  PERFORM set_template_review_mode(v_tpl, 'required');

  -- student submits the original
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_b::text)::text, true);
  PERFORM request_template_review(v_tpl);

  -- instructor asks for changes
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a::text)::text, true);
  PERFORM review_template(v_tpl, 'changes_requested', 'Rewrite task 1 as a goal');

  -- student revises and resubmits
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_b::text)::text, true);
  UPDATE template_tasks SET name = 'Revised wording' WHERE id = v_task;
  PERFORM request_template_review(v_tpl);

  -- instructor approves
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a::text)::text, true);
  PERFORM review_template(v_tpl, 'approved', 'Good to recruit');

  -- student edits the approved protocol, which returns it to draft
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_b::text)::text, true);
  UPDATE template_tasks SET name = 'Edited after approval' WHERE id = v_task;

  -- ── what was recorded ─────────────────────────────────────
  SELECT string_agg(event, ' > ' ORDER BY seq) INTO v_seq
    FROM template_review_events WHERE template_id = v_tpl;
  INSERT INTO _result VALUES (1, 'the whole cycle is recorded in order',
    CASE WHEN v_seq = 'mode_changed > submitted > changes_requested > submitted > approved > invalidated'
         THEN 'PASS' ELSE 'FAIL' END, v_seq);

  SELECT protocol_snapshot INTO snap1 FROM template_review_events
   WHERE template_id = v_tpl AND event = 'submitted' ORDER BY seq LIMIT 1;
  SELECT protocol_snapshot INTO snap2 FROM template_review_events
   WHERE template_id = v_tpl AND event = 'submitted' ORDER BY seq DESC LIMIT 1;
  INSERT INTO _result VALUES (2, 'each submission keeps the protocol it submitted',
    CASE WHEN snap1 -> 'tasks' -> 0 ->> 'name' = 'Original wording'
          AND snap2 -> 'tasks' -> 0 ->> 'name' = 'Revised wording' THEN 'PASS' ELSE 'FAIL' END,
    'before=' || COALESCE(snap1 -> 'tasks' -> 0 ->> 'name', 'null') ||
    ' after=' || COALESCE(snap2 -> 'tasks' -> 0 ->> 'name', 'null'));

  SELECT count(*) INTO n FROM template_review_events
   WHERE template_id = v_tpl AND event = 'changes_requested'
     AND note = 'Rewrite task 1 as a goal' AND actor_id = v_a;
  INSERT INTO _result VALUES (3, 'the earlier note survives a later decision',
    CASE WHEN n = 1 THEN 'PASS' ELSE 'FAIL' END,
    'templates.review_note is now: ' ||
    COALESCE((SELECT review_note FROM templates WHERE id = v_tpl), 'null'));

  SELECT count(*) INTO n FROM template_review_events
   WHERE template_id = v_tpl AND event = 'invalidated' AND actor_id = v_b;
  INSERT INTO _result VALUES (4, 'an edit after approval is recorded, with who made it',
    CASE WHEN n = 1 THEN 'PASS' ELSE 'FAIL' END, 'invalidated by student=' || n);

  SELECT count(*) INTO n FROM template_review_events
   WHERE template_id = v_tpl AND event = 'submitted' AND actor_id = v_b;
  INSERT INTO _result VALUES (5, 'submissions are attributed to the student',
    CASE WHEN n = 2 THEN 'PASS' ELSE 'FAIL' END, 'by student=' || n);

  -- ── who can read and write it ─────────────────────────────
  SELECT count(*) INTO n FROM template_review_events WHERE template_id = v_tpl;
  INSERT INTO _result VALUES (6, 'the student can read the history',
    CASE WHEN n = 6 THEN 'PASS' ELSE 'FAIL' END, 'visible=' || n);

  BEGIN
    INSERT INTO template_review_events (template_id, event, review_mode)
      VALUES (v_tpl, 'approved', 'required');
    INSERT INTO _result VALUES (7, 'nobody can write an event directly', 'FAIL', 'insert succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (7, 'nobody can write an event directly', 'PASS', SQLERRM);
  END;

  UPDATE template_review_events SET note = 'rewritten' WHERE template_id = v_tpl;
  DELETE FROM template_review_events WHERE template_id = v_tpl;
  SELECT count(*) INTO n FROM template_review_events
   WHERE template_id = v_tpl AND (note IS DISTINCT FROM 'rewritten');
  INSERT INTO _result VALUES (8, 'history cannot be edited or deleted',
    CASE WHEN n = 6 THEN 'PASS' ELSE 'FAIL' END, 'intact rows=' || n || ' of 6');

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a::text)::text, true);
  SELECT count(*) INTO n FROM template_review_events WHERE template_id = v_tpl;
  INSERT INTO _result VALUES (9, 'the instructor can read the history',
    CASE WHEN n = 6 THEN 'PASS' ELSE 'FAIL' END, 'visible=' || n);

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_c::text)::text, true);
  SELECT count(*) INTO n FROM template_review_events WHERE template_id = v_tpl;
  INSERT INTO _result VALUES (10, 'someone outside the organization sees nothing',
    CASE WHEN n = 0 THEN 'PASS' ELSE 'FAIL' END, 'visible=' || n);
END $rls$;

RESET ROLE;

DO $clean$
DECLARE v_org uuid;
BEGIN
  SELECT v INTO v_org FROM _fx WHERE k = 'org';
  IF v_org IS NOT NULL THEN
    DELETE FROM templates WHERE org_id = v_org;   -- cascades to tasks and events
    DELETE FROM organizations WHERE id = v_org;
  END IF;
END $clean$;

SELECT seq, check_name, outcome, left(detail, 90) AS detail FROM _result ORDER BY seq;

COMMIT;
