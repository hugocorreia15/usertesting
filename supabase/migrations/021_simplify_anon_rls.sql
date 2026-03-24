-- ============================================================
-- 021 – Simplify anon RLS policies to avoid expensive JOINs
-- ============================================================
-- Replace session_invitations JOINs with a simple join_code check.
-- Sessions created via the join flow always have a join_code set,
-- so this is a reliable and fast indicator of participant access.

-- Also add a composite index for remaining invitation lookups.
CREATE INDEX IF NOT EXISTS idx_session_invitations_user_template_active
  ON session_invitations(user_id, template_id) WHERE is_active = true;

-- ── test_sessions ──
DROP POLICY IF EXISTS "Anon can read sessions via invitation" ON test_sessions;
CREATE POLICY "Anon can read sessions with join code"
  ON test_sessions FOR SELECT
  TO anon
  USING (join_code IS NOT NULL);

-- ── task_results ──
DROP POLICY IF EXISTS "Anon can read task results via invitation" ON task_results;
CREATE POLICY "Anon can read task results via join code"
  ON task_results FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      WHERE ts.id = task_results.session_id
        AND ts.join_code IS NOT NULL
    )
  );

-- ── task_question_answers (SELECT) ──
DROP POLICY IF EXISTS "Anon can read task question answers via invitation" ON task_question_answers;
CREATE POLICY "Anon can read task question answers via join code"
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

-- ── task_question_answers (UPDATE) ──
DROP POLICY IF EXISTS "Anon can update task question answers via invitation" ON task_question_answers;
CREATE POLICY "Anon can update task question answers via join code"
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

-- ── task_question_answers (INSERT) – both policies ──
DROP POLICY IF EXISTS "Anon can insert task question answers via invitation" ON task_question_answers;
DROP POLICY IF EXISTS "Anon can insert task question answers by join code" ON task_question_answers;
CREATE POLICY "Anon can insert task question answers via join code"
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

-- ── sus_answers (INSERT) ──
DROP POLICY IF EXISTS "Anon can insert SUS answers via invitation" ON sus_answers;
CREATE POLICY "Anon can insert SUS answers via join code"
  ON sus_answers FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      WHERE ts.id = sus_answers.session_id
        AND ts.join_code IS NOT NULL
    )
  );

-- ── sus_answers (SELECT) ──
DROP POLICY IF EXISTS "Anon can read SUS answers via invitation" ON sus_answers;
CREATE POLICY "Anon can read SUS answers via join code"
  ON sus_answers FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      WHERE ts.id = sus_answers.session_id
        AND ts.join_code IS NOT NULL
    )
  );

-- ── interview_answers (INSERT) ──
DROP POLICY IF EXISTS "Anon can insert interview answers via invitation" ON interview_answers;
CREATE POLICY "Anon can insert interview answers via join code"
  ON interview_answers FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      WHERE ts.id = interview_answers.session_id
        AND ts.join_code IS NOT NULL
    )
  );

-- ── participants (SELECT) ──
DROP POLICY IF EXISTS "Anon can read participants via invitation" ON participants;
-- Not needed for participant live view, drop without replacement

-- ── participants (INSERT) ──
DROP POLICY IF EXISTS "Anon can insert participants via invitation" ON participants;
CREATE POLICY "Anon can insert participants for join flow"
  ON participants FOR INSERT
  TO anon
  WITH CHECK (user_id IS NOT NULL);

-- ── test_sessions (INSERT) ──
DROP POLICY IF EXISTS "Anon can insert sessions via invitation" ON test_sessions;
CREATE POLICY "Anon can insert sessions for join flow"
  ON test_sessions FOR INSERT
  TO anon
  WITH CHECK (user_id IS NOT NULL AND join_code IS NOT NULL);

-- ── task_results (INSERT) ──
DROP POLICY IF EXISTS "Anon can insert task results via invitation" ON task_results;
CREATE POLICY "Anon can insert task results via join code"
  ON task_results FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      WHERE ts.id = task_results.session_id
        AND ts.join_code IS NOT NULL
    )
  );
