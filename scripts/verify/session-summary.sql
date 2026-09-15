-- ============================================================
-- Verification for migration 059 (cross-session summary)
-- ============================================================
-- Paste into the Supabase SQL editor and run. Scratch organization, template,
-- participant and sessions; assertions under the `authenticated` role;
-- PASS/FAIL table; everything it made is deleted.
--
--   A  an org owner, running the study
--   C  someone outside the organization
--
-- The check that matters most is 7: a session whose participant consented
-- before the study turned participant text on must stay ineligible forever,
-- because that participant agreed to something that did not mention a model.
--
-- Role changes happen at the top level rather than inside a DO block, because
-- PL/pgSQL is not a reliable place to change roles.

BEGIN;

CREATE TEMP TABLE _result(seq int, check_name text, outcome text, detail text) ON COMMIT DROP;
CREATE TEMP TABLE _fx(k text PRIMARY KEY, v uuid) ON COMMIT DROP;
GRANT ALL ON _result TO authenticated;
GRANT ALL ON _fx TO authenticated;

-- ── setup, as the superuser ─────────────────────────────────
DO $fx$
DECLARE v_a uuid; v_c uuid; v_org uuid; v_tpl uuid; v_p uuid; v_before uuid; v_nocon uuid;
BEGIN
  SELECT id INTO v_a FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_c FROM auth.users WHERE id <> v_a ORDER BY created_at LIMIT 1;
  IF v_c IS NULL THEN
    INSERT INTO _result VALUES (0, 'setup', 'SKIP', 'needs two accounts');
    RETURN;
  END IF;

  INSERT INTO organizations (name, created_by, ai_suggestions_enabled)
    VALUES ('ZZ summary scratch', v_a, true) RETURNING id INTO v_org;
  INSERT INTO organization_members (org_id, user_id, role) VALUES (v_org, v_a, 'owner');

  INSERT INTO templates (name, user_id, org_id, consent_text)
    VALUES ('ZZ summary template', v_a, v_org, 'Taking part is voluntary.')
    RETURNING id INTO v_tpl;

  INSERT INTO participants (name) VALUES ('ZZ scratch participant') RETURNING id INTO v_p;

  -- Consented a month ago, under wording that said nothing about a model.
  INSERT INTO test_sessions (template_id, participant_id, evaluator_name,
                             consent_accepted_at, consent_method)
    VALUES (v_tpl, v_p, 'ZZ evaluator', now() - interval '30 days', 'join_form')
    RETURNING id INTO v_before;

  -- Never consented at all.
  INSERT INTO test_sessions (template_id, participant_id, evaluator_name)
    VALUES (v_tpl, v_p, 'ZZ evaluator') RETURNING id INTO v_nocon;

  INSERT INTO _fx VALUES ('A', v_a), ('C', v_c), ('org', v_org), ('tpl', v_tpl),
                         ('p', v_p), ('before', v_before), ('nocon', v_nocon);
END $fx$;

-- ── as a signed-in owner ────────────────────────────────────
SET LOCAL ROLE authenticated;

DO $rls1$
DECLARE v_a uuid; v_tpl uuid; v_before uuid; ok boolean; v_from timestamptz;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM _fx WHERE k = 'C') THEN RETURN; END IF;
  SELECT v INTO v_a FROM _fx WHERE k = 'A';
  SELECT v INTO v_tpl FROM _fx WHERE k = 'tpl';
  SELECT v INTO v_before FROM _fx WHERE k = 'before';
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a::text)::text, true);

  INSERT INTO _result VALUES (1, 'participant text is off by default',
    CASE WHEN NOT session_participant_text_allowed(v_before) THEN 'PASS' ELSE 'FAIL' END, '');

  BEGIN
    PERFORM set_participant_text_ai(v_tpl, true);
    INSERT INTO _result VALUES (2, 'refused while the consent text lacks the clause', 'FAIL', 'it was enabled');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (2, 'refused while the consent text lacks the clause', 'PASS', SQLERRM);
  END;

  UPDATE templates SET consent_text = 'Taking part is voluntary. ' || ai_consent_clause()
   WHERE id = v_tpl;
  PERFORM set_participant_text_ai(v_tpl, true);
  SELECT ai_participant_text_enabled, ai_participant_text_from
    INTO ok, v_from FROM templates WHERE id = v_tpl;
  INSERT INTO _result VALUES (3, 'an owner may turn it on once the clause is shown',
    CASE WHEN ok AND v_from IS NOT NULL THEN 'PASS' ELSE 'FAIL' END, '');
END $rls1$;

-- ── back to the superuser, to add sessions that consent now ─
RESET ROLE;

DO $mk$
DECLARE v_tpl uuid; v_p uuid; v_after uuid; v_pilot uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM _fx WHERE k = 'C') THEN RETURN; END IF;
  SELECT v INTO v_tpl FROM _fx WHERE k = 'tpl';
  SELECT v INTO v_p FROM _fx WHERE k = 'p';

  INSERT INTO test_sessions (template_id, participant_id, evaluator_name,
                             consent_accepted_at, consent_method)
    VALUES (v_tpl, v_p, 'ZZ evaluator', clock_timestamp(), 'join_form')
    RETURNING id INTO v_after;

  INSERT INTO test_sessions (template_id, participant_id, evaluator_name,
                             consent_accepted_at, consent_method, is_pilot)
    VALUES (v_tpl, v_p, 'ZZ evaluator', clock_timestamp(), 'join_form', true)
    RETURNING id INTO v_pilot;

  INSERT INTO _fx VALUES ('after', v_after), ('pilot', v_pilot);
END $mk$;

SET LOCAL ROLE authenticated;

