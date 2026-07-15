-- ============================================================
-- 042 – Student role + per-project scoping + repo link (P3.1/P3.2)
-- ============================================================
-- Classroom model inside a SINGLE organization: full members (owner /
-- member, e.g. the professor) keep org-wide access; the new 'student'
-- role sees ONLY the org templates they are assigned to via
-- template_members — with FULL EDIT on those projects (template,
-- tasks, questions, code book, tagging) and read access to the
-- project's sessions. Everything else in the org stays invisible to
-- them. Assignments are managed by org owners.
--
-- Implementation: the 041 org data policies are dropped and recreated
-- on two SECURITY DEFINER helpers that encode "full member OR assigned
-- to this template". Per-user (user_id) policies remain untouched, as
-- in 041. Also adds templates.repo_url (project repository link).

-- ── 1. Roles ──
ALTER TABLE organization_members
  DROP CONSTRAINT IF EXISTS organization_members_role_check;
ALTER TABLE organization_members
  ADD CONSTRAINT organization_members_role_check
  CHECK (role IN ('owner', 'member', 'student'));

ALTER TABLE organization_invites
  DROP CONSTRAINT IF EXISTS organization_invites_role_check;
ALTER TABLE organization_invites
  ADD CONSTRAINT organization_invites_role_check
  CHECK (role IN ('owner', 'member', 'student'));

-- ── 2. Project repository link ──
ALTER TABLE templates ADD COLUMN repo_url text;

-- ── 3. Project assignments ──
CREATE TABLE template_members (
  template_id uuid NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (template_id, user_id)
);
CREATE INDEX idx_template_members_user ON template_members(user_id);

-- ── 4. Access helpers ──
-- Full org access: owner or member (NOT student).
CREATE OR REPLACE FUNCTION is_org_collaborator(org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members m
    WHERE m.org_id = org AND m.user_id = auth.uid()
      AND m.role IN ('owner', 'member')
  );
$$;

-- Org-template access: full member of the org, or assigned to the
-- template. (The creator/user_id path lives in the original policies.)
CREATE OR REPLACE FUNCTION can_access_org_template(tid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM templates t
    WHERE t.id = tid AND t.org_id IS NOT NULL
      AND (
        EXISTS (SELECT 1 FROM organization_members m
                WHERE m.org_id = t.org_id AND m.user_id = auth.uid()
                  AND m.role IN ('owner', 'member'))
        OR EXISTS (SELECT 1 FROM template_members tm
                   WHERE tm.template_id = t.id AND tm.user_id = auth.uid())
      )
  );
$$;

CREATE OR REPLACE FUNCTION can_read_org_session(sid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM test_sessions ts
    WHERE ts.id = sid AND ts.org_id IS NOT NULL
      AND (
        EXISTS (SELECT 1 FROM organization_members m
                WHERE m.org_id = ts.org_id AND m.user_id = auth.uid()
                  AND m.role IN ('owner', 'member'))
        OR EXISTS (SELECT 1 FROM template_members tm
                   WHERE tm.template_id = ts.template_id AND tm.user_id = auth.uid())
      )
  );
$$;

REVOKE ALL ON FUNCTION is_org_collaborator(uuid) FROM public;
REVOKE ALL ON FUNCTION can_access_org_template(uuid) FROM public;
REVOKE ALL ON FUNCTION can_read_org_session(uuid) FROM public;
GRANT EXECUTE ON FUNCTION is_org_collaborator(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION can_access_org_template(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION can_read_org_session(uuid) TO authenticated;

-- ── 5. template_members RLS ──
ALTER TABLE template_members ENABLE ROW LEVEL SECURITY;

-- Students see their own assignments; full members see all assignments
-- on their org's templates (management UI).
CREATE POLICY template_members_select ON template_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM templates t
               WHERE t.id = template_members.template_id
                 AND t.org_id IS NOT NULL AND is_org_collaborator(t.org_id))
  );

-- Only org owners assign/remove project members.
CREATE POLICY template_members_owner_write ON template_members FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM templates t
                 WHERE t.id = template_members.template_id
                   AND t.org_id IS NOT NULL AND is_org_owner(t.org_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM templates t
                 WHERE t.id = template_members.template_id
                   AND t.org_id IS NOT NULL AND is_org_owner(t.org_id)));

