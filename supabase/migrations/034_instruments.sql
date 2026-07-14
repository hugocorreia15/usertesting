-- ============================================================
-- 034 – Additional standardized questionnaires (NASA-TLX, UEQ-S)
-- ============================================================
-- Templates choose which post-session instruments to administer beyond
-- the (always-on) SUS. Answers land in a generic instrument_answers
-- table; item definitions and scoring live in the app
-- (src/lib/instruments.ts). SUS keeps its dedicated table unchanged.

-- ── 1. Instrument selection per template ──
ALTER TABLE templates
  ADD COLUMN instruments text[] NOT NULL DEFAULT '{}';
-- values among: 'nasa_tlx', 'ueq_s' (SUS is implicit and always on)

-- ── 2. Generic instrument answers ──
CREATE TABLE instrument_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  instrument text NOT NULL CHECK (instrument IN ('nasa_tlx', 'ueq_s')),
  item_number int NOT NULL,
  score numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (session_id, instrument, item_number)
);
CREATE INDEX idx_instrument_answers_session ON instrument_answers(session_id);

ALTER TABLE instrument_answers ENABLE ROW LEVEL SECURITY;

-- Owner (evaluator): full access via session ownership
CREATE POLICY "instrument_answers_owner_select" ON instrument_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM test_sessions ts
          WHERE ts.id = instrument_answers.session_id AND ts.user_id = auth.uid())
);
CREATE POLICY "instrument_answers_owner_all" ON instrument_answers FOR ALL USING (
  EXISTS (SELECT 1 FROM test_sessions ts
          WHERE ts.id = instrument_answers.session_id AND ts.user_id = auth.uid())
);

-- Participant portal accounts: read own sessions' answers
CREATE POLICY "instrument_answers_participant_select" ON instrument_answers FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM test_sessions ts
    JOIN participants p ON p.id = ts.participant_id
    WHERE ts.id = instrument_answers.session_id
      AND p.auth_user_id = auth.uid()
  )
);

-- Anon (join-code sessions): insert + read, mirroring sus_answers (021)
CREATE POLICY "Anon can insert instrument answers via join code"
  ON instrument_answers FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      WHERE ts.id = instrument_answers.session_id
        AND ts.join_code IS NOT NULL
    )
  );
CREATE POLICY "Anon can read instrument answers via join code"
  ON instrument_answers FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      WHERE ts.id = instrument_answers.session_id
        AND ts.join_code IS NOT NULL
    )
  );
