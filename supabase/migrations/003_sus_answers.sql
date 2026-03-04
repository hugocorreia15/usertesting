-- SUS (System Usability Scale) answers per session
CREATE TABLE sus_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  question_number int NOT NULL CHECK (question_number BETWEEN 1 AND 10),
  score int NOT NULL CHECK (score BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE (session_id, question_number)
);

ALTER TABLE sus_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage SUS answers for own sessions"
  ON sus_answers FOR ALL
  USING (session_id IN (SELECT id FROM test_sessions WHERE user_id = auth.uid()))
  WITH CHECK (session_id IN (SELECT id FROM test_sessions WHERE user_id = auth.uid()));
