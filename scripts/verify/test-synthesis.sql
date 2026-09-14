-- ============================================================
-- Verification for migration 056 (synthesis after testing)
-- ============================================================
-- Paste into the Supabase SQL editor and run. Two scratch studies in one scratch
-- organization, so the check that evidence cannot cross studies is real.
-- Assertions under the `authenticated` role; PASS/FAIL table; cleaned up.
--
--   A  owns both studies (org owner)
--   C  someone outside the organization

BEGIN;

CREATE TEMP TABLE _result(seq int, check_name text, outcome text, detail text) ON COMMIT DROP;
CREATE TEMP TABLE _fx(k text PRIMARY KEY, v uuid) ON COMMIT DROP;
GRANT ALL ON _result TO authenticated;
GRANT ALL ON _fx TO authenticated;

DO $fx$
DECLARE
  v_a uuid; v_c uuid; v_org uuid; v_t1 uuid; v_t2 uuid; v_part uuid;
  v_s1 uuid; v_s2 uuid; v_ins uuid; v_open uuid; v_ev uuid; v_p uuid; v_popen uuid;
BEGIN
  SELECT id INTO v_a FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_c FROM auth.users WHERE id <> v_a ORDER BY created_at LIMIT 1;
  IF v_c IS NULL THEN
    INSERT INTO _result VALUES (0, 'setup', 'SKIP', 'needs two accounts');
    RETURN;
  END IF;
  INSERT INTO organizations (name, created_by) VALUES ('ZZ synthesis scratch', v_a) RETURNING id INTO v_org;
  INSERT INTO organization_members (org_id, user_id, role) VALUES (v_org, v_a, 'owner');
  INSERT INTO templates (name, user_id, org_id) VALUES ('ZZ study one', v_a, v_org) RETURNING id INTO v_t1;
  INSERT INTO templates (name, user_id, org_id) VALUES ('ZZ study two', v_a, v_org) RETURNING id INTO v_t2;
  INSERT INTO participants (name, user_id) VALUES ('ZZ synthesis participant', v_a) RETURNING id INTO v_part;
  INSERT INTO test_sessions (template_id, participant_id, evaluator_name, user_id, status)
    VALUES (v_t1, v_part, 'ZZ', v_a, 'completed') RETURNING id INTO v_s1;
  INSERT INTO test_sessions (template_id, participant_id, evaluator_name, user_id, status)
    VALUES (v_t2, v_part, 'ZZ', v_a, 'completed') RETURNING id INTO v_s2;

  -- a merged inspection on study one, and one still collecting
  INSERT INTO inspections (template_id, subject_name, created_by) VALUES (v_t1, 'Merged', v_a) RETURNING id INTO v_ins;
  INSERT INTO inspection_evaluators (inspection_id, user_id, submitted_at) VALUES (v_ins, v_a, now()) RETURNING id INTO v_ev;
  -- The status guard (052) refuses direct changes even here; the functions set
  -- this flag, and so must a fixture.
  PERFORM set_config('avalux.inspection_rpc', 'on', true);
  UPDATE inspections SET status = 'consolidating' WHERE id = v_ins;
  PERFORM set_config('avalux.inspection_rpc', 'off', true);
  INSERT INTO inspection_problems (inspection_id, title) VALUES (v_ins, 'No feedback on save') RETURNING id INTO v_p;

  INSERT INTO inspections (template_id, subject_name, created_by) VALUES (v_t1, 'Open', v_a) RETURNING id INTO v_open;

  INSERT INTO _fx VALUES ('A', v_a), ('C', v_c), ('org', v_org), ('t1', v_t1), ('t2', v_t2),
    ('part', v_part), ('s1', v_s1), ('s2', v_s2), ('p', v_p), ('open', v_open);
END $fx$;

SET LOCAL ROLE authenticated;

