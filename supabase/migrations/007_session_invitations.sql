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
