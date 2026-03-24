-- ============================================================
-- 023 – Add anon SELECT on participants for join flow
-- ============================================================
-- The join flow uses .insert().select().single() which requires
-- both INSERT and SELECT policies. Migration 021 dropped the
-- SELECT policy — this restores it with a simpler check.

CREATE POLICY "Anon can read participants for join flow"
  ON participants FOR SELECT
  TO anon
  USING (user_id IS NOT NULL);
