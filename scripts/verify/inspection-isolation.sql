-- ============================================================
-- Verification for migration 052 (heuristic inspection)
-- ============================================================
-- Paste the whole file into the Supabase SQL editor and run it. It needs no
-- editing: it creates its own scratch organization, template and inspection,
-- asserts each behaviour, prints a PASS/FAIL table, and deletes everything it
-- made. Nothing belonging to a real study is read or written.
--
-- WHY THIS ONE SWITCHES ROLE
-- The gate-and-consent script tests triggers, which fire for the SQL editor's
-- superuser. This script tests ROW-LEVEL SECURITY, which does not apply to a
-- superuser at all. So the assertions below run under SET LOCAL ROLE
-- authenticated with a forged request.jwt.claims, which is exactly how
-- PostgREST presents a signed-in user. Fixtures are created first, as
-- superuser, because creating them under RLS would be testing the wrong thing.
--
-- Every row of the output should read PASS, or SKIP where the project does
-- not have enough accounts to play all the parts.

BEGIN;

CREATE TEMP TABLE _result(seq int, check_name text, outcome text, detail text)
  ON COMMIT DROP;
CREATE TEMP TABLE _fx(k text PRIMARY KEY, v uuid) ON COMMIT DROP;

-- The assertions run as `authenticated`, so that role must be able to record
-- its own results.
GRANT ALL ON _result TO authenticated;
GRANT ALL ON _fx     TO authenticated;

-- ── fixtures, as superuser ──────────────────────────────────
DO $fx$
DECLARE
  v_a uuid; v_b uuid; v_c uuid;
  v_org uuid; v_tpl uuid; v_ins uuid;
  v_ea uuid; v_eb uuid;
BEGIN
  SELECT id INTO v_a FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_b FROM auth.users WHERE id <> v_a ORDER BY created_at LIMIT 1;
  SELECT id INTO v_c FROM auth.users WHERE id NOT IN (v_a, COALESCE(v_b, v_a))
    ORDER BY created_at LIMIT 1;

  IF v_a IS NULL OR v_b IS NULL THEN
    INSERT INTO _result VALUES (0, 'setup',
      CASE WHEN v_a IS NULL THEN 'FAIL' ELSE 'SKIP' END,
      'isolation needs two accounts; found ' ||
      (SELECT count(*) FROM auth.users)::text);
    RETURN;
  END IF;

  INSERT INTO organizations (name, created_by) VALUES ('ZZ inspect scratch', v_a)
    RETURNING id INTO v_org;
  INSERT INTO organization_members (org_id, user_id, role) VALUES (v_org, v_a, 'owner');
  INSERT INTO organization_members (org_id, user_id, role) VALUES (v_org, v_b, 'member');

  INSERT INTO templates (name, user_id, org_id)
    VALUES ('ZZ inspect scratch template', v_a, v_org) RETURNING id INTO v_tpl;

  INSERT INTO inspections (template_id, subject_name, subject_kind, created_by,
                           heuristic_set_id)
    VALUES (v_tpl, 'Scratch subject', 'comparator', v_a,
            '11111111-1111-1111-1111-111111111111')
    RETURNING id INTO v_ins;

  INSERT INTO inspection_evaluators (inspection_id, user_id) VALUES (v_ins, v_a)
    RETURNING id INTO v_ea;
  INSERT INTO inspection_evaluators (inspection_id, user_id) VALUES (v_ins, v_b)
    RETURNING id INTO v_eb;

  -- Two findings each, one problem in common by description.
  INSERT INTO inspection_findings (inspection_id, evaluator_id, description, severity)
    VALUES (v_ins, v_ea, 'A: no feedback on save', 3),
           (v_ins, v_ea, 'A: jargon in the error text', 2),
           (v_ins, v_eb, 'B: no feedback on save', 4),
           (v_ins, v_eb, 'B: cannot undo a delete', 3);

  INSERT INTO _fx VALUES ('userA', v_a), ('userB', v_b), ('org', v_org),
                         ('tpl', v_tpl), ('ins', v_ins), ('evalA', v_ea), ('evalB', v_eb);
  IF v_c IS NOT NULL THEN
    INSERT INTO _fx VALUES ('userC', v_c);
    INSERT INTO organization_members (org_id, user_id, role) VALUES (v_org, v_c, 'owner');
  END IF;
END $fx$;

-- ── assertions, under RLS ───────────────────────────────────
SET LOCAL ROLE authenticated;

DO $rls$
DECLARE
  v_a uuid; v_b uuid; v_c uuid; v_ins uuid; v_tpl uuid; v_ea uuid; v_eb uuid;
  n int; st text; n2 int;
