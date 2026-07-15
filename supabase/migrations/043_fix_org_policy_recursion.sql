-- ============================================================
-- 043 – HOTFIX: break RLS recursion introduced by 041/042
-- ============================================================
-- APPLY IMMEDIATELY: authenticated reads of templates, test_sessions,
-- participants, task_results (the evaluator dashboard) currently fail
-- with 42P17 "infinite recursion detected in policy".
--
-- Root cause: several org policies used DIRECT subqueries on other
-- tables (EXISTS (SELECT .. FROM test_sessions ..)). Policy subqueries
-- are evaluated under the caller's RLS, and the pre-existing policies
-- close a loop: templates→test_sessions (join-code read), test_sessions
-- →participants (participant portal), participants→test_sessions (041/
-- 042 org read). SECURITY DEFINER helper functions bypass RLS in their
-- own queries (the postgres owner), so the fix is mechanical: every
-- cross-table check in an org policy moves inside a definer function.
-- Policies that already only call helpers (templates, test_sessions,
-- session_id children) are untouched.

-- ── 1. Additional definer helpers ──
CREATE OR REPLACE FUNCTION can_read_org_participant(pid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM test_sessions ts
    WHERE ts.participant_id = pid AND ts.org_id IS NOT NULL
      AND (
        EXISTS (SELECT 1 FROM organization_members m
                WHERE m.org_id = ts.org_id AND m.user_id = auth.uid()
                  AND m.role IN ('owner', 'member'))
        OR EXISTS (SELECT 1 FROM template_members tm
                   WHERE tm.template_id = ts.template_id AND tm.user_id = auth.uid())
      )
  );
$$;

CREATE OR REPLACE FUNCTION can_read_org_task_result(trid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM task_results tr
    WHERE tr.id = trid AND can_read_org_session(tr.session_id)
  );
$$;

CREATE OR REPLACE FUNCTION task_in_accessible_org_template(task_id_in uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM template_tasks tt
    WHERE tt.id = task_id_in AND can_access_org_template(tt.template_id)
  );
$$;

CREATE OR REPLACE FUNCTION code_in_accessible_org_template(code_id_in uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM template_codes tc
    WHERE tc.id = code_id_in AND can_access_org_template(tc.template_id)
  );
$$;

CREATE OR REPLACE FUNCTION template_in_collab_org(tid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM templates t
    WHERE t.id = tid AND t.org_id IS NOT NULL AND is_org_collaborator(t.org_id)
  );
$$;

CREATE OR REPLACE FUNCTION template_in_owned_org(tid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM templates t
    WHERE t.id = tid AND t.org_id IS NOT NULL AND is_org_owner(t.org_id)
  );
$$;

REVOKE ALL ON FUNCTION can_read_org_participant(uuid) FROM public;
REVOKE ALL ON FUNCTION can_read_org_task_result(uuid) FROM public;
REVOKE ALL ON FUNCTION task_in_accessible_org_template(uuid) FROM public;
REVOKE ALL ON FUNCTION code_in_accessible_org_template(uuid) FROM public;
REVOKE ALL ON FUNCTION template_in_collab_org(uuid) FROM public;
REVOKE ALL ON FUNCTION template_in_owned_org(uuid) FROM public;
GRANT EXECUTE ON FUNCTION can_read_org_participant(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION can_read_org_task_result(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION task_in_accessible_org_template(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION code_in_accessible_org_template(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION template_in_collab_org(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION template_in_owned_org(uuid) TO authenticated;

-- ── 2. Recreate the offending policies on helper calls only ──
DROP POLICY IF EXISTS participants_org_select ON participants;
CREATE POLICY participants_org_select ON participants FOR SELECT TO authenticated
  USING (can_read_org_participant(participants.id));

DROP POLICY IF EXISTS participant_field_values_org_select ON participant_field_values;
CREATE POLICY participant_field_values_org_select ON participant_field_values FOR SELECT TO authenticated
  USING (can_read_org_participant(participant_field_values.participant_id));

DROP POLICY IF EXISTS error_logs_org_select ON error_logs;
CREATE POLICY error_logs_org_select ON error_logs FOR SELECT TO authenticated
  USING (can_read_org_task_result(error_logs.task_result_id));

DROP POLICY IF EXISTS hesitation_logs_org_select ON hesitation_logs;
CREATE POLICY hesitation_logs_org_select ON hesitation_logs FOR SELECT TO authenticated
  USING (can_read_org_task_result(hesitation_logs.task_result_id));

DROP POLICY IF EXISTS task_question_answers_org_select ON task_question_answers;
CREATE POLICY task_question_answers_org_select ON task_question_answers FOR SELECT TO authenticated
  USING (can_read_org_task_result(task_question_answers.task_result_id));

DROP POLICY IF EXISTS task_questions_org_all ON task_questions;
CREATE POLICY task_questions_org_all ON task_questions FOR ALL TO authenticated
  USING (task_in_accessible_org_template(task_questions.task_id))
  WITH CHECK (task_in_accessible_org_template(task_questions.task_id));

DROP POLICY IF EXISTS answer_codes_org_all ON answer_codes;
CREATE POLICY answer_codes_org_all ON answer_codes FOR ALL TO authenticated
  USING (code_in_accessible_org_template(answer_codes.code_id))
  WITH CHECK (code_in_accessible_org_template(answer_codes.code_id));

DROP POLICY IF EXISTS template_members_select ON template_members;
CREATE POLICY template_members_select ON template_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR template_in_collab_org(template_members.template_id));

DROP POLICY IF EXISTS template_members_owner_write ON template_members;
CREATE POLICY template_members_owner_write ON template_members FOR ALL TO authenticated
  USING (template_in_owned_org(template_members.template_id))
  WITH CHECK (template_in_owned_org(template_members.template_id));
