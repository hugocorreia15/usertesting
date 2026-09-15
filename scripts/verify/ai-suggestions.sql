-- ============================================================
-- Verification for migration 058 (model suggestions)
-- ============================================================
-- Paste into the Supabase SQL editor and run. Scratch organization, template
-- and inspection; assertions under the `authenticated` role; PASS/FAIL table;
-- everything it made is deleted.
--
--   A  a student on the team (org member, evaluator)
--   C  someone outside the organization
--
-- What matters here is that a suggestion cannot exist before the team's own
-- work is done, cannot exist at all unless the organization opted in, and
-- cannot be rewritten afterwards.

BEGIN;

CREATE TEMP TABLE _result(seq int, check_name text, outcome text, detail text) ON COMMIT DROP;
CREATE TEMP TABLE _fx(k text PRIMARY KEY, v uuid) ON COMMIT DROP;
GRANT ALL ON _result TO authenticated;
GRANT ALL ON _fx TO authenticated;

DO $fx$
DECLARE v_a uuid; v_c uuid; v_org uuid; v_tpl uuid; v_ins uuid; v_ev uuid;
BEGIN
  SELECT id INTO v_a FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_c FROM auth.users WHERE id <> v_a ORDER BY created_at LIMIT 1;
  IF v_c IS NULL THEN
    INSERT INTO _result VALUES (0, 'setup', 'SKIP', 'needs two accounts');
    RETURN;
  END IF;

  INSERT INTO organizations (name, created_by) VALUES ('ZZ ai scratch', v_a) RETURNING id INTO v_org;
  INSERT INTO organization_members (org_id, user_id, role) VALUES (v_org, v_a, 'owner');
  INSERT INTO templates (name, user_id, org_id) VALUES ('ZZ ai template', v_a, v_org) RETURNING id INTO v_tpl;
  INSERT INTO inspections (template_id, subject_name, created_by) VALUES (v_tpl, 'Scratch', v_a)
    RETURNING id INTO v_ins;
  INSERT INTO inspection_evaluators (inspection_id, user_id, submitted_at)
    VALUES (v_ins, v_a, now()) RETURNING id INTO v_ev;

  INSERT INTO _fx VALUES ('A', v_a), ('C', v_c), ('org', v_org), ('tpl', v_tpl), ('ins', v_ins);
END $fx$;

SET LOCAL ROLE authenticated;

