-- ============================================================
-- 024 – Add anon access for interview answers and template questions
-- ============================================================
-- Participants need to read and update interview answers
-- during the post-session interview step.
-- Also need to read template_questions for the interview form.

-- ── template_questions (SELECT) ──
CREATE POLICY "Anon can read template questions via join code"
  ON template_questions FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      WHERE ts.template_id = template_questions.template_id
        AND ts.join_code IS NOT NULL
    )
  );

CREATE POLICY "Anon can read interview answers via join code"
  ON interview_answers FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      WHERE ts.id = interview_answers.session_id
        AND ts.join_code IS NOT NULL
    )
  );

CREATE POLICY "Anon can update interview answers via join code"
  ON interview_answers FOR UPDATE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      WHERE ts.id = interview_answers.session_id
        AND ts.join_code IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      WHERE ts.id = interview_answers.session_id
        AND ts.join_code IS NOT NULL
    )
  );
