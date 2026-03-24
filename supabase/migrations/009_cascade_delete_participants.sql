-- ============================================================
-- 009 – Cascade delete from participants to test_sessions
-- ============================================================

-- Drop the existing FK and re-add with ON DELETE CASCADE
ALTER TABLE test_sessions
  DROP CONSTRAINT test_sessions_participant_id_fkey,
  ADD CONSTRAINT test_sessions_participant_id_fkey
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE;
