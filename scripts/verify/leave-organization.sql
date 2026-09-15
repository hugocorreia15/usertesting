-- ============================================================
-- Verification for migration 060 (taking a template out of an org)
-- ============================================================
-- Paste into the Supabase SQL editor and run. Scratch organizations, groups and
-- templates; assertions under the `authenticated` role; PASS/FAIL table;
-- everything it made is deleted.
--
--   A  owns organization 1 and created the template
--   C  owns organization 2, and is a member of organization 1
--
-- The two that matter: an owner may take a template out of their own
-- organization even though they did not create it, and nobody may put someone
-- else's template into one.

BEGIN;

CREATE TEMP TABLE _result(seq int, check_name text, outcome text, detail text) ON COMMIT DROP;
CREATE TEMP TABLE _fx(k text PRIMARY KEY, v uuid) ON COMMIT DROP;
GRANT ALL ON _result TO authenticated;
GRANT ALL ON _fx TO authenticated;

DO $fx$
DECLARE v_a uuid; v_c uuid; v_org1 uuid; v_org2 uuid; v_grp uuid; v_tpl uuid;
BEGIN
  SELECT id INTO v_a FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_c FROM auth.users WHERE id <> v_a ORDER BY created_at LIMIT 1;
  IF v_c IS NULL THEN
    INSERT INTO _result VALUES (0, 'setup', 'SKIP', 'needs two accounts');
    RETURN;
  END IF;

  INSERT INTO organizations (name, created_by) VALUES ('ZZ leave org one', v_a)
    RETURNING id INTO v_org1;
  INSERT INTO organization_members (org_id, user_id, role) VALUES (v_org1, v_a, 'owner');
  -- C owns organization 1 as well, to prove an owner who did not create the
  -- template may still remove it.
  INSERT INTO organization_members (org_id, user_id, role) VALUES (v_org1, v_c, 'owner');

  INSERT INTO organizations (name, created_by) VALUES ('ZZ leave org two', v_c)
    RETURNING id INTO v_org2;
  INSERT INTO organization_members (org_id, user_id, role) VALUES (v_org2, v_c, 'owner');

  INSERT INTO org_groups (org_id, name, created_by) VALUES (v_org1, 'ZZ group', v_a)
    RETURNING id INTO v_grp;

  INSERT INTO templates (name, user_id) VALUES ('ZZ leave template', v_a)
    RETURNING id INTO v_tpl;

  INSERT INTO _fx VALUES ('A', v_a), ('C', v_c), ('org1', v_org1), ('org2', v_org2),
                         ('grp', v_grp), ('tpl', v_tpl);
END $fx$;

SET LOCAL ROLE authenticated;

DO $rls$
DECLARE
  v_a uuid; v_c uuid; v_org1 uuid; v_org2 uuid; v_grp uuid; v_tpl uuid;
  ok boolean; v_org uuid; v_group uuid; n int;