DO $rls2$
DECLARE
  v_a uuid; v_c uuid; v_tpl uuid; v_before uuid; v_nocon uuid; v_after uuid;
  v_pilot uuid; v_id uuid; n int;
BEGIN
  SELECT v INTO v_c FROM _fx WHERE k = 'C';
  IF v_c IS NULL THEN RETURN; END IF;
  SELECT v INTO v_a FROM _fx WHERE k = 'A';
  SELECT v INTO v_tpl FROM _fx WHERE k = 'tpl';
  SELECT v INTO v_before FROM _fx WHERE k = 'before';
  SELECT v INTO v_nocon FROM _fx WHERE k = 'nocon';
  SELECT v INTO v_after FROM _fx WHERE k = 'after';
  SELECT v INTO v_pilot FROM _fx WHERE k = 'pilot';
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a::text)::text, true);

  INSERT INTO _result VALUES (4, 'a session that consented under the new wording qualifies',
    CASE WHEN session_participant_text_allowed(v_after) THEN 'PASS' ELSE 'FAIL' END, '');

  INSERT INTO _result VALUES (5, 'a pilot session is left out',
    CASE WHEN NOT session_participant_text_allowed(v_pilot) THEN 'PASS' ELSE 'FAIL' END, '');

  INSERT INTO _result VALUES (6, 'a session with no consent at all stays excluded',
    CASE WHEN NOT session_participant_text_allowed(v_nocon) THEN 'PASS' ELSE 'FAIL' END, '');

  INSERT INTO _result VALUES (7, 'a session that consented BEFORE the wording stays excluded',
    CASE WHEN NOT session_participant_text_allowed(v_before) THEN 'PASS' ELSE 'FAIL' END,
    'consented 30 days ago');

  PERFORM set_participant_text_ai(v_tpl, false);
  PERFORM set_participant_text_ai(v_tpl, true);
  INSERT INTO _result VALUES (8, 'switching it off and on keeps consented sessions eligible',
    CASE WHEN session_participant_text_allowed(v_after)
          AND NOT session_participant_text_allowed(v_before)
         THEN 'PASS' ELSE 'FAIL' END,
    'from=' || (SELECT ai_participant_text_from::text FROM templates WHERE id = v_tpl));

  BEGIN
    INSERT INTO ai_suggestions (template_id, kind, payload, requested_by)
      VALUES (v_tpl, 'session_summary', '{"clusters":[]}'::jsonb, v_a);
    INSERT INTO _result VALUES (9, 'no summary before the team writes a problem of its own', 'FAIL', 'insert succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (9, 'no summary before the team writes a problem of its own', 'PASS', SQLERRM);
  END;

  INSERT INTO test_problems (template_id, title) VALUES (v_tpl, 'Written by a person');
  INSERT INTO ai_suggestions (template_id, kind, payload, model, requested_by)
    VALUES (v_tpl, 'session_summary', '{"clusters":[{"title":"As proposed"}]}'::jsonb, 'test-model', v_a)
    RETURNING id INTO v_id;
  INSERT INTO _result VALUES (10, 'once they have, a summary may be stored',
    CASE WHEN v_id IS NOT NULL THEN 'PASS' ELSE 'FAIL' END, '');

  BEGIN
    UPDATE ai_suggestions SET payload = '{"clusters":[]}'::jsonb WHERE id = v_id;
    INSERT INTO _result VALUES (11, 'the proposal cannot be rewritten', 'FAIL', 'update succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (11, 'the proposal cannot be rewritten', 'PASS', SQLERRM);
  END;

  BEGIN
    INSERT INTO ai_suggestions (template_id, inspection_id, kind, payload, requested_by)
      VALUES (v_tpl, gen_random_uuid(), 'session_summary', '{}'::jsonb, v_a);
    INSERT INTO _result VALUES (12, 'a suggestion belongs to one subject, not two', 'FAIL', 'insert succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (12, 'a suggestion belongs to one subject, not two', 'PASS', SQLERRM);
  END;

  INSERT INTO test_problems (template_id, title, assisted)
    VALUES (v_tpl, 'Accepted from a summary', true);
  SELECT count(*) INTO n FROM test_problems WHERE template_id = v_tpl AND assisted;
  INSERT INTO _result VALUES (13, 'an accepted problem is marked assisted',
    CASE WHEN n = 1 THEN 'PASS' ELSE 'FAIL' END, 'assisted=' || n);

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_c::text)::text, true);
  SELECT count(*) INTO n FROM ai_suggestions WHERE template_id = v_tpl;
  INSERT INTO _result VALUES (14, 'someone outside the organization sees none',
    CASE WHEN n = 0 THEN 'PASS' ELSE 'FAIL' END, 'visible=' || n);

  BEGIN
    PERFORM set_participant_text_ai(v_tpl, true);
    INSERT INTO _result VALUES (15, 'an outsider cannot turn participant text on', 'FAIL', 'it was allowed');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (15, 'an outsider cannot turn participant text on', 'PASS', SQLERRM);
  END;
END $rls2$;

RESET ROLE;

DO $clean$
DECLARE v_org uuid; v_p uuid;
BEGIN
  SELECT v INTO v_org FROM _fx WHERE k = 'org';
  SELECT v INTO v_p FROM _fx WHERE k = 'p';
  IF v_org IS NOT NULL THEN
    DELETE FROM templates WHERE org_id = v_org;   -- cascades to sessions and suggestions
    DELETE FROM organizations WHERE id = v_org;
  END IF;
  IF v_p IS NOT NULL THEN DELETE FROM participants WHERE id = v_p; END IF;
END $clean$;

SELECT seq, check_name, outcome, left(detail, 90) AS detail FROM _result ORDER BY seq;

COMMIT;
