-- ============================================================
-- 020 – Fix missing anon policies for join flow
-- ============================================================
-- The join flow creates interview_answers skeleton and updates
-- the invitation response_count, but anon had no permissions.

-- Anon can insert interview_answers for sessions created via invitation
CREATE POLICY "Anon can insert interview answers via invitation"
  ON interview_answers FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN session_invitations si
        ON si.user_id = ts.user_id
        AND si.template_id = ts.template_id
        AND si.is_active = true
      WHERE ts.id = interview_answers.session_id
    )
  );

-- Anon can update session_invitations (to increment response_count)
CREATE POLICY "Anon can update invitations response count"
  ON session_invitations FOR UPDATE
  TO anon
  USING (is_active = true)
  WITH CHECK (is_active = true OR is_active = false);
