-- ============================================================
-- Verification for migrations 050 (instructor gate) and 051 (org defaults)
-- ============================================================
-- Paste the whole file into the Supabase SQL editor and run it. It needs no
-- editing: it creates its own scratch organization, template and session,
-- asserts each behaviour, prints a PASS/FAIL table, and deletes everything
-- it made. Nothing belonging to a real study is read or written.
--
-- Triggers fire for the SQL editor's superuser even though RLS does not,
-- which is what makes the guard checks meaningful here.
--
-- Every row of the output should read PASS.

BEGIN;

CREATE TEMP TABLE _result(seq int, check_name text, outcome text, detail text)
  ON COMMIT DROP;

DO $verify$
DECLARE
  v_owner   uuid;
  v_other   uuid;
  v_org     uuid;
  v_tpl     uuid;
  v_task    uuid;
  v_session uuid;
  v_part    uuid;
  v_status  text;
  v_mode    text;
  v_pilot   boolean;
  v_consent text;
  v_instr   text[];
  v_count   int;
  v_stamp   timestamptz;
  n         int := 0;
BEGIN
  -- ── scratch fixtures ──────────────────────────────────────
  SELECT id INTO v_owner FROM auth.users ORDER BY created_at LIMIT 1;
  -- A different real account to play the student. test_sessions.user_id has a
  -- foreign key to auth.users, so this cannot be an invented uuid. NULL is
  -- permitted by the schema and is the fallback on a single-account project.
  SELECT id INTO v_other FROM auth.users WHERE id <> v_owner ORDER BY created_at LIMIT 1;
  IF v_owner IS NULL THEN
    INSERT INTO _result VALUES (0, 'setup', 'FAIL', 'no auth.users row to act as owner');
    RETURN;
  END IF;

  INSERT INTO organizations (name, created_by)
    VALUES ('ZZ verify scratch', v_owner) RETURNING id INTO v_org;
  INSERT INTO organization_members (org_id, user_id, role)
    VALUES (v_org, v_owner, 'owner');

  INSERT INTO templates (name, user_id, org_id)
    VALUES ('ZZ verify scratch template', v_owner, v_org) RETURNING id INTO v_tpl;
  INSERT INTO template_tasks (template_id, sort_order, name)
    VALUES (v_tpl, 0, 'Scratch task') RETURNING id INTO v_task;

  -- Act as the owner for the SECURITY DEFINER functions, which read auth.uid().
  PERFORM set_config('request.jwt.claims',
                     json_build_object('sub', v_owner::text)::text, true);

  -- ── 1. the guard refuses a direct write to a review column ──
  n := n + 1;
  BEGIN
    UPDATE templates SET review_status = 'approved' WHERE id = v_tpl;
    INSERT INTO _result VALUES (n, 'guard refuses direct review_status write',
      'FAIL', 'the update succeeded; a student could self-approve');
  EXCEPTION WHEN insufficient_privilege OR raise_exception THEN
    INSERT INTO _result VALUES (n, 'guard refuses direct review_status write',
      'PASS', SQLERRM);
  END;

  -- ── 2. ordinary edits still work ──────────────────────────
  n := n + 1;
  BEGIN
    UPDATE templates SET description = 'scratch' WHERE id = v_tpl;
    INSERT INTO _result VALUES (n, 'ordinary template edit still allowed', 'PASS', '');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (n, 'ordinary template edit still allowed',
      'FAIL', 'guard is too broad: ' || SQLERRM);
  END;

  -- ── 3. mode, request, decide ──────────────────────────────
  n := n + 1;
  PERFORM set_template_review_mode(v_tpl, 'required');
  SELECT review_mode, review_status INTO v_mode, v_status FROM templates WHERE id = v_tpl;
  INSERT INTO _result VALUES (n, 'set_template_review_mode sets required',
    CASE WHEN v_mode = 'required' THEN 'PASS' ELSE 'FAIL' END,
    'mode=' || v_mode || ' status=' || v_status);

  n := n + 1;
  PERFORM request_template_review(v_tpl);
  SELECT review_status, review_submitted_at INTO v_status, v_stamp FROM templates WHERE id = v_tpl;
  INSERT INTO _result VALUES (n, 'request_template_review submits',
    CASE WHEN v_status = 'submitted' AND v_stamp IS NOT NULL THEN 'PASS' ELSE 'FAIL' END,
    'status=' || v_status);

  n := n + 1;
  PERFORM review_template(v_tpl, 'approved', 'ok');
  SELECT review_status INTO v_status FROM templates WHERE id = v_tpl;
  INSERT INTO _result VALUES (n, 'review_template approves',
    CASE WHEN v_status = 'approved' THEN 'PASS' ELSE 'FAIL' END, 'status=' || v_status);

  -- ── 4. recruiting opens once approved ─────────────────────
  n := n + 1;
  INSERT INTO _result VALUES (n, 'recruiting allowed once approved',
    CASE WHEN template_recruiting_allowed(v_tpl) THEN 'PASS' ELSE 'FAIL' END, '');

  -- ── 5. a protocol edit sends it back to draft ─────────────
  n := n + 1;
  UPDATE template_tasks SET name = 'Scratch task edited' WHERE id = v_task;
  SELECT review_status, approval_invalidated_at INTO v_status, v_stamp
    FROM templates WHERE id = v_tpl;
  INSERT INTO _result VALUES (n, 'protocol edit invalidates approval',
    CASE WHEN v_status = 'draft' AND v_stamp IS NOT NULL THEN 'PASS' ELSE 'FAIL' END,
    'status=' || v_status);

  -- ── 6. a session on a gated template is a pilot ───────────
  -- user_id is the evaluator; a non-owner here, so it must be marked.
  n := n + 1;
  INSERT INTO participants (name, user_id) VALUES ('ZZ verify participant', v_owner)
    RETURNING id INTO v_part;
  INSERT INTO test_sessions (template_id, participant_id, evaluator_name, user_id, status)
    VALUES (v_tpl, v_part, 'ZZ verify', v_other, 'planned')
    RETURNING id, is_pilot INTO v_session, v_pilot;
  INSERT INTO _result VALUES (n, 'session on unapproved template is a pilot',
    CASE WHEN v_pilot THEN 'PASS' ELSE 'FAIL' END,
    'is_pilot=' || v_pilot || ' evaluator=' || coalesce(v_other::text, 'null'));

  -- ── 7. an org owner''s own session is not a pilot ─────────
  n := n + 1;
  INSERT INTO test_sessions (template_id, participant_id, evaluator_name, user_id, status)
    VALUES (v_tpl, v_part, 'ZZ verify owner', v_owner, 'planned')
    RETURNING is_pilot INTO v_pilot;
  INSERT INTO _result VALUES (n, 'owner session is not a pilot',
    CASE WHEN NOT v_pilot THEN 'PASS' ELSE 'FAIL' END, 'is_pilot=' || v_pilot);

  -- ── 8. org defaults reach a template when it is shared ────
  UPDATE organizations
     SET default_review_mode = 'required',
         default_consent_text = 'Scratch consent',
         default_instruments = array['sus']
   WHERE id = v_org;

  n := n + 1;
  PERFORM set_template_org(v_tpl, NULL);
  PERFORM set_template_org(v_tpl, v_org);
  SELECT review_mode, consent_text, instruments INTO v_mode, v_consent, v_instr
    FROM templates WHERE id = v_tpl;
  INSERT INTO _result VALUES (n, 'sharing inherits the org defaults',
    CASE WHEN v_mode = 'required' AND v_consent = 'Scratch consent'
              AND v_instr = array['sus'] THEN 'PASS' ELSE 'FAIL' END,
    'mode=' || v_mode || ' consent=' || coalesce(v_consent,'null'));

  -- ── 9. a team''s own consent text survives sharing ────────
  n := n + 1;
  PERFORM set_config('avalux.review_rpc', 'on', true);
  UPDATE templates SET consent_text = 'Our own text', instruments = array['ueq_s']
   WHERE id = v_tpl;
  PERFORM set_config('avalux.review_rpc', 'off', true);
  PERFORM set_template_org(v_tpl, NULL);
  PERFORM set_template_org(v_tpl, v_org);
  SELECT consent_text, instruments INTO v_consent, v_instr FROM templates WHERE id = v_tpl;
  INSERT INTO _result VALUES (n, 'sharing does not clobber the team''s own text',
    CASE WHEN v_consent = 'Our own text' AND v_instr = array['ueq_s']
         THEN 'PASS' ELSE 'FAIL' END,
    'consent=' || coalesce(v_consent,'null'));

  -- ── 10. retrofit reports what it touched ──────────────────
  n := n + 1;
  SELECT apply_org_defaults(v_org, true, true, false) INTO v_count;
  SELECT consent_text INTO v_consent FROM templates WHERE id = v_tpl;
  INSERT INTO _result VALUES (n, 'apply_org_defaults retrofits and counts',
    CASE WHEN v_count >= 1 AND v_consent = 'Scratch consent' THEN 'PASS' ELSE 'FAIL' END,
    'touched=' || v_count);

  -- ── 11. a non-owner cannot approve or retrofit ────────────
  n := n + 1;
  PERFORM set_config('request.jwt.claims',
                     json_build_object('sub',
                       coalesce(v_other, gen_random_uuid())::text)::text, true);
  BEGIN
    PERFORM review_template(v_tpl, 'approved', NULL);
    INSERT INTO _result VALUES (n, 'non-owner cannot approve', 'FAIL',
      'the call succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (n, 'non-owner cannot approve', 'PASS', SQLERRM);
  END;

  n := n + 1;
  BEGIN
    PERFORM apply_org_defaults(v_org, true, false, false);
    INSERT INTO _result VALUES (n, 'non-owner cannot retrofit defaults', 'FAIL',
      'the call succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (n, 'non-owner cannot retrofit defaults', 'PASS', SQLERRM);
  END;

  -- ── cleanup ───────────────────────────────────────────────
  DELETE FROM test_sessions WHERE template_id = v_tpl;
  DELETE FROM participants  WHERE id = v_part;
  DELETE FROM templates     WHERE id = v_tpl;
  DELETE FROM organizations WHERE id = v_org;
END
$verify$;

SELECT seq, check_name, outcome, left(detail, 70) AS detail
  FROM _result ORDER BY seq;

-- Everything above ran inside this transaction and the scratch rows are
-- already deleted. COMMIT is still safe; ROLLBACK is equally fine if you
-- would rather leave no trace at all.
COMMIT;