DO $rls$
DECLARE v_a uuid; v_c uuid; v_t1 uuid; v_t2 uuid; v_s1 uuid; v_s2 uuid; v_p uuid; v_tp uuid; n int; st text;
BEGIN
  SELECT v INTO v_c FROM _fx WHERE k = 'C';
  IF v_c IS NULL THEN RETURN; END IF;
  SELECT v INTO v_a FROM _fx WHERE k = 'A';
  SELECT v INTO v_t1 FROM _fx WHERE k = 't1';
  SELECT v INTO v_t2 FROM _fx WHERE k = 't2';
  SELECT v INTO v_s1 FROM _fx WHERE k = 's1';
  SELECT v INTO v_s2 FROM _fx WHERE k = 's2';
  SELECT v INTO v_p FROM _fx WHERE k = 'p';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a::text)::text, true);

  -- ── outcomes ──────────────────────────────────────────────
  UPDATE inspection_problems SET test_outcome = 'confirmed' WHERE id = v_p;
  SELECT test_outcome INTO st FROM inspection_problems WHERE id = v_p;
  INSERT INTO _result VALUES (1, 'a merged problem can be marked confirmed',
    CASE WHEN st = 'confirmed' THEN 'PASS' ELSE 'FAIL' END, 'outcome=' || COALESCE(st, 'null'));

  BEGIN
    UPDATE inspection_problems SET test_outcome = 'false_alarm' WHERE id = v_p;
    INSERT INTO _result VALUES (2, 'there is no false-alarm outcome', 'FAIL', 'update succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (2, 'there is no false-alarm outcome', 'PASS', SQLERRM);
  END;

  -- ── evidence ──────────────────────────────────────────────
  INSERT INTO problem_evidence (template_id, inspection_problem_id, session_id) VALUES (v_t1, v_p, v_s1);
  SELECT count(*) INTO n FROM problem_evidence WHERE inspection_problem_id = v_p;
  INSERT INTO _result VALUES (3, 'a session of the same study can back a problem',
    CASE WHEN n = 1 THEN 'PASS' ELSE 'FAIL' END, 'evidence=' || n);

  BEGIN
    INSERT INTO problem_evidence (template_id, inspection_problem_id, session_id) VALUES (v_t1, v_p, v_s2);
    INSERT INTO _result VALUES (4, 'a session from another study cannot back a problem', 'FAIL', 'insert succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (4, 'a session from another study cannot back a problem', 'PASS', SQLERRM);
  END;

  BEGIN
    INSERT INTO problem_evidence (template_id, inspection_problem_id, session_id) VALUES (v_t2, v_p, v_s2);
    INSERT INTO _result VALUES (5, 'relabelling the study does not get round it', 'FAIL', 'insert succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (5, 'relabelling the study does not get round it', 'PASS', SQLERRM);
  END;

  BEGIN
    INSERT INTO problem_evidence (template_id, inspection_problem_id, session_id) VALUES (v_t1, v_p, v_s1);
    INSERT INTO _result VALUES (6, 'the same session cannot back a problem twice', 'FAIL', 'insert succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (6, 'the same session cannot back a problem twice', 'PASS', SQLERRM);
  END;

  -- ── problems only testing found ───────────────────────────
  INSERT INTO test_problems (template_id, title, severity) VALUES (v_t1, 'Unpredicted', 3) RETURNING id INTO v_tp;
  INSERT INTO problem_evidence (template_id, test_problem_id, session_id) VALUES (v_t1, v_tp, v_s1);
  SELECT count(*) INTO n FROM problem_evidence WHERE test_problem_id = v_tp;
  INSERT INTO _result VALUES (7, 'a problem only testing found can carry evidence',
    CASE WHEN n = 1 THEN 'PASS' ELSE 'FAIL' END, 'evidence=' || n);

  BEGIN
    INSERT INTO problem_evidence (template_id, inspection_problem_id, test_problem_id, session_id)
      VALUES (v_t1, v_p, v_tp, v_s1);
    INSERT INTO _result VALUES (8, 'one piece of evidence names exactly one problem', 'FAIL', 'insert succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (8, 'one piece of evidence names exactly one problem', 'PASS', SQLERRM);
  END;

  -- ── from outside ──────────────────────────────────────────
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_c::text)::text, true);
  SELECT count(*) INTO n FROM test_problems WHERE template_id = v_t1;
  SELECT n + count(*) INTO n FROM problem_evidence WHERE template_id = v_t1;
  INSERT INTO _result VALUES (9, 'someone outside the organization sees none of it',
    CASE WHEN n = 0 THEN 'PASS' ELSE 'FAIL' END, 'visible=' || n);

  BEGIN
    INSERT INTO test_problems (template_id, title) VALUES (v_t1, 'Planted');
    INSERT INTO _result VALUES (10, 'someone outside cannot add problems', 'FAIL', 'insert succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (10, 'someone outside cannot add problems', 'PASS', SQLERRM);
  END;
END $rls$;

RESET ROLE;

DO $clean$
DECLARE v_org uuid; v_part uuid;
BEGIN
  SELECT v INTO v_org FROM _fx WHERE k = 'org';
  SELECT v INTO v_part FROM _fx WHERE k = 'part';
  IF v_org IS NOT NULL THEN
    DELETE FROM test_sessions WHERE template_id IN (SELECT id FROM templates WHERE org_id = v_org);
    DELETE FROM participants WHERE id = v_part;
    DELETE FROM templates WHERE org_id = v_org;   -- cascades to inspections, problems, evidence
    DELETE FROM organizations WHERE id = v_org;
  END IF;
END $clean$;

SELECT seq, check_name, outcome, left(detail, 90) AS detail FROM _result ORDER BY seq;

COMMIT;
