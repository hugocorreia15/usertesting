-- ============================================================
-- 015 – Unique join code per session
-- ============================================================

-- Each session created via public link gets its own unique code
ALTER TABLE test_sessions ADD COLUMN join_code TEXT UNIQUE;
CREATE INDEX idx_test_sessions_join_code ON test_sessions(join_code);

-- Anon can read sessions by their own join_code
-- (supplements the existing invitation-based policy from 013)
CREATE POLICY "Anon can read sessions by join code"
  ON test_sessions FOR SELECT
  TO anon
  USING (join_code IS NOT NULL);

-- Anon can read task results for sessions with join codes
CREATE POLICY "Anon can read task results by session join code"
  ON task_results FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      WHERE ts.id = task_results.session_id
        AND ts.join_code IS NOT NULL
    )
  );

-- Anon can read/write task question answers for sessions with join codes
CREATE POLICY "Anon can read task question answers by join code"
  ON task_question_answers FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM task_results tr
      JOIN test_sessions ts ON ts.id = tr.session_id
      WHERE tr.id = task_question_answers.task_result_id
        AND ts.join_code IS NOT NULL
    )
  );

CREATE POLICY "Anon can insert task question answers by join code"
  ON task_question_answers FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM task_results tr
      JOIN test_sessions ts ON ts.id = tr.session_id
      WHERE tr.id = task_question_answers.task_result_id
        AND ts.join_code IS NOT NULL
    )
  );

CREATE POLICY "Anon can update task question answers by join code"
  ON task_question_answers FOR UPDATE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM task_results tr
      JOIN test_sessions ts ON ts.id = tr.session_id
      WHERE tr.id = task_question_answers.task_result_id
        AND ts.join_code IS NOT NULL
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM task_results tr
      JOIN test_sessions ts ON ts.id = tr.session_id
      WHERE tr.id = task_question_answers.task_result_id
        AND ts.join_code IS NOT NULL
    )
  );
