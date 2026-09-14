-- ============================================================
-- Verification for migration 053 (session reflections)
-- ============================================================
-- Paste the whole file into the Supabase SQL editor and run it. Like the
-- inspection script, it creates its own scratch organization, template,
-- participant and sessions, asserts under the `authenticated` role (row-level
-- security does not apply to the editor's superuser), prints PASS/FAIL, and
-- deletes everything it made.
--
-- Roles, played by the three oldest accounts inside a scratch organization:
--   A  the student who moderated the session       (org member)
--   B  a teammate who observed it                  (org member)
--   C  the instructor                              (org owner)

BEGIN;

CREATE TEMP TABLE _result(seq int, check_name text, outcome text, detail text)
  ON COMMIT DROP;
CREATE TEMP TABLE _fx(k text PRIMARY KEY, v uuid) ON COMMIT DROP;
GRANT ALL ON _result TO authenticated;
GRANT ALL ON _fx     TO authenticated;

DO $fx$
DECLARE
  v_a uuid; v_b uuid; v_c uuid;
  v_org uuid; v_tpl uuid; v_part uuid; v_done uuid; v_live uuid;
BEGIN
  SELECT id INTO v_a FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_b FROM auth.users WHERE id <> v_a ORDER BY created_at LIMIT 1;
  SELECT id INTO v_c FROM auth.users WHERE id NOT IN (v_a, COALESCE(v_b, v_a))
    ORDER BY created_at LIMIT 1;

  IF v_c IS NULL THEN
    INSERT INTO _result VALUES (0, 'setup', 'SKIP',
      'needs three accounts; found ' || (SELECT count(*) FROM auth.users)::text);
    RETURN;
  END IF;

  INSERT INTO organizations (name, created_by) VALUES ('ZZ reflect scratch', v_c)
    RETURNING id INTO v_org;
  INSERT INTO organization_members (org_id, user_id, role) VALUES
    (v_org, v_c, 'owner'), (v_org, v_a, 'member'), (v_org, v_b, 'member');

  INSERT INTO templates (name, user_id, org_id)
    VALUES ('ZZ reflect scratch template', v_a, v_org) RETURNING id INTO v_tpl;
  INSERT INTO participants (name, user_id) VALUES ('ZZ reflect participant', v_a)
    RETURNING id INTO v_part;

  INSERT INTO test_sessions (template_id, participant_id, evaluator_name, user_id, status)
    VALUES (v_tpl, v_part, 'ZZ', v_a, 'completed') RETURNING id INTO v_done;
  INSERT INTO test_sessions (template_id, participant_id, evaluator_name, user_id, status)
    VALUES (v_tpl, v_part, 'ZZ', v_a, 'in_progress') RETURNING id INTO v_live;

  INSERT INTO _fx VALUES ('A', v_a), ('B', v_b), ('C', v_c), ('org', v_org),
    ('tpl', v_tpl), ('part', v_part), ('done', v_done), ('live', v_live);
END $fx$;

SET LOCAL ROLE authenticated;

DO $rls$
DECLARE
  v_a uuid; v_b uuid; v_c uuid; v_done uuid; v_live uuid;
  n int;
  long text := 'The participant looked for the menu first, not the button.';
BEGIN
  SELECT v INTO v_c FROM _fx WHERE k = 'C';
  IF v_c IS NULL THEN RETURN; END IF;
  SELECT v INTO v_a FROM _fx WHERE k = 'A';
  SELECT v INTO v_b FROM _fx WHERE k = 'B';
  SELECT v INTO v_done FROM _fx WHERE k = 'done';
  SELECT v INTO v_live FROM _fx WHERE k = 'live';

  -- ── as A, the moderator ───────────────────────────────────
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a::text)::text, true);

  BEGIN
    INSERT INTO session_reflections (session_id, user_id, surprised)
      VALUES (v_live, v_a, long);
    INSERT INTO _result VALUES (1, 'no reflecting before the session is completed',
      'FAIL', 'the insert succeeded on an in-progress session');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (1, 'no reflecting before the session is completed', 'PASS', SQLERRM);
  END;

  BEGIN
    INSERT INTO session_reflections (session_id, user_id, surprised, submitted_at)
      VALUES (v_done, v_a, long, now());
    INSERT INTO _result VALUES (2, 'a reflection cannot be inserted already submitted',
      'FAIL', 'the insert succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (2, 'a reflection cannot be inserted already submitted', 'PASS', SQLERRM);
  END;

  BEGIN
    INSERT INTO session_reflections (session_id, user_id, surprised, protocol_change, may_have_led)
      VALUES (v_done, v_b, long, long, long);
    INSERT INTO _result VALUES (3, 'nobody can write a reflection as someone else',
      'FAIL', 'the insert succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (3, 'nobody can write a reflection as someone else', 'PASS', SQLERRM);
  END;

  INSERT INTO session_reflections (session_id, user_id, surprised, protocol_change, may_have_led)
    VALUES (v_done, v_a, long, 'too short', long);

  BEGIN
    PERFORM submit_session_reflection(v_done);
    INSERT INTO _result VALUES (4, 'a placeholder answer cannot be submitted',
      'FAIL', 'submitted with a nine-character answer');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (4, 'a placeholder answer cannot be submitted', 'PASS', SQLERRM);
  END;

  BEGIN
    UPDATE session_reflections SET submitted_at = now()
     WHERE session_id = v_done AND user_id = v_a;
    INSERT INTO _result VALUES (5, 'submitted_at refuses a direct write',
      'FAIL', 'the update succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (5, 'submitted_at refuses a direct write', 'PASS', SQLERRM);
  END;

  -- ── the draft is private ──────────────────────────────────
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_c::text)::text, true);
  SELECT count(*) INTO n FROM session_reflections WHERE session_id = v_done;
  INSERT INTO _result VALUES (6, 'the instructor cannot read a draft',
    CASE WHEN n = 0 THEN 'PASS' ELSE 'FAIL' END, 'visible=' || n);

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_b::text)::text, true);
  SELECT count(*) INTO n FROM session_reflections WHERE session_id = v_done;
  INSERT INTO _result VALUES (7, 'a teammate cannot read a draft',
    CASE WHEN n = 0 THEN 'PASS' ELSE 'FAIL' END, 'visible=' || n);

  -- ── A finishes and submits ────────────────────────────────
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a::text)::text, true);
  UPDATE session_reflections SET protocol_change = long
   WHERE session_id = v_done AND user_id = v_a;
  PERFORM submit_session_reflection(v_done);
  SELECT count(*) INTO n FROM session_reflections
   WHERE session_id = v_done AND user_id = v_a AND submitted_at IS NOT NULL;
  INSERT INTO _result VALUES (8, 'a complete reflection submits',
    CASE WHEN n = 1 THEN 'PASS' ELSE 'FAIL' END, 'submitted=' || n);

  BEGIN
    UPDATE session_reflections SET may_have_led = 'rewritten afterwards, at length'
     WHERE session_id = v_done AND user_id = v_a;
    INSERT INTO _result VALUES (9, 'a submitted reflection refuses edits',
      'FAIL', 'the update succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (9, 'a submitted reflection refuses edits', 'PASS', SQLERRM);
  END;

  DELETE FROM session_reflections WHERE session_id = v_done AND user_id = v_a;
  SELECT count(*) INTO n FROM session_reflections WHERE session_id = v_done AND user_id = v_a;
  INSERT INTO _result VALUES (10, 'a submitted reflection cannot be deleted',
    CASE WHEN n = 1 THEN 'PASS' ELSE 'FAIL' END, 'rows remaining=' || n);

  -- ── who can read it now ───────────────────────────────────
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_c::text)::text, true);
  SELECT count(*) INTO n FROM session_reflections WHERE session_id = v_done;
  INSERT INTO _result VALUES (11, 'the instructor reads a submitted reflection',
    CASE WHEN n = 1 THEN 'PASS' ELSE 'FAIL' END, 'visible=' || n);

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_b::text)::text, true);
  SELECT count(*) INTO n FROM session_reflections WHERE session_id = v_done;
  INSERT INTO _result VALUES (12, 'a teammate who has not reflected still cannot read it',
    CASE WHEN n = 0 THEN 'PASS' ELSE 'FAIL' END,
    'visible=' || n || '; B would anchor on A if this is 1');

  -- ── B writes and submits, then both are visible to B ──────
  INSERT INTO session_reflections (session_id, user_id, surprised, protocol_change, may_have_led)
    VALUES (v_done, v_b, long, long, long);
  SELECT count(*) INTO n FROM session_reflections WHERE session_id = v_done;
  INSERT INTO _result VALUES (13, 'a draft of your own does not unlock anyone else''s',
    CASE WHEN n = 1 THEN 'PASS' ELSE 'FAIL' END, 'visible=' || n || ' (own draft only)');

  PERFORM submit_session_reflection(v_done);
  SELECT count(*) INTO n FROM session_reflections WHERE session_id = v_done;
  INSERT INTO _result VALUES (14, 'submitting your own unlocks a teammate''s',
    CASE WHEN n = 2 THEN 'PASS' ELSE 'FAIL' END, 'visible=' || n);
END $rls$;

RESET ROLE;

DO $clean$
DECLARE v_org uuid; v_part uuid;
BEGIN
  SELECT v INTO v_org FROM _fx WHERE k = 'org';
  SELECT v INTO v_part FROM _fx WHERE k = 'part';
  IF v_org IS NOT NULL THEN
    -- Sessions cascade to their reflections; RLS does not apply to cascades.
    DELETE FROM test_sessions WHERE template_id IN (SELECT id FROM templates WHERE org_id = v_org);
    DELETE FROM participants WHERE id = v_part;
    DELETE FROM templates WHERE org_id = v_org;
    DELETE FROM organizations WHERE id = v_org;
  END IF;
END $clean$;

SELECT seq, check_name, outcome, left(detail, 70) AS detail
  FROM _result ORDER BY seq;

COMMIT;