DO $rls$
DECLARE v_a uuid; v_c uuid; v_org uuid; v_ins uuid; n int; v_id uuid; v_status text; v_resolved boolean;
BEGIN
  SELECT v INTO v_c FROM _fx WHERE k = 'C';
  IF v_c IS NULL THEN RETURN; END IF;
  SELECT v INTO v_a FROM _fx WHERE k = 'A';
  SELECT v INTO v_org FROM _fx WHERE k = 'org';
  SELECT v INTO v_ins FROM _fx WHERE k = 'ins';

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a::text)::text, true);

  -- ── 1. off by default ─────────────────────────────────────
  INSERT INTO _result VALUES (1, 'suggestions are off until an organization opts in',
    CASE WHEN NOT inspection_ai_enabled(v_ins) THEN 'PASS' ELSE 'FAIL' END, '');

  BEGIN
    INSERT INTO ai_suggestions (inspection_id, kind, payload, requested_by)
      VALUES (v_ins, 'merge', '{"clusters":[]}'::jsonb, v_a);
    INSERT INTO _result VALUES (2, 'nothing can be stored while it is off', 'FAIL', 'insert succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (2, 'nothing can be stored while it is off', 'PASS', SQLERRM);
  END;

  -- ── 2. still blocked while passes are being collected ─────
  UPDATE organizations SET ai_suggestions_enabled = true WHERE id = v_org;
  BEGIN
    INSERT INTO ai_suggestions (inspection_id, kind, payload, requested_by)
      VALUES (v_ins, 'merge', '{"clusters":[]}'::jsonb, v_a);
    INSERT INTO _result VALUES (3, 'no suggestion before every pass is in', 'FAIL', 'insert succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (3, 'no suggestion before every pass is in', 'PASS', SQLERRM);
  END;

  -- ── 3. allowed once consolidation has started ─────────────
  PERFORM submit_inspection_pass(v_ins);
  INSERT INTO ai_suggestions (inspection_id, kind, payload, model, requested_by)
    VALUES (v_ins, 'merge', '{"clusters":[{"title":"As proposed"}]}'::jsonb, 'test-model', v_a)
    RETURNING id INTO v_id;
  INSERT INTO _result VALUES (4, 'a suggestion can be stored during consolidation',
    CASE WHEN v_id IS NOT NULL THEN 'PASS' ELSE 'FAIL' END, '');

  -- ── 4. it is a record, not a draft ────────────────────────
  BEGIN
    UPDATE ai_suggestions SET payload = '{"clusters":[{"title":"Rewritten"}]}'::jsonb WHERE id = v_id;
    INSERT INTO _result VALUES (5, 'the proposal itself cannot be rewritten', 'FAIL', 'update succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (5, 'the proposal itself cannot be rewritten', 'PASS', SQLERRM);
  END;

  UPDATE ai_suggestions SET status = 'dismissed' WHERE id = v_id;
  SELECT status, (resolved_at IS NOT NULL) INTO v_status, v_resolved FROM ai_suggestions WHERE id = v_id;
  INSERT INTO _result VALUES (6, 'a team can dismiss it, and the time is kept',
    CASE WHEN v_status = 'dismissed' AND v_resolved THEN 'PASS' ELSE 'FAIL' END, 'status=' || v_status);

  BEGIN
    INSERT INTO ai_suggestions (inspection_id, kind, payload, requested_by)
      VALUES (v_ins, 'made_up_kind', '{}'::jsonb, v_a);
    INSERT INTO _result VALUES (7, 'only the known kinds are accepted', 'FAIL', 'insert succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (7, 'only the known kinds are accepted', 'PASS', SQLERRM);
  END;

  BEGIN
    INSERT INTO ai_suggestions (inspection_id, kind, payload, requested_by)
      VALUES (v_ins, 'merge', '{}'::jsonb, v_c);
    INSERT INTO _result VALUES (8, 'nobody can file a suggestion as someone else', 'FAIL', 'insert succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (8, 'nobody can file a suggestion as someone else', 'PASS', SQLERRM);
  END;

  -- ── 5. provenance of what a suggestion produced ───────────
  INSERT INTO inspection_problems (inspection_id, title, assisted)
    VALUES (v_ins, 'Accepted from a suggestion', true);
  SELECT count(*) INTO n FROM inspection_problems WHERE inspection_id = v_ins AND assisted;
  INSERT INTO _result VALUES (9, 'an accepted grouping is marked assisted',
    CASE WHEN n = 1 THEN 'PASS' ELSE 'FAIL' END, 'assisted problems=' || n);

  -- ── 6. from outside ───────────────────────────────────────
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_c::text)::text, true);
  SELECT count(*) INTO n FROM ai_suggestions WHERE inspection_id = v_ins;
  INSERT INTO _result VALUES (10, 'someone outside the organization sees none',
    CASE WHEN n = 0 THEN 'PASS' ELSE 'FAIL' END, 'visible=' || n);
END $rls$;

RESET ROLE;

DO $clean$
DECLARE v_org uuid;
BEGIN
  SELECT v INTO v_org FROM _fx WHERE k = 'org';
  IF v_org IS NOT NULL THEN
    DELETE FROM templates WHERE org_id = v_org;   -- cascades to inspection and suggestions
    DELETE FROM organizations WHERE id = v_org;
  END IF;
END $clean$;

SELECT seq, check_name, outcome, left(detail, 90) AS detail FROM _result ORDER BY seq;

COMMIT;