BEGIN
  SELECT v INTO v_a FROM _fx WHERE k = 'userA';
  IF v_a IS NULL THEN RETURN; END IF;
  SELECT v INTO v_b FROM _fx WHERE k = 'userB';
  SELECT v INTO v_c FROM _fx WHERE k = 'userC';
  SELECT v INTO v_ins FROM _fx WHERE k = 'ins';
  SELECT v INTO v_tpl FROM _fx WHERE k = 'tpl';
  SELECT v INTO v_ea FROM _fx WHERE k = 'evalA';
  SELECT v INTO v_eb FROM _fx WHERE k = 'evalB';

  -- ── 1. before submitting, A sees only A ───────────────────
  PERFORM set_config('request.jwt.claims',
                     json_build_object('sub', v_a::text)::text, true);
  SELECT count(*) INTO n FROM inspection_findings WHERE inspection_id = v_ins;
  INSERT INTO _result VALUES (1, 'unsubmitted evaluator sees only their own findings',
    CASE WHEN n = 2 THEN 'PASS' ELSE 'FAIL' END,
    'visible=' || n || ' of 4; anchoring is possible if this is 4');

  -- ── 2. the roster is visible even so ──────────────────────
  SELECT count(*) INTO n FROM inspection_evaluators WHERE inspection_id = v_ins;
  INSERT INTO _result VALUES (2, 'progress is visible while content is not',
    CASE WHEN n = 2 THEN 'PASS' ELSE 'FAIL' END, 'evaluators visible=' || n);

  -- ── 3. A submits; B has not, so A still sees only A ───────
  PERFORM submit_inspection_pass(v_ins);
  SELECT count(*) INTO n FROM inspection_findings WHERE inspection_id = v_ins;
  INSERT INTO _result VALUES (3, 'submitting alone does not unlock an unsubmitted peer',
    CASE WHEN n = 2 THEN 'PASS' ELSE 'FAIL' END, 'visible=' || n || ' of 4');

  -- ── 4. A''s pass is now frozen ────────────────────────────
  BEGIN
    UPDATE inspection_findings SET description = 'rewritten after the fact'
     WHERE evaluator_id = v_ea;
    INSERT INTO _result VALUES (4, 'a submitted pass refuses edits',
      'FAIL', 'the update succeeded; the statistic can be gamed');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (4, 'a submitted pass refuses edits', 'PASS', SQLERRM);
  END;

  BEGIN
    INSERT INTO inspection_findings (inspection_id, evaluator_id, description)
      VALUES (v_ins, v_ea, 'added after submitting');
    INSERT INTO _result VALUES (5, 'a submitted pass refuses new findings',
      'FAIL', 'the insert succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (5, 'a submitted pass refuses new findings', 'PASS', SQLERRM);
  END;

  -- ── 6. submitted_at cannot be written directly ────────────
  BEGIN
    UPDATE inspection_evaluators SET submitted_at = NULL WHERE id = v_ea;
    INSERT INTO _result VALUES (6, 'submitted_at refuses a direct write',
      'FAIL', 'the update succeeded; a student could unfreeze their own pass');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (6, 'submitted_at refuses a direct write', 'PASS', SQLERRM);
  END;

  -- ── 7. frozen rows survive a delete attempt ───────────────
  -- Row-level security filters a DELETE rather than raising, so the test is
  -- that the rows are still there afterwards.
  DELETE FROM inspection_evaluators WHERE id = v_ea;
  SELECT count(*) INTO n FROM inspection_evaluators WHERE id = v_ea;
  INSERT INTO _result VALUES (7, 'a submitted evaluator cannot be removed',
    CASE WHEN n = 1 THEN 'PASS' ELSE 'FAIL' END,
    'rows remaining=' || n || '; a frozen pass would vanish if 0');

  DELETE FROM inspection_findings WHERE evaluator_id = v_ea;
  SELECT count(*) INTO n FROM inspection_findings WHERE evaluator_id = v_ea;
  INSERT INTO _result VALUES (8, 'findings in a submitted pass cannot be deleted',
    CASE WHEN n = 2 THEN 'PASS' ELSE 'FAIL' END, 'rows remaining=' || n || ' of 2');

  -- ── 8. an instructor who is not an evaluator sees no content ──
  IF v_c IS NOT NULL THEN
    PERFORM set_config('request.jwt.claims',
                       json_build_object('sub', v_c::text)::text, true);
    SELECT count(*) INTO n  FROM inspection_findings WHERE inspection_id = v_ins;
    SELECT count(*) INTO n2 FROM inspection_evaluators WHERE inspection_id = v_ins;
    INSERT INTO _result VALUES (9, 'org owner sees progress, not content, mid-collection',
      CASE WHEN n = 0 AND n2 = 2 THEN 'PASS' ELSE 'FAIL' END,
      'findings=' || n || ' evaluators=' || n2);
  ELSE
    INSERT INTO _result VALUES (9, 'org owner sees progress, not content, mid-collection',
      'SKIP', 'needs a third account to play a non-evaluator instructor');
  END IF;

  -- ── 9. B submits: collection closes and everything opens ──
  PERFORM set_config('request.jwt.claims',
                     json_build_object('sub', v_b::text)::text, true);
  PERFORM submit_inspection_pass(v_ins);
  SELECT status INTO st FROM inspections WHERE id = v_ins;
  INSERT INTO _result VALUES (10, 'the last submission ends collection',
    CASE WHEN st = 'consolidating' THEN 'PASS' ELSE 'FAIL' END, 'status=' || st);

  PERFORM set_config('request.jwt.claims',
                     json_build_object('sub', v_a::text)::text, true);
  SELECT count(*) INTO n FROM inspection_findings WHERE inspection_id = v_ins;
  INSERT INTO _result VALUES (11, 'both passes visible once collection is over',
    CASE WHEN n = 4 THEN 'PASS' ELSE 'FAIL' END, 'visible=' || n || ' of 4');

  -- ── 11. consolidation may attach a frozen finding to a problem ──
  DECLARE v_prob uuid;
  BEGIN
    INSERT INTO inspection_problems (inspection_id, title, agreed_severity)
      VALUES (v_ins, 'No feedback on save', 3) RETURNING id INTO v_prob;
    UPDATE inspection_findings SET problem_id = v_prob
     WHERE inspection_id = v_ins AND description LIKE '%no feedback on save';
    SELECT count(*) INTO n FROM inspection_findings
     WHERE problem_id = v_prob;
    INSERT INTO _result VALUES (12, 'consolidation may merge frozen findings',
      CASE WHEN n = 2 THEN 'PASS' ELSE 'FAIL' END, 'merged=' || n);
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (12, 'consolidation may merge frozen findings',
      'FAIL', SQLERRM);
  END;

  -- ── 12. but content is still frozen during consolidation ──
  BEGIN
    UPDATE inspection_findings SET severity = 0 WHERE evaluator_id = v_ea;
    INSERT INTO _result VALUES (13, 'consolidation cannot rewrite what was found',
      'FAIL', 'severity was changed on a frozen pass');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (13, 'consolidation cannot rewrite what was found',
      'PASS', SQLERRM);
  END;

  -- ── 13a. nobody may join after collection has closed ──────
  BEGIN
    INSERT INTO inspection_evaluators (inspection_id, user_id)
      VALUES (v_ins, COALESCE(v_c, v_a));
    SELECT count(*) INTO n FROM inspection_evaluators
     WHERE inspection_id = v_ins;
    INSERT INTO _result VALUES (131, 'no joining once collection has closed',
      CASE WHEN n = 2 THEN 'PASS' ELSE 'FAIL' END,
      'evaluators=' || n || '; an unfrozen pass beside frozen ones if 3');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (131, 'no joining once collection has closed',
      'PASS', SQLERRM);
  END;

  -- ── 13b. an inspection cannot be reopened ─────────────────
  BEGIN
    UPDATE inspections SET status = 'collecting' WHERE id = v_ins;
    INSERT INTO _result VALUES (132, 'an inspection cannot go back to collecting',
      'FAIL', 'the update succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (132, 'an inspection cannot go back to collecting',
      'PASS', SQLERRM);
  END;

  -- ── 14. the gate can demand an inspection ─────────────────
  PERFORM set_config('avalux.review_rpc', 'on', true);
  UPDATE templates SET review_mode = 'required', require_inspection = true
   WHERE id = v_tpl;
  PERFORM set_config('avalux.review_rpc', 'off', true);

  INSERT INTO _result VALUES (14, 'template_has_inspection sees the consolidated one',
    CASE WHEN template_has_inspection(v_tpl) THEN 'PASS' ELSE 'FAIL' END, '');

  BEGIN
    PERFORM request_template_review(v_tpl);
    INSERT INTO _result VALUES (15, 'review allowed once an inspection exists', 'PASS', '');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (15, 'review allowed once an inspection exists',
      'FAIL', SQLERRM);
  END;

  -- ── 15. and refuses when there is none ────────────────────
  DECLARE v_t2 uuid;
  BEGIN
    INSERT INTO templates (name, user_id, org_id, review_mode, require_inspection)
      VALUES ('ZZ inspect scratch template 2', v_a,
              (SELECT v FROM _fx WHERE k = 'org'), 'required', true)
      RETURNING id INTO v_t2;
    INSERT INTO _fx VALUES ('tpl2', v_t2);
    BEGIN
      PERFORM request_template_review(v_t2);
      INSERT INTO _result VALUES (16, 'review refused without an inspection',
        'FAIL', 'the call succeeded');
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO _result VALUES (16, 'review refused without an inspection',
        'PASS', SQLERRM);
    END;
  END;
END $rls$;

RESET ROLE;

-- ── cleanup, as superuser ───────────────────────────────────
DO $clean$
DECLARE v_ins uuid; v_org uuid;
BEGIN
  SELECT v INTO v_ins FROM _fx WHERE k = 'ins';
  SELECT v INTO v_org FROM _fx WHERE k = 'org';
  IF v_ins IS NOT NULL THEN
    -- Cascades do not consult row-level security, so this is enough.
    DELETE FROM inspections WHERE id = v_ins;
  END IF;
  IF v_org IS NOT NULL THEN
    DELETE FROM templates WHERE org_id = v_org;
    DELETE FROM organizations WHERE id = v_org;
  END IF;
END $clean$;

SELECT seq, check_name, outcome, left(detail, 70) AS detail
  FROM _result ORDER BY seq;

-- Scratch rows are already deleted. COMMIT is safe; ROLLBACK is equally fine.
COMMIT;