-- ── 6. Replace the 041 org data policies with role-aware ones ──
DROP POLICY IF EXISTS templates_org_select ON templates;
DROP POLICY IF EXISTS templates_org_update ON templates;
DROP POLICY IF EXISTS task_groups_org_all ON task_groups;
DROP POLICY IF EXISTS template_tasks_org_all ON template_tasks;
DROP POLICY IF EXISTS template_error_types_org_all ON template_error_types;
DROP POLICY IF EXISTS template_questions_org_all ON template_questions;
DROP POLICY IF EXISTS template_participant_fields_org_all ON template_participant_fields;
DROP POLICY IF EXISTS template_codes_org_all ON template_codes;
DROP POLICY IF EXISTS task_questions_org_all ON task_questions;
DROP POLICY IF EXISTS answer_codes_org_all ON answer_codes;
DROP POLICY IF EXISTS test_sessions_org_select ON test_sessions;
DROP POLICY IF EXISTS task_results_org_select ON task_results;
DROP POLICY IF EXISTS interview_answers_org_select ON interview_answers;
DROP POLICY IF EXISTS sus_answers_org_select ON sus_answers;
DROP POLICY IF EXISTS instrument_answers_org_select ON instrument_answers;
DROP POLICY IF EXISTS error_logs_org_select ON error_logs;
DROP POLICY IF EXISTS hesitation_logs_org_select ON hesitation_logs;
DROP POLICY IF EXISTS task_question_answers_org_select ON task_question_answers;
DROP POLICY IF EXISTS auto_events_org_select ON auto_events;
DROP POLICY IF EXISTS participants_org_select ON participants;
DROP POLICY IF EXISTS participant_field_values_org_select ON participant_field_values;

-- Templates: read + edit for full members and assigned students.
CREATE POLICY templates_org_select ON templates FOR SELECT TO authenticated
  USING (can_access_org_template(id));
CREATE POLICY templates_org_update ON templates FOR UPDATE TO authenticated
  USING (can_access_org_template(id));

-- Template children: full CRUD follows template access.
CREATE POLICY task_groups_org_all ON task_groups FOR ALL TO authenticated
  USING (can_access_org_template(task_groups.template_id))
  WITH CHECK (can_access_org_template(task_groups.template_id));
CREATE POLICY template_tasks_org_all ON template_tasks FOR ALL TO authenticated
  USING (can_access_org_template(template_tasks.template_id))
  WITH CHECK (can_access_org_template(template_tasks.template_id));
CREATE POLICY template_error_types_org_all ON template_error_types FOR ALL TO authenticated
  USING (can_access_org_template(template_error_types.template_id))
  WITH CHECK (can_access_org_template(template_error_types.template_id));
CREATE POLICY template_questions_org_all ON template_questions FOR ALL TO authenticated
  USING (can_access_org_template(template_questions.template_id))
  WITH CHECK (can_access_org_template(template_questions.template_id));
CREATE POLICY template_participant_fields_org_all ON template_participant_fields FOR ALL TO authenticated
  USING (can_access_org_template(template_participant_fields.template_id))
  WITH CHECK (can_access_org_template(template_participant_fields.template_id));
CREATE POLICY template_codes_org_all ON template_codes FOR ALL TO authenticated
  USING (can_access_org_template(template_codes.template_id))
  WITH CHECK (can_access_org_template(template_codes.template_id));
CREATE POLICY task_questions_org_all ON task_questions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM template_tasks tt WHERE tt.id = task_questions.task_id
                 AND can_access_org_template(tt.template_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM template_tasks tt WHERE tt.id = task_questions.task_id
                 AND can_access_org_template(tt.template_id)));
CREATE POLICY answer_codes_org_all ON answer_codes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM template_codes tc WHERE tc.id = answer_codes.code_id
                 AND can_access_org_template(tc.template_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM template_codes tc WHERE tc.id = answer_codes.code_id
                 AND can_access_org_template(tc.template_id)));

-- Sessions and their data: read for full members and project members.
CREATE POLICY test_sessions_org_select ON test_sessions FOR SELECT TO authenticated
  USING (can_read_org_session(id));
CREATE POLICY task_results_org_select ON task_results FOR SELECT TO authenticated
  USING (can_read_org_session(task_results.session_id));
CREATE POLICY interview_answers_org_select ON interview_answers FOR SELECT TO authenticated
  USING (can_read_org_session(interview_answers.session_id));
CREATE POLICY sus_answers_org_select ON sus_answers FOR SELECT TO authenticated
  USING (can_read_org_session(sus_answers.session_id));
CREATE POLICY instrument_answers_org_select ON instrument_answers FOR SELECT TO authenticated
  USING (can_read_org_session(instrument_answers.session_id));
CREATE POLICY auto_events_org_select ON auto_events FOR SELECT TO authenticated
  USING (can_read_org_session(auto_events.session_id));
CREATE POLICY error_logs_org_select ON error_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM task_results tr WHERE tr.id = error_logs.task_result_id
                 AND can_read_org_session(tr.session_id)));
CREATE POLICY hesitation_logs_org_select ON hesitation_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM task_results tr WHERE tr.id = hesitation_logs.task_result_id
                 AND can_read_org_session(tr.session_id)));
CREATE POLICY task_question_answers_org_select ON task_question_answers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM task_results tr WHERE tr.id = task_question_answers.task_result_id
                 AND can_read_org_session(tr.session_id)));
CREATE POLICY participants_org_select ON participants FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM test_sessions ts WHERE ts.participant_id = participants.id
                 AND can_read_org_session(ts.id)));
CREATE POLICY participant_field_values_org_select ON participant_field_values FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM test_sessions ts
                 WHERE ts.participant_id = participant_field_values.participant_id
                   AND can_read_org_session(ts.id)));