BEGIN
  SELECT v INTO v_c FROM _fx WHERE k = 'C';
  IF v_c IS NULL THEN RETURN; END IF;
  SELECT v INTO v_a FROM _fx WHERE k = 'A';
  SELECT v INTO v_org1 FROM _fx WHERE k = 'org1';
  SELECT v INTO v_org2 FROM _fx WHERE k = 'org2';
  SELECT v INTO v_grp FROM _fx WHERE k = 'grp';
  SELECT v INTO v_tpl FROM _fx WHERE k = 'tpl';

  -- ── as the creator ────────────────────────────────────────
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a::text)::text, true);

  ok := set_template_org(v_tpl, v_org1);
  INSERT INTO _result VALUES (1, 'the creator may share it with an organization',
    CASE WHEN ok THEN 'PASS' ELSE 'FAIL' END, '');

  ok := set_template_group(v_tpl, v_grp);
  SELECT org_id, org_group_id INTO v_org, v_group FROM templates WHERE id = v_tpl;
  INSERT INTO _result VALUES (2, 'attaching to a group also shares it with that organization',
    CASE WHEN ok AND v_org = v_org1 AND v_group = v_grp THEN 'PASS' ELSE 'FAIL' END, '');

  -- Someone is assigned, to prove the assignment does not outlive the sharing.
  INSERT INTO template_members (template_id, user_id) VALUES (v_tpl, v_c);

  -- ── the defect this migration fixes ───────────────────────
  ok := set_template_org(v_tpl, NULL);
  SELECT org_id, org_group_id INTO v_org, v_group FROM templates WHERE id = v_tpl;
  INSERT INTO _result VALUES (3, 'removing it from the organization clears the group link',
    CASE WHEN ok AND v_org IS NULL AND v_group IS NULL THEN 'PASS' ELSE 'FAIL' END,
    'group=' || COALESCE(v_group::text, 'null'));

  SELECT count(*) INTO n FROM template_members WHERE template_id = v_tpl;
  INSERT INTO _result VALUES (4, 'student assignments go with it',
    CASE WHEN n = 0 THEN 'PASS' ELSE 'FAIL' END, 'assignments=' || n);

  SELECT count(*) INTO n FROM test_sessions WHERE template_id = v_tpl AND org_id IS NOT NULL;
  INSERT INTO _result VALUES (5, 'its sessions leave the organization too',
    CASE WHEN n = 0 THEN 'PASS' ELSE 'FAIL' END, 'still in an org=' || n);

  -- ── an owner who did not create it ────────────────────────
  PERFORM set_template_org(v_tpl, v_org1);
  PERFORM set_template_group(v_tpl, v_grp);
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_c::text)::text, true);

  ok := set_template_org(v_tpl, NULL);
  SELECT org_id INTO v_org FROM templates WHERE id = v_tpl;
  INSERT INTO _result VALUES (6, 'an owner may take a template out of their own organization',
    CASE WHEN ok AND v_org IS NULL THEN 'PASS' ELSE 'FAIL' END, '');

  -- ── but not put it anywhere ───────────────────────────────
  ok := set_template_org(v_tpl, v_org2);
  SELECT org_id INTO v_org FROM templates WHERE id = v_tpl;
  INSERT INTO _result VALUES (7, 'nobody may put someone elses template into an organization',
    CASE WHEN NOT ok AND v_org IS NULL THEN 'PASS' ELSE 'FAIL' END,
    'org=' || COALESCE(v_org::text, 'null'));

  -- ── and an outsider may not touch it at all ───────────────
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a::text)::text, true);
  PERFORM set_template_org(v_tpl, v_org1);

  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', '11111111-1111-1111-1111-111111111111')::text, true);
  ok := set_template_org(v_tpl, NULL);
  SELECT org_id INTO v_org FROM templates WHERE id = v_tpl;
  INSERT INTO _result VALUES (8, 'someone outside the organization cannot remove it',
    CASE WHEN NOT ok AND v_org = v_org1 THEN 'PASS' ELSE 'FAIL' END, '');

  -- ── moving between organizations ──────────────────────────
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a::text)::text, true);
  PERFORM set_template_group(v_tpl, v_grp);
  -- A is not a member of organization two, so this must be refused rather than
  -- moving the template somewhere it does not belong.
  ok := set_template_org(v_tpl, v_org2);
  SELECT org_id, org_group_id INTO v_org, v_group FROM templates WHERE id = v_tpl;
  INSERT INTO _result VALUES (9, 'it cannot be moved to an organization the creator is not in',
    CASE WHEN NOT ok AND v_org = v_org1 AND v_group = v_grp THEN 'PASS' ELSE 'FAIL' END, '');

  INSERT INTO _result VALUES (10, 'a refused move leaves the group link untouched',
    CASE WHEN v_group = v_grp THEN 'PASS' ELSE 'FAIL' END,
    'group=' || COALESCE(v_group::text, 'null'));
END $rls$;

RESET ROLE;

DO $clean$
DECLARE v_tpl uuid; v_org1 uuid; v_org2 uuid;
BEGIN
  SELECT v INTO v_tpl FROM _fx WHERE k = 'tpl';
  SELECT v INTO v_org1 FROM _fx WHERE k = 'org1';
  SELECT v INTO v_org2 FROM _fx WHERE k = 'org2';
  IF v_tpl IS NOT NULL THEN
    DELETE FROM test_sessions WHERE template_id = v_tpl;
    DELETE FROM templates WHERE id = v_tpl;
  END IF;
  DELETE FROM organizations WHERE id IN (v_org1, v_org2);
END $clean$;

SELECT seq, check_name, outcome, left(detail, 90) AS detail FROM _result ORDER BY seq;

COMMIT;
