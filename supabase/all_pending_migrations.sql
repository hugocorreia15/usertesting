-- ============================================================
-- 006 – Participant roles: auth_user_id + participant RLS
-- ============================================================

-- 1. Add auth_user_id column to participants
ALTER TABLE participants
  ADD COLUMN auth_user_id UUID REFERENCES auth.users(id);

CREATE INDEX idx_participants_auth_user_id ON participants(auth_user_id);

-- 2. Participant self-lookup
CREATE POLICY "Participants can read own record"
  ON participants FOR SELECT
  USING (auth_user_id = auth.uid());

-- 3. Participant can read their test sessions (via participants join)
CREATE POLICY "Participants can read own sessions"
  ON test_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM participants p
      WHERE p.id = test_sessions.participant_id
        AND p.auth_user_id = auth.uid()
    )
  );

-- 4. Participant can read task_results for own sessions
CREATE POLICY "Participants can read own task results"
  ON task_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN participants p ON p.id = ts.participant_id
      WHERE ts.id = task_results.session_id
        AND p.auth_user_id = auth.uid()
    )
  );

-- 5. Participant can read + update interview_answers for own sessions
CREATE POLICY "Participants can read own interview answers"
  ON interview_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN participants p ON p.id = ts.participant_id
      WHERE ts.id = interview_answers.session_id
        AND p.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can update own interview answers"
  ON interview_answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN participants p ON p.id = ts.participant_id
      WHERE ts.id = interview_answers.session_id
        AND p.auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN participants p ON p.id = ts.participant_id
      WHERE ts.id = interview_answers.session_id
        AND p.auth_user_id = auth.uid()
    )
  );

-- 6. Participant can read + insert + update sus_answers for own sessions
CREATE POLICY "Participants can read own sus answers"
  ON sus_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN participants p ON p.id = ts.participant_id
      WHERE ts.id = sus_answers.session_id
        AND p.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can insert own sus answers"
  ON sus_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN participants p ON p.id = ts.participant_id
      WHERE ts.id = sus_answers.session_id
        AND p.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can update own sus answers"
  ON sus_answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN participants p ON p.id = ts.participant_id
      WHERE ts.id = sus_answers.session_id
        AND p.auth_user_id = auth.uid()
    )
  );

-- 7. Participant can read template info (for session context)
CREATE POLICY "Participants can read templates for own sessions"
  ON templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN participants p ON p.id = ts.participant_id
      WHERE ts.template_id = templates.id
        AND p.auth_user_id = auth.uid()
    )
  );

-- 8. Participant can read template_tasks for own sessions
CREATE POLICY "Participants can read template tasks for own sessions"
  ON template_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN participants p ON p.id = ts.participant_id
      WHERE ts.template_id = template_tasks.template_id
        AND p.auth_user_id = auth.uid()
    )
  );

-- 9. Participant can read template_questions for own sessions
CREATE POLICY "Participants can read template questions for own sessions"
  ON template_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN participants p ON p.id = ts.participant_id
      WHERE ts.template_id = template_questions.template_id
        AND p.auth_user_id = auth.uid()
    )
  );
-- ============================================================
-- 007 – Task selection & session invitations (public links)
-- ============================================================

-- 1. Add sort_order to task_results so sessions can have custom task order
ALTER TABLE task_results ADD COLUMN sort_order int NOT NULL DEFAULT 0;

-- Backfill existing rows from template_tasks.sort_order
UPDATE task_results tr
SET sort_order = tt.sort_order
FROM template_tasks tt
WHERE tr.task_id = tt.id;

-- 2. Create session_invitations table
CREATE TABLE session_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evaluator_name TEXT NOT NULL,
  selected_task_ids UUID[] NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_responses INT,
  response_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_session_invitations_code ON session_invitations(code);
CREATE INDEX idx_session_invitations_user_id ON session_invitations(user_id);

-- 3. RLS policies for session_invitations
ALTER TABLE session_invitations ENABLE ROW LEVEL SECURITY;

-- Authenticated users can CRUD their own invitations
CREATE POLICY "Users can manage own invitations"
  ON session_invitations FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Anyone (including anon) can read active invitations by code
CREATE POLICY "Anyone can read active invitations"
  ON session_invitations FOR SELECT
  USING (is_active = true);

-- 4. Anon policies for the join flow
-- Anon can read templates linked to active invitations
CREATE POLICY "Anon can read templates via invitation"
  ON templates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM session_invitations si
      WHERE si.template_id = templates.id
        AND si.is_active = true
    )
  );

