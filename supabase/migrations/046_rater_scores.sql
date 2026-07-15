-- ============================================================
-- 046 – Inter-rater reliability: independent co-rater scores
-- ============================================================
-- A second evaluator can score the same session's tasks independently,
-- in parallel with the primary evaluator. The primary's record stays
-- in task_results (treated as one rater); each co-rater's parallel
-- judgments land here, one row per (session, rater, task). Session
-- detail then computes agreement (Cohen's kappa on completion status,
-- count agreement) between the primary and each co-rater.
--
-- Access reuses can_note_session (043-style definer helper: session
-- creator OR org read access), so anyone who may observe a session may
-- co-rate it and read all raters' scores to compute agreement.

CREATE TABLE rater_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES template_tasks(id) ON DELETE CASCADE,
  rater_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rater_email text,
  completion_status text
    CHECK (completion_status IN ('success', 'partial', 'failure', 'skipped')),
  action_count int,
  error_count int,
  hesitation_count int,
  seq_rating int CHECK (seq_rating BETWEEN 1 AND 7),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (session_id, rater_id, task_id)
);
CREATE INDEX idx_rater_scores_session ON rater_scores(session_id);

ALTER TABLE rater_scores ENABLE ROW LEVEL SECURITY;

-- Read: anyone who can observe the session (to compute agreement).
CREATE POLICY rater_scores_select ON rater_scores FOR SELECT TO authenticated
  USING (can_note_session(session_id));

-- Write: only your own rows, and only on sessions you may observe.
CREATE POLICY rater_scores_insert ON rater_scores FOR INSERT TO authenticated
  WITH CHECK (rater_id = auth.uid() AND can_note_session(session_id));
CREATE POLICY rater_scores_update ON rater_scores FOR UPDATE TO authenticated
  USING (rater_id = auth.uid() AND can_note_session(session_id))
  WITH CHECK (rater_id = auth.uid() AND can_note_session(session_id));
CREATE POLICY rater_scores_delete ON rater_scores FOR DELETE TO authenticated
  USING (rater_id = auth.uid());
