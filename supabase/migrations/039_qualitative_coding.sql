-- ============================================================
-- 039 – Qualitative coding (P2.4)
-- ============================================================
-- A code book per template (short code + color + optional definition)
-- and many-to-many tags on open-text answers: task question answers and
-- interview answers. Evaluator-only (codes are an analysis artifact);
-- participants never see or write them.

-- ── 1. Code book ──
CREATE TABLE template_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  code text NOT NULL,
  description text,
  color text NOT NULL DEFAULT '#6366f1',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (template_id, code)
);
CREATE INDEX idx_template_codes_template_id ON template_codes(template_id);

-- ── 2. Answer tags ──
-- Exactly one of the two answer references is set.
CREATE TABLE answer_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id uuid NOT NULL REFERENCES template_codes(id) ON DELETE CASCADE,
  task_question_answer_id uuid REFERENCES task_question_answers(id) ON DELETE CASCADE,
  interview_answer_id uuid REFERENCES interview_answers(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  CHECK (
    (task_question_answer_id IS NULL) <> (interview_answer_id IS NULL)
  ),
  UNIQUE (code_id, task_question_answer_id),
  UNIQUE (code_id, interview_answer_id)
);
CREATE INDEX idx_answer_codes_code_id ON answer_codes(code_id);
CREATE INDEX idx_answer_codes_tqa_id ON answer_codes(task_question_answer_id);
CREATE INDEX idx_answer_codes_ia_id ON answer_codes(interview_answer_id);

-- ── 3. RLS: template owner only ──
ALTER TABLE template_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "template_codes_owner_all" ON template_codes
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM templates t
            WHERE t.id = template_codes.template_id
              AND t.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM templates t
            WHERE t.id = template_codes.template_id
              AND t.user_id = auth.uid())
  );

CREATE POLICY "answer_codes_owner_all" ON answer_codes
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM template_codes tc
            JOIN templates t ON t.id = tc.template_id
            WHERE tc.id = answer_codes.code_id
              AND t.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM template_codes tc
            JOIN templates t ON t.id = tc.template_id
            WHERE tc.id = answer_codes.code_id
              AND t.user_id = auth.uid())
  );