-- Anon can read template_tasks linked to active invitations
CREATE POLICY "Anon can read template tasks via invitation"
  ON template_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM session_invitations si
      WHERE si.template_id = template_tasks.template_id
        AND si.is_active = true
    )
  );

-- Anon can insert participants (for join flow)
CREATE POLICY "Anon can insert participants via invitation"
  ON participants FOR INSERT
  WITH CHECK (
    user_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM session_invitations si
      WHERE si.user_id = participants.user_id
        AND si.is_active = true
    )
  );

-- Anon can insert test_sessions (for join flow)
CREATE POLICY "Anon can insert sessions via invitation"
  ON test_sessions FOR INSERT
  WITH CHECK (
    user_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM session_invitations si
      WHERE si.user_id = test_sessions.user_id
        AND si.is_active = true
    )
  );

-- Anon can insert task_results (for join flow skeleton)
CREATE POLICY "Anon can insert task results via invitation"
  ON task_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN session_invitations si ON si.user_id = ts.user_id
      WHERE ts.id = task_results.session_id
        AND si.is_active = true
    )
  );

-- Anon can update invitation response_count
CREATE POLICY "Anon can increment invitation response count"
  ON session_invitations FOR UPDATE
  USING (is_active = true)
  WITH CHECK (is_active = true);
-- ============================================================
-- 008 – Anonymization: collected fields + anonymous participants
-- ============================================================

-- 1. Add collected_fields to session_invitations
ALTER TABLE session_invitations
  ADD COLUMN collected_fields TEXT[] NOT NULL DEFAULT '{name,email,age,gender,occupation,tech_proficiency,notes}';

-- 2. Add is_anonymous flag to participants (anonymous participants hidden from list)
ALTER TABLE participants
  ADD COLUMN is_anonymous BOOLEAN NOT NULL DEFAULT false;
-- ============================================================
-- 009 – Cascade delete from participants to test_sessions
-- ============================================================

-- Drop the existing FK and re-add with ON DELETE CASCADE
ALTER TABLE test_sessions
  DROP CONSTRAINT test_sessions_participant_id_fkey,
  ADD CONSTRAINT test_sessions_participant_id_fkey
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE;
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
-- ============================================================
-- 011 – Media answer types (audio, video, photo)
-- ============================================================

-- 1. Expand question_type check to include media types
ALTER TABLE task_questions DROP CONSTRAINT task_questions_question_type_check;
ALTER TABLE task_questions ADD CONSTRAINT task_questions_question_type_check
  CHECK (question_type IN ('open', 'single_choice', 'multiple_choice', 'rating', 'audio', 'video', 'photo'));

-- 2. Add media_url column to task_question_answers
ALTER TABLE task_question_answers ADD COLUMN media_url TEXT;

-- 3. Create storage bucket for session media
INSERT INTO storage.buckets (id, name, public)
VALUES ('session-media', 'session-media', true)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload media to their own folder
CREATE POLICY "Users can upload session media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'session-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update session media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'session-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete session media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'session-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read access (bucket is public)
CREATE POLICY "Anyone can view session media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'session-media');

-- Anon can upload media for join flow (stored under evaluator's user_id folder)
CREATE POLICY "Anon can upload session media via invitation"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (
    bucket_id = 'session-media'
    AND EXISTS (
      SELECT 1 FROM session_invitations si
      WHERE si.user_id::text = (storage.foldername(name))[1]
        AND si.is_active = true
    )
  );
-- ============================================================
-- 012 – Populate task questions for all templates
-- ============================================================

-- ── Mobile Banking App ──

-- Check account balance
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b2000000-0000-0000-0000-000000000001', 0, 'How easy was it to find your account balance?', 'rating', 1, 5);
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b2000000-0000-0000-0000-000000000001', 1, 'Where did you expect the balance to be displayed?', 'open');

-- Transfer money
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b2000000-0000-0000-0000-000000000002', 0, 'How confident did you feel during the transfer process?', 'rating', 1, 5);
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b2000000-0000-0000-0000-000000000002', 1, 'Was the confirmation step clear?', 'single_choice', '["Yes, very clear","Somewhat clear","Not clear at all"]');

-- Pay a bill
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b2000000-0000-0000-0000-000000000003', 0, 'Which payment method did you try to use?', 'single_choice', '["Credit card","Debit card","Bank transfer","Other"]');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b2000000-0000-0000-0000-000000000003', 1, 'Did you encounter any confusion during the payment flow?', 'open');

-- View transaction history
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b2000000-0000-0000-0000-000000000004', 0, 'Were you able to find the specific transaction you were looking for?', 'single_choice', '["Yes, easily","Yes, with some effort","No"]');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b2000000-0000-0000-0000-000000000004', 1, 'Which filters would you like to have available?', 'multiple_choice', '["Date range","Amount","Category","Recipient","Search by keyword"]');

