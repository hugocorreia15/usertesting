-- ============================================================
-- Load-test cleanup — removes ALL load-test data (SQL editor)
-- ============================================================
-- Deletes every synthetic row: sessions, participants, and the
-- [LOADTEST] template (cascading its tasks, questions, and both
-- invitations). Only namespaced rows are touched — real study data
-- is never affected. Run this when done load testing.

DO $$
DECLARE
  owner_id uuid;
BEGIN
  SELECT user_id INTO owner_id
    FROM templates WHERE name LIKE '[LOADTEST]%' LIMIT 1;

  DELETE FROM test_sessions
   WHERE template_id IN (SELECT id FROM templates WHERE name LIKE '[LOADTEST]%');

  IF owner_id IS NOT NULL THEN
    DELETE FROM participants
     WHERE user_id = owner_id AND name LIKE 'LT-%';
  END IF;

  DELETE FROM templates WHERE name LIKE '[LOADTEST]%';

  RAISE NOTICE 'All load-test data removed.';
END $$;
