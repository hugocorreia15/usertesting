-- ============================================================
-- 040 – Auto-instrumentation events (P2.5)
-- ============================================================
-- Browser-based systems under test can embed a small script
-- (public/avalux-instrument.js) that streams click / keydown /
-- navigation events into the participant's session, keyed by the
-- session join code. Gives an objective event trace to compare against
-- the evaluator's manually logged action counts.

CREATE TABLE auto_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('click', 'keydown', 'navigation')),
  occurred_at timestamptz NOT NULL,
  path text,
  -- element descriptor for clicks, key name for keydown, target URL for
  -- navigation; never raw typed text
  detail text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_auto_events_session_id ON auto_events(session_id);
CREATE INDEX idx_auto_events_session_time ON auto_events(session_id, occurred_at);

ALTER TABLE auto_events ENABLE ROW LEVEL SECURITY;

-- Owner (evaluator): full access via session ownership
CREATE POLICY "auto_events_owner_all" ON auto_events FOR ALL
  USING (
    EXISTS (SELECT 1 FROM test_sessions ts
            WHERE ts.id = auto_events.session_id AND ts.user_id = auth.uid())
  );

-- The instrumented system posts as anon; only into sessions that are
-- joinable AND currently running, so nothing accumulates outside the
-- moderated window.
CREATE POLICY "Anon can insert auto events via join code"
  ON auto_events FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      WHERE ts.id = auto_events.session_id
        AND ts.join_code IS NOT NULL
        AND ts.status = 'in_progress'
    )
  );