-- Update personal info
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b2000000-0000-0000-0000-000000000005', 0, 'How easy was it to locate the personal info settings?', 'rating', 1, 5);
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b2000000-0000-0000-0000-000000000005', 1, 'Was the save/confirmation feedback adequate?', 'single_choice', '["Yes","No","Did not notice any"]');

-- Set up a recurring payment
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b2000000-0000-0000-0000-000000000006', 0, 'How intuitive was setting up the recurring payment?', 'rating', 1, 5);
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b2000000-0000-0000-0000-000000000006', 1, 'What frequency options did you expect to see?', 'multiple_choice', '["Daily","Weekly","Bi-weekly","Monthly","Quarterly","Yearly"]');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b2000000-0000-0000-0000-000000000006', 2, 'Any additional comments about this task?', 'open');


-- ── Bosch Seamless Panel Usability Test ──

-- S1: Wake Up the Panel
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b3000000-0000-0000-0000-000000000001', 0, 'How did you try to wake up the panel?', 'open');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b3000000-0000-0000-0000-000000000001', 1, 'Was the wake-up interaction intuitive?', 'rating', 1, 5);

-- S2: Identify Current Time
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b3000000-0000-0000-0000-000000000002', 0, 'Was the current time easy to read on the display?', 'single_choice', '["Very easy","Somewhat easy","Difficult"]');

-- S3: Identify All Buttons
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b3000000-0000-0000-0000-000000000003', 0, 'How many buttons did you identify?', 'open');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b3000000-0000-0000-0000-000000000003', 1, 'Were the button boundaries clear?', 'rating', 1, 5);

-- S4: Button Responsibilities
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b3000000-0000-0000-0000-000000000004', 0, 'Could you guess each button''s function before pressing it?', 'single_choice', '["All of them","Most of them","Some of them","None of them"]');

-- S5: Increase Temp +1°C
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b3000000-0000-0000-0000-000000000005', 0, 'How did you increase the temperature?', 'open');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b3000000-0000-0000-0000-000000000005', 1, 'Was the temperature change feedback visible enough?', 'rating', 1, 5);

-- S6: Return to Previous
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b3000000-0000-0000-0000-000000000006', 0, 'How did you return to the previous screen?', 'open');

-- S7: Turn Off Panel
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b3000000-0000-0000-0000-000000000007', 0, 'Was turning off the panel straightforward?', 'single_choice', '["Yes","No","I was unsure if it turned off"]');

-- C1: Set Temp to 40°C
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b3000000-0000-0000-0000-000000000008', 0, 'How easy was it to set the exact temperature?', 'rating', 1, 5);
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b3000000-0000-0000-0000-000000000008', 1, 'Did you use the buttons or a different method?', 'open');

-- C2: Change Clock to 08:30
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b3000000-0000-0000-0000-000000000009', 0, 'Was the clock setting process intuitive?', 'rating', 1, 5);
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b3000000-0000-0000-0000-000000000009', 1, 'What confused you most during this task?', 'open');

-- C3: Change Language
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b3000000-0000-0000-0000-000000000010', 0, 'How easy was it to find the language setting?', 'rating', 1, 5);
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b3000000-0000-0000-0000-000000000010', 1, 'Where did you expect to find this option?', 'single_choice', '["Main menu","Settings submenu","Long-press a button","Not sure"]');

-- C4: Explore Menu Structure
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b3000000-0000-0000-0000-000000000011', 0, 'How would you describe the menu structure?', 'single_choice', '["Very logical","Somewhat logical","Confusing","Very confusing"]');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b3000000-0000-0000-0000-000000000011', 1, 'Which menu items were hardest to find?', 'open');

-- C5: Set 35°C + Return
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b3000000-0000-0000-0000-000000000012', 0, 'Was returning to the main screen after setting 35°C easy?', 'rating', 1, 5);

-- C6: Check Device Info
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b3000000-0000-0000-0000-000000000013', 0, 'Did you find the device info section easily?', 'single_choice', '["Yes, first try","After some exploration","Could not find it"]');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b3000000-0000-0000-0000-000000000013', 1, 'What information did you expect to find there?', 'open');

-- C7: Error Recovery
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b3000000-0000-0000-0000-000000000014', 0, 'How did you attempt to recover from the error?', 'open');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b3000000-0000-0000-0000-000000000014', 1, 'Was the error message helpful?', 'single_choice', '["Very helpful","Somewhat helpful","Not helpful","There was no error message"]');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b3000000-0000-0000-0000-000000000014', 2, 'Rate the overall error recovery experience', 'rating', 1, 5);
-- ============================================================
-- 013 – Participant live access (anon SELECT + UPDATE + Realtime)
-- ============================================================

