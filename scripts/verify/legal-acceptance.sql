-- ============================================================
-- Verification for migration 061 (recording acceptance)
-- ============================================================
-- Paste into the Supabase SQL editor and run. Writes only rows belonging to
-- the two oldest accounts, and deletes them again.
--
-- Every read-back is done as the user whose rows are being checked. A
-- SELECT ... INTO here obeys row-level security, so reading as somebody who
-- cannot see the row returns NULL, which is indistinguishable from the write
-- having failed.

BEGIN;

CREATE TEMP TABLE _result(seq int, check_name text, outcome text, detail text) ON COMMIT DROP;
CREATE TEMP TABLE _fx(k text PRIMARY KEY, v uuid) ON COMMIT DROP;
GRANT ALL ON _result TO authenticated;
GRANT ALL ON _fx TO authenticated;

DO $fx$
DECLARE v_a uuid; v_c uuid;
BEGIN
  SELECT id INTO v_a FROM auth.users ORDER BY created_at LIMIT 1;
  SELECT id INTO v_c FROM auth.users WHERE id <> v_a ORDER BY created_at LIMIT 1;
  IF v_c IS NULL THEN
    INSERT INTO _result VALUES (0, 'setup', 'SKIP', 'needs two accounts');
    RETURN;
  END IF;
  INSERT INTO _fx VALUES ('A', v_a), ('C', v_c);
END $fx$;

SET LOCAL ROLE authenticated;

DO $rls$
DECLARE v_a uuid; v_c uuid; n int; ok boolean; v_id uuid;
BEGIN
  SELECT v INTO v_c FROM _fx WHERE k = 'C';
  IF v_c IS NULL THEN RETURN; END IF;
  SELECT v INTO v_a FROM _fx WHERE k = 'A';
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a::text)::text, true);

  -- ── 1. nothing accepted yet ───────────────────────────────
  INSERT INTO _result VALUES (1, 'a new user has accepted nothing',
    CASE WHEN NOT has_accepted_legal('zz-test') THEN 'PASS' ELSE 'FAIL' END, '');

  -- ── 2. one document is not enough ─────────────────────────
  INSERT INTO legal_acceptances (user_id, document, version)
    VALUES (v_a, 'terms', 'zz-test') RETURNING id INTO v_id;
  INSERT INTO _result VALUES (2, 'accepting only the terms does not satisfy the gate',
    CASE WHEN NOT has_accepted_legal('zz-test') THEN 'PASS' ELSE 'FAIL' END, '');

  INSERT INTO legal_acceptances (user_id, document, version)
    VALUES (v_a, 'privacy', 'zz-test');
  INSERT INTO _result VALUES (3, 'both documents satisfy it',
    CASE WHEN has_accepted_legal('zz-test') THEN 'PASS' ELSE 'FAIL' END, '');

  -- ── 3. a new version asks again ───────────────────────────
  INSERT INTO _result VALUES (4, 'a later version is not covered by an earlier acceptance',
    CASE WHEN NOT has_accepted_legal('zz-test-2') THEN 'PASS' ELSE 'FAIL' END, '');

  -- ── 4. an acceptance is a record ──────────────────────────
  BEGIN
    UPDATE legal_acceptances SET version = 'rewritten' WHERE id = v_id;
    SELECT count(*) INTO n FROM legal_acceptances WHERE id = v_id AND version = 'rewritten';
    INSERT INTO _result VALUES (5, 'an acceptance cannot be rewritten',
      CASE WHEN n = 0 THEN 'PASS' ELSE 'FAIL' END, 'rewritten rows=' || n);
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (5, 'an acceptance cannot be rewritten', 'PASS', SQLERRM);
  END;

  BEGIN
    DELETE FROM legal_acceptances WHERE id = v_id;
    SELECT count(*) INTO n FROM legal_acceptances WHERE id = v_id;
    INSERT INTO _result VALUES (6, 'an acceptance cannot be withdrawn by deleting it',
      CASE WHEN n = 1 THEN 'PASS' ELSE 'FAIL' END, 'rows still there=' || n);
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (6, 'an acceptance cannot be withdrawn by deleting it', 'PASS', SQLERRM);
  END;

  -- ── 5. accepting for somebody else ────────────────────────
  BEGIN
    INSERT INTO legal_acceptances (user_id, document, version)
      VALUES (v_c, 'terms', 'zz-test');
    INSERT INTO _result VALUES (7, 'nobody can accept on behalf of another user', 'FAIL', 'insert succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (7, 'nobody can accept on behalf of another user', 'PASS', SQLERRM);
  END;

  -- ── 6. and cannot read theirs ─────────────────────────────
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_c::text)::text, true);
  SELECT count(*) INTO n FROM legal_acceptances WHERE user_id = v_a;
  INSERT INTO _result VALUES (8, 'one user cannot see another user acceptances',
    CASE WHEN n = 0 THEN 'PASS' ELSE 'FAIL' END, 'visible=' || n);

  INSERT INTO _result VALUES (9, 'and is not carried by somebody else acceptance',
    CASE WHEN NOT has_accepted_legal('zz-test') THEN 'PASS' ELSE 'FAIL' END, '');

  -- ── 7. only the two known documents ───────────────────────
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_a::text)::text, true);
  BEGIN
    INSERT INTO legal_acceptances (user_id, document, version)
      VALUES (v_a, 'cookies', 'zz-test');
    INSERT INTO _result VALUES (10, 'optional cookie consent is not recorded here', 'FAIL', 'insert succeeded');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO _result VALUES (10, 'optional cookie consent is not recorded here', 'PASS', SQLERRM);
  END;
END $rls$;

RESET ROLE;

DO $clean$
BEGIN
  DELETE FROM legal_acceptances WHERE version IN ('zz-test', 'zz-test-2', 'rewritten');
END $clean$;

SELECT seq, check_name, outcome, left(detail, 90) AS detail FROM _result ORDER BY seq;

COMMIT;
