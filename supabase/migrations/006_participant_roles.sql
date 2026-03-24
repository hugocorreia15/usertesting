-- ============================================================
-- 006 – Participant roles: auth_user_id + participant RLS
-- ============================================================

-- 1. Add auth_user_id column to participants
ALTER TABLE participants
  ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);

CREATE INDEX idx_participants_auth_user_id ON participants(auth_user_id);

-- 2. Participant self-lookup
CREATE POLICY "Participants can read own record"
  ON participants FOR SELECT
  USING (auth_user_id = auth.uid());

-- 3. Participant can read their test sessions (via participants join)
CREATE POLICY "Participants can read own sessions"
  ON test_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM participants p
      WHERE p.id = test_sessions.participant_id
        AND p.auth_user_id = auth.uid()
    )
  );

-- 4. Participant can read task_results for own sessions
CREATE POLICY "Participants can read own task results"
  ON task_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN participants p ON p.id = ts.participant_id
      WHERE ts.id = task_results.session_id
        AND p.auth_user_id = auth.uid()
    )
  );

-- 5. Participant can read + update interview_answers for own sessions
CREATE POLICY "Participants can read own interview answers"
  ON interview_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN participants p ON p.id = ts.participant_id
      WHERE ts.id = interview_answers.session_id
        AND p.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can update own interview answers"
  ON interview_answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN participants p ON p.id = ts.participant_id
      WHERE ts.id = interview_answers.session_id
        AND p.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN participants p ON p.id = ts.participant_id
      WHERE ts.id = interview_answers.session_id
        AND p.auth_user_id = auth.uid()
    )
  );

-- 6. Participant can read + insert + update sus_answers for own sessions
CREATE POLICY "Participants can read own sus answers"
  ON sus_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN participants p ON p.id = ts.participant_id
      WHERE ts.id = sus_answers.session_id
        AND p.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can insert own sus answers"
  ON sus_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN participants p ON p.id = ts.participant_id
      WHERE ts.id = sus_answers.session_id
        AND p.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can update own sus answers"
  ON sus_answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN participants p ON p.id = ts.participant_id
      WHERE ts.id = sus_answers.session_id
        AND p.auth_user_id = auth.uid()
    )
  );

-- 7. Participant can read template info (for session context)
CREATE POLICY "Participants can read templates for own sessions"
  ON templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN participants p ON p.id = ts.participant_id
      WHERE ts.template_id = templates.id
        AND p.auth_user_id = auth.uid()
    )
  );

-- 8. Participant can read template_tasks for own sessions
CREATE POLICY "Participants can read template tasks for own sessions"
  ON template_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN participants p ON p.id = ts.participant_id
      WHERE ts.template_id = template_tasks.template_id
        AND p.auth_user_id = auth.uid()
    )
  );

-- 9. Participant can read template_questions for own sessions
CREATE POLICY "Participants can read template questions for own sessions"
  ON template_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN participants p ON p.id = ts.participant_id
      WHERE ts.template_id = template_questions.template_id
        AND p.auth_user_id = auth.uid()
    )
  );
