-- ============================================================
-- 019 – Allow participants (anon) to insert and read SUS answers
-- ============================================================
-- Participants joining via invitation/join-code need to submit
-- their SUS questionnaire answers after completing all tasks.

-- Anon can INSERT SUS answers for sessions linked to an active invitation
CREATE POLICY "Anon can insert SUS answers via invitation"
  ON sus_answers FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN session_invitations si
        ON si.user_id = ts.user_id
        AND si.template_id = ts.template_id
        AND si.is_active = true
      WHERE ts.id = sus_answers.session_id
    )
  );

-- Anon can read SUS answers for sessions linked to an active invitation
CREATE POLICY "Anon can read SUS answers via invitation"
  ON sus_answers FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN session_invitations si
        ON si.user_id = ts.user_id
        AND si.template_id = ts.template_id
        AND si.is_active = true
      WHERE ts.id = sus_answers.session_id
    )
  );
