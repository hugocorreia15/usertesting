-- ============================================================
-- 013 – Participant live access (anon SELECT + UPDATE + Realtime)
-- ============================================================

-- Anon can read participants they just created (needed for .insert().select())
CREATE POLICY "Anon can read participants via invitation"
  ON participants FOR SELECT
  TO anon
  USING (
    user_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM session_invitations si
      WHERE si.user_id = participants.user_id
        AND si.is_active = true
    )
  );

-- Anon can read sessions created via invitations (to see status changes)
CREATE POLICY "Anon can read sessions via invitation"
  ON test_sessions FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM session_invitations si
      WHERE si.user_id = test_sessions.user_id
        AND si.template_id = test_sessions.template_id
        AND si.is_active = true
    )
  );

-- Anon can read task results for invitation sessions (to see completed tasks)
CREATE POLICY "Anon can read task results via invitation"
  ON task_results FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN session_invitations si
        ON si.user_id = ts.user_id
        AND si.template_id = ts.template_id
        AND si.is_active = true
      WHERE ts.id = task_results.session_id
    )
  );

-- Anon can read task question answers (to know which they already answered)
CREATE POLICY "Anon can read task question answers via invitation"
  ON task_question_answers FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM task_results tr
      JOIN test_sessions ts ON ts.id = tr.session_id
      JOIN session_invitations si
        ON si.user_id = ts.user_id
        AND si.template_id = ts.template_id
        AND si.is_active = true
      WHERE tr.id = task_question_answers.task_result_id
    )
  );

-- Anon can update task question answers (needed for upsert on conflict)
CREATE POLICY "Anon can update task question answers via invitation"
  ON task_question_answers FOR UPDATE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM task_results tr
      JOIN test_sessions ts ON ts.id = tr.session_id
      JOIN session_invitations si
        ON si.user_id = ts.user_id
        AND si.template_id = ts.template_id
        AND si.is_active = true
      WHERE tr.id = task_question_answers.task_result_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM task_results tr
      JOIN test_sessions ts ON ts.id = tr.session_id
      JOIN session_invitations si
        ON si.user_id = ts.user_id
        AND si.template_id = ts.template_id
        AND si.is_active = true
      WHERE tr.id = task_question_answers.task_result_id
    )
  );

-- Enable Supabase Realtime for session and task_results tables
ALTER PUBLICATION supabase_realtime ADD TABLE test_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE task_results;