-- Anon can read participants they just created (needed for .insert().select())
CREATE POLICY "Anon can read participants via invitation"
  ON participants FOR SELECT
  TO anon
  USING (
    user_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM session_invitations si
      WHERE si.user_id = participants.user_id
        AND si.is_active = true
    )
  );

-- Anon can read sessions created via invitations (to see status changes)
CREATE POLICY "Anon can read sessions via invitation"
  ON test_sessions FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM session_invitations si
      WHERE si.user_id = test_sessions.user_id
        AND si.template_id = test_sessions.template_id
        AND si.is_active = true
    )
  );

-- Anon can read task results for invitation sessions (to see completed tasks)
CREATE POLICY "Anon can read task results via invitation"
  ON task_results FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM test_sessions ts
      JOIN session_invitations si
        ON si.user_id = ts.user_id
        AND si.template_id = ts.template_id
        AND si.is_active = true
      WHERE ts.id = task_results.session_id
    )
  );

-- Anon can read task question answers (to know which they already answered)
CREATE POLICY "Anon can read task question answers via invitation"
  ON task_question_answers FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM task_results tr
      JOIN test_sessions ts ON ts.id = tr.session_id
      JOIN session_invitations si
        ON si.user_id = ts.user_id
        AND si.template_id = ts.template_id
        AND si.is_active = true
      WHERE tr.id = task_question_answers.task_result_id
    )
  );

-- Anon can update task question answers (needed for upsert on conflict)
CREATE POLICY "Anon can update task question answers via invitation"
  ON task_question_answers FOR UPDATE
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM task_results tr
      JOIN test_sessions ts ON ts.id = tr.session_id
      JOIN session_invitations si
        ON si.user_id = ts.user_id
        AND si.template_id = ts.template_id
        AND si.is_active = true
      WHERE tr.id = task_question_answers.task_result_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM task_results tr
      JOIN test_sessions ts ON ts.id = tr.session_id
      JOIN session_invitations si
        ON si.user_id = ts.user_id
        AND si.template_id = ts.template_id
        AND si.is_active = true
      WHERE tr.id = task_question_answers.task_result_id
    )
  );

-- Enable Supabase Realtime for session and task_results tables
ALTER PUBLICATION supabase_realtime ADD TABLE test_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE task_results;
-- ============================================================
-- 014 – E-commerce Checkout Flow: task questions with media types
-- ============================================================

-- Find a product
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b1000000-0000-0000-0000-000000000001', 0, 'How easy was it to find the product you were looking for?', 'rating', 1, 5);
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b1000000-0000-0000-0000-000000000001', 1, 'Record your thoughts on the search experience', 'audio');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b1000000-0000-0000-0000-000000000001', 2, 'Take a photo of where you got stuck (if applicable)', 'photo');

-- Add to cart
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b1000000-0000-0000-0000-000000000002', 0, 'Was the "Add to Cart" button easy to find?', 'single_choice', '["Very easy","Somewhat easy","Difficult","Could not find it"]');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b1000000-0000-0000-0000-000000000002', 1, 'Show us how you added the product to the cart', 'video');

-- Apply a discount code
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b1000000-0000-0000-0000-000000000003', 0, 'Describe any issues you had applying the discount code', 'open');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b1000000-0000-0000-0000-000000000003', 1, 'Take a screenshot of the discount applied (or error)', 'photo');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b1000000-0000-0000-0000-000000000003', 2, 'Rate the clarity of the discount feedback', 'rating', 1, 5);

-- Complete checkout
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b1000000-0000-0000-0000-000000000004', 0, 'Which payment method did you use?', 'single_choice', '["Credit card","PayPal","Apple Pay","Google Pay","Other"]');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b1000000-0000-0000-0000-000000000004', 1, 'Which steps felt unnecessary?', 'multiple_choice', '["Address entry","Payment details","Review page","Account creation","Email verification"]');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b1000000-0000-0000-0000-000000000004', 2, 'Record a quick summary of the checkout experience', 'audio');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b1000000-0000-0000-0000-000000000004', 3, 'Record a video walkthrough of the final confirmation page', 'video');

-- Track the order
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b1000000-0000-0000-0000-000000000005', 0, 'How easy was it to find the order tracking page?', 'rating', 1, 5);
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b1000000-0000-0000-0000-000000000005', 1, 'Take a photo of the tracking information displayed', 'photo');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b1000000-0000-0000-0000-000000000005', 2, 'Any final thoughts on the overall experience?', 'audio');
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
