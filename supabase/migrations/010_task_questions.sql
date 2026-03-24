-- ============================================================
-- 010 – Per-task questions (open, single_choice, multiple_choice, rating)
-- ============================================================

-- 1. Task questions (belong to a template_task)
CREATE TABLE task_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES template_tasks(id) ON DELETE CASCADE,
  sort_order INT NOT NULL DEFAULT 0,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'open'
    CHECK (question_type IN ('open', 'single_choice', 'multiple_choice', 'rating')),
  options JSONB, -- for single/multiple choice: ["Option A", "Option B", ...]
  rating_min INT, -- for rating type
  rating_max INT, -- for rating type
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_questions_task_id ON task_questions(task_id);

-- 2. Task question answers (belong to a task_result)
CREATE TABLE task_question_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_result_id UUID NOT NULL REFERENCES task_results(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES task_questions(id) ON DELETE CASCADE,
  answer_text TEXT,        -- for open questions
  selected_options JSONB,  -- for single/multiple choice: ["Option A"] or ["A","B"]
  rating_value INT,        -- for rating questions
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (task_result_id, question_id)
);

CREATE INDEX idx_task_question_answers_task_result_id ON task_question_answers(task_result_id);

-- 3. RLS
ALTER TABLE task_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_question_answers ENABLE ROW LEVEL SECURITY;

-- task_questions: readable if user owns the template or template is public
CREATE POLICY "Users can read task questions for own templates"
  ON task_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM template_tasks tt
      JOIN templates t ON t.id = tt.template_id
      WHERE tt.id = task_questions.task_id
        AND (t.user_id = auth.uid() OR t.is_public = true)
    )
  );

CREATE POLICY "Users can manage task questions for own templates"
  ON task_questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM template_tasks tt
      JOIN templates t ON t.id = tt.template_id
      WHERE tt.id = task_questions.task_id
        AND t.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM template_tasks tt
      JOIN templates t ON t.id = tt.template_id
      WHERE tt.id = task_questions.task_id
        AND t.user_id = auth.uid()
    )
  );

-- task_question_answers: follow session ownership
CREATE POLICY "Users can read own task question answers"
  ON task_question_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM task_results tr
      JOIN test_sessions ts ON ts.id = tr.session_id
      WHERE tr.id = task_question_answers.task_result_id
        AND ts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own task question answers"
  ON task_question_answers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM task_results tr
      JOIN test_sessions ts ON ts.id = tr.session_id
      WHERE tr.id = task_question_answers.task_result_id
        AND ts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM task_results tr
      JOIN test_sessions ts ON ts.id = tr.session_id
      WHERE tr.id = task_question_answers.task_result_id
        AND ts.user_id = auth.uid()
    )
  );

-- Anon can read task questions via active invitation
CREATE POLICY "Anon can read task questions via invitation"
  ON task_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM template_tasks tt
      JOIN session_invitations si ON si.template_id = tt.template_id
      WHERE tt.id = task_questions.task_id
        AND si.is_active = true
    )
  );

-- Anon can insert task_question_answers via invitation
CREATE POLICY "Anon can insert task question answers via invitation"
  ON task_question_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM task_results tr
      JOIN test_sessions ts ON ts.id = tr.session_id
      JOIN session_invitations si ON si.user_id = ts.user_id
      WHERE tr.id = task_question_answers.task_result_id
        AND si.is_active = true
    )
  );
