-- ============================================================
-- 022 – Fix remaining anon INSERT policies that use slow JOINs
-- ============================================================

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
