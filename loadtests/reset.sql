-- ============================================================
-- Load-test reset — run between runs (Supabase SQL editor)
-- ============================================================
-- Deletes sessions/participants created by load-test runs and re-arms
-- both invitation codes (the spike test intentionally exhausts
-- loadspike1). Keeps the seeded template so seed.sql need not re-run.

DO $$
DECLARE
  owner_id uuid;
BEGIN
  SELECT si.user_id INTO owner_id
    FROM session_invitations si WHERE si.code = 'loadtest1';
  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'loadtest1 invitation not found — run loadtests/seed.sql first';
  END IF;

  DELETE FROM test_sessions
   WHERE template_id IN (SELECT id FROM templates WHERE name LIKE '[LOADTEST]%');
  DELETE FROM participants
   WHERE user_id = owner_id AND name LIKE 'LT-%';

  UPDATE session_invitations
     SET is_active = true, response_count = 0
   WHERE code IN ('loadtest1', 'loadspike1');

  RAISE NOTICE 'Load-test sessions cleared; invitation codes re-armed.';
END $$;
