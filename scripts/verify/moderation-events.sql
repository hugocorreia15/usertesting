-- ============================================================
-- Verification for migration 055 (moderation events)
-- ============================================================
-- Paste into the Supabase SQL editor and run. Scratch organization, template,
-- participant and session; assertions under the `authenticated` role; PASS/FAIL
-- table; everything it made is deleted.
--
--   A  the moderator, who owns the session      (org member)
--   B  a teammate in the same organization       (org member)
--   C  someone outside the organization

BEGIN;

CREATE TEMP TABLE _result(seq int, check_name text, outcome text, detail text) ON COMMIT DROP;
CREATE TEMP TABLE _fx(k text PRIMARY KEY, v uuid) ON COMMIT DROP;
GRANT ALL ON _result TO authenticated;
GRANT ALL ON _fx TO authenticated;

DO $fx$
DECLARE v_a uuid; v_b uuid; v_c uuid; v_org uuid; v_tpl uuid; v_task uuid; v_part uuid; v_s uuid;
BEGIN
  SELECT id INTO v_a FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_b FROM auth.users WHERE id <> v_a ORDER BY created_at LIMIT 1;
  SELECT id INTO v_c FROM auth.users WHERE id NOT IN (v_a, COALESCE(v_b, v_a)) ORDER BY created_at LIMIT 1;
  IF v_c IS NULL THEN
    INSERT INTO _result VALUES (0, 'setup', 'SKIP', 'needs three accounts');
    RETURN;
  END IF;
  INSERT INTO organizations (name, created_by) VALUES ('ZZ moderation scratch', v_a) RETURNING id INTO v_org;
  INSERT INTO organization_members (org_id, user_id, role) VALUES (v_org, v_a, 'owner'), (v_org, v_b, 'member');
  INSERT INTO templates (name, user_id, org_id) VALUES ('ZZ moderation template', v_a, v_org) RETURNING id INTO v_tpl;
  INSERT INTO template_tasks (template_id, sort_order, name) VALUES (v_tpl, 0, 'Scratch task') RETURNING id INTO v_task;
  INSERT INTO participants (name, user_id) VALUES ('ZZ moderation participant', v_a) RETURNING id INTO v_part;
  INSERT INTO test_sessions (template_id, participant_id, evaluator_name, user_id, status)
    VALUES (v_tpl, v_part, 'ZZ', v_a, 'in_progress') RETURNING id INTO v_s;
  INSERT INTO _fx VALUES ('A', v_a), ('B', v_b), ('C', v_c), ('org', v_org), ('part', v_part),
                         ('task', v_task), ('s', v_s);
END $fx$;

SET LOCAL ROLE authenticated;

DO $rls$
DECLARE v_a uuid; v_b uuid; v_c uuid; v_task uuid; v_s uuid; n int; v_kinds text;
BEGIN
  SELECT v INTO v_c FROM _fx WHERE k = 'C';
  IF v_c IS NULL THEN RETURN; END IF;
  SELECT v INTO v_a FROM _fx WHERE k = 'A';
  SELECT v INTO v_b FROM _fx WHERE k = 'B';
  SELECT v INTO v_task FROM _fx WHERE k = 'task';
  SELECT v INTO v_s FROM _fx WHERE k = 's';

  -- ── the moderator records a session's corrections ─────────
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a::text)::text, true);
  INSERT INTO moderation_events (session_id, kind) VALUES (v_s, 'logging_started');
  INSERT INTO moderation_events (session_id, task_id, task_index, kind, timer_seconds)
    VALUES (v_s, v_task, 0, 'undo_error', 12.3),
           (v_s, v_task, 0, 'task_reset', 41.0);

  SELECT string_agg(kind, ' > ' ORDER BY seq), count(*) INTO v_kinds, n
    FROM moderation_events WHERE session_id = v_s AND actor_id = v_a;
  INSERT INTO _result VALUES (1, 'the moderator records corrections, in order, as themself',
    CASE WHEN v_kinds = 'logging_started > undo_error > task_reset' THEN 'PASS' ELSE 'FAIL' END,
    COALESCE(v_kinds, 'none'));

  BEGIN
    INSERT INTO moderation_events (session_id, kind, actor_id) VALUES (v_s, 'undo_action', v_b);
    INSERT INTO _result VALUES (2, 'nobody can record an event as someone else', 'FAIL', 'insert succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (2, 'nobody can record an event as someone else', 'PASS', SQLERRM);
  END;

  BEGIN
    INSERT INTO moderation_events (session_id, kind) VALUES (v_s, 'deleted_everything');
    INSERT INTO _result VALUES (3, 'only the known kinds are accepted', 'FAIL', 'insert succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (3, 'only the known kinds are accepted', 'PASS', SQLERRM);
  END;

  -- ── the record cannot be tidied afterwards ────────────────
  UPDATE moderation_events SET kind = 'undo_action' WHERE session_id = v_s;
  DELETE FROM moderation_events WHERE session_id = v_s;
  SELECT count(*) INTO n FROM moderation_events WHERE session_id = v_s AND kind <> 'undo_action';
  INSERT INTO _result VALUES (4, 'corrections cannot be edited or deleted',
    CASE WHEN n = 3 THEN 'PASS' ELSE 'FAIL' END, 'intact=' || n || ' of 3');

  -- ── who can read ──────────────────────────────────────────
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_b::text)::text, true);
  SELECT count(*) INTO n FROM moderation_events WHERE session_id = v_s;
  INSERT INTO _result VALUES (5, 'a teammate in the organization can read them',
    CASE WHEN n = 3 THEN 'PASS' ELSE 'FAIL' END, 'visible=' || n);

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_c::text)::text, true);
  SELECT count(*) INTO n FROM moderation_events WHERE session_id = v_s;
  INSERT INTO _result VALUES (6, 'someone outside sees nothing',
    CASE WHEN n = 0 THEN 'PASS' ELSE 'FAIL' END, 'visible=' || n);

  BEGIN
    INSERT INTO moderation_events (session_id, kind) VALUES (v_s, 'logging_started');
    INSERT INTO _result VALUES (7, 'someone outside cannot record events', 'FAIL', 'insert succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (7, 'someone outside cannot record events', 'PASS', SQLERRM);
  END;
END $rls$;

RESET ROLE;

-- ── events go with their session ────────────────────────────
DO $cascade$
DECLARE v_s uuid; n int;
BEGIN
  SELECT v INTO v_s FROM _fx WHERE k = 's';
  IF v_s IS NULL THEN RETURN; END IF;
  DELETE FROM test_sessions WHERE id = v_s;
  SELECT count(*) INTO n FROM moderation_events WHERE session_id = v_s;
  INSERT INTO _result VALUES (8, 'deleting a session removes its events',
    CASE WHEN n = 0 THEN 'PASS' ELSE 'FAIL' END, 'remaining=' || n);
END $cascade$;

DO $clean$
DECLARE v_org uuid; v_part uuid;
BEGIN
  SELECT v INTO v_org FROM _fx WHERE k = 'org';
  SELECT v INTO v_part FROM _fx WHERE k = 'part';
  IF v_org IS NOT NULL THEN
    DELETE FROM test_sessions WHERE template_id IN (SELECT id FROM templates WHERE org_id = v_org);
    DELETE FROM participants WHERE id = v_part;
    DELETE FROM templates WHERE org_id = v_org;
    DELETE FROM organizations WHERE id = v_org;
  END IF;
END $clean$;

SELECT seq, check_name, outcome, left(detail, 90) AS detail FROM _result ORDER BY seq;

COMMIT;
