-- ============================================================
-- 041 – Teams / organizations (P2.7)
-- ============================================================
-- Orgs with owner/member roles and a code-based invite flow. Sharing is
-- ADDITIVE: every existing user_id ownership policy stays untouched
-- (permissive policies OR together), so single-user flows cannot
-- regress. A template assigned to an org becomes editable by all
-- members (including its code book and tags); the org's sessions and
-- their data become readable by members (editing stays with the
-- session creator until the spectator role lands). Sessions inherit
-- the template's org via a trigger, so the anon join flow needs no
-- client changes. Session media stays creator-only (storage policies
-- untouched) — a documented v1 limitation.

-- ── 1. Core tables ──
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE organization_members (
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  -- display convenience; auth.users is not client-readable
  member_email text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (org_id, user_id)
);
CREATE INDEX idx_org_members_user ON organization_members(user_id);

CREATE TABLE organization_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code text NOT NULL UNIQUE,
  label text,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_by uuid REFERENCES auth.users(id),
  accepted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_org_invites_org ON organization_invites(org_id);

-- ── 2. Membership helpers ──
-- SECURITY DEFINER so policies on other tables (and on
-- organization_members itself) can consult membership without RLS
-- recursion.
CREATE OR REPLACE FUNCTION is_org_member(org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members m
    WHERE m.org_id = org AND m.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_org_owner(org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members m
    WHERE m.org_id = org AND m.user_id = auth.uid() AND m.role = 'owner'
  );
$$;

REVOKE ALL ON FUNCTION is_org_member(uuid) FROM public;
REVOKE ALL ON FUNCTION is_org_owner(uuid) FROM public;
GRANT EXECUTE ON FUNCTION is_org_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_org_owner(uuid) TO authenticated;

-- ── 3. RLS on the org tables ──
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY orgs_select ON organizations FOR SELECT TO authenticated
  USING (created_by = auth.uid() OR is_org_member(id));
CREATE POLICY orgs_insert ON organizations FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY orgs_update ON organizations FOR UPDATE TO authenticated
  USING (is_org_owner(id));
CREATE POLICY orgs_delete ON organizations FOR DELETE TO authenticated
  USING (is_org_owner(id));

CREATE POLICY org_members_select ON organization_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_org_member(org_id));
-- Bootstrap only: the org creator inserts themself as owner. Every
-- other membership is created by accept_org_invite (SECURITY DEFINER).
CREATE POLICY org_members_insert_bootstrap ON organization_members FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND role = 'owner'
    AND EXISTS (SELECT 1 FROM organizations o
                WHERE o.id = org_id AND o.created_by = auth.uid())
  );
-- Owners remove members; anyone can remove themself (leave)
CREATE POLICY org_members_delete ON organization_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR is_org_owner(org_id));

CREATE POLICY org_invites_owner_all ON organization_invites FOR ALL TO authenticated
  USING (is_org_owner(org_id)) WITH CHECK (is_org_owner(org_id));

-- ── 4. Invite acceptance (atomic, definer) ──
CREATE OR REPLACE FUNCTION accept_org_invite(invite_code text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  inv organization_invites%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  SELECT * INTO inv FROM organization_invites
   WHERE code = invite_code
     AND accepted_at IS NULL
     AND (expires_at IS NULL OR expires_at > now())
   FOR UPDATE;
  IF inv.id IS NULL THEN RETURN false; END IF;

  INSERT INTO organization_members (org_id, user_id, role, member_email)
  VALUES (
    inv.org_id, auth.uid(), inv.role,
    (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  ON CONFLICT (org_id, user_id) DO NOTHING;

  UPDATE organization_invites
     SET accepted_at = now(), accepted_by = auth.uid()
   WHERE id = inv.id;
  RETURN true;
END $$;

REVOKE ALL ON FUNCTION accept_org_invite(text) FROM public;
GRANT EXECUTE ON FUNCTION accept_org_invite(text) TO authenticated;

-- ── 5. Org ownership columns + session inheritance ──
ALTER TABLE templates
  ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE SET NULL;
ALTER TABLE test_sessions
  ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE SET NULL;
CREATE INDEX idx_templates_org ON templates(org_id) WHERE org_id IS NOT NULL;
CREATE INDEX idx_test_sessions_org ON test_sessions(org_id) WHERE org_id IS NOT NULL;

-- Sessions always carry their template's org — including sessions
-- created by anon participants through the join flow.
CREATE OR REPLACE FUNCTION set_session_org()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  NEW.org_id := (SELECT org_id FROM templates WHERE id = NEW.template_id);
  RETURN NEW;
END $$;
CREATE TRIGGER trg_session_org BEFORE INSERT ON test_sessions
  FOR EACH ROW EXECUTE FUNCTION set_session_org();

-- Share/unshare a template you created; existing sessions follow so
-- historical data is visible to the org too.
CREATE OR REPLACE FUNCTION set_template_org(template_id_in uuid, org_id_in uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  UPDATE templates SET org_id = org_id_in
   WHERE id = template_id_in
     AND user_id = auth.uid()
     AND (org_id_in IS NULL OR is_org_member(org_id_in));
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE test_sessions SET org_id = org_id_in
   WHERE template_id = template_id_in;
  RETURN true;
END $$;

REVOKE ALL ON FUNCTION set_template_org(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION set_template_org(uuid, uuid) TO authenticated;

-- ── 6. Additive org access policies ──
-- Templates: members read + edit; insert/delete stay with the creator.
CREATE POLICY templates_org_select ON templates FOR SELECT TO authenticated
  USING (org_id IS NOT NULL AND is_org_member(org_id));
CREATE POLICY templates_org_update ON templates FOR UPDATE TO authenticated
  USING (org_id IS NOT NULL AND is_org_member(org_id));

-- Template children: full CRUD for members (editing a shared protocol).
CREATE POLICY task_groups_org_all ON task_groups FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM templates t WHERE t.id = task_groups.template_id
                 AND t.org_id IS NOT NULL AND is_org_member(t.org_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM templates t WHERE t.id = task_groups.template_id
                 AND t.org_id IS NOT NULL AND is_org_member(t.org_id)));

CREATE POLICY template_tasks_org_all ON template_tasks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_tasks.template_id
                 AND t.org_id IS NOT NULL AND is_org_member(t.org_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_tasks.template_id
                 AND t.org_id IS NOT NULL AND is_org_member(t.org_id)));

CREATE POLICY template_error_types_org_all ON template_error_types FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_error_types.template_id
                 AND t.org_id IS NOT NULL AND is_org_member(t.org_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_error_types.template_id
                 AND t.org_id IS NOT NULL AND is_org_member(t.org_id)));

CREATE POLICY template_questions_org_all ON template_questions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_questions.template_id
                 AND t.org_id IS NOT NULL AND is_org_member(t.org_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_questions.template_id
                 AND t.org_id IS NOT NULL AND is_org_member(t.org_id)));

CREATE POLICY template_participant_fields_org_all ON template_participant_fields FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_participant_fields.template_id
                 AND t.org_id IS NOT NULL AND is_org_member(t.org_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_participant_fields.template_id
                 AND t.org_id IS NOT NULL AND is_org_member(t.org_id)));

CREATE POLICY template_codes_org_all ON template_codes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_codes.template_id
                 AND t.org_id IS NOT NULL AND is_org_member(t.org_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM templates t WHERE t.id = template_codes.template_id
                 AND t.org_id IS NOT NULL AND is_org_member(t.org_id)));

CREATE POLICY task_questions_org_all ON task_questions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM template_tasks tt JOIN templates t ON t.id = tt.template_id
                 WHERE tt.id = task_questions.task_id
                   AND t.org_id IS NOT NULL AND is_org_member(t.org_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM template_tasks tt JOIN templates t ON t.id = tt.template_id
                 WHERE tt.id = task_questions.task_id
                   AND t.org_id IS NOT NULL AND is_org_member(t.org_id)));

-- Collaborative qualitative coding: members tag answers on org sessions.
CREATE POLICY answer_codes_org_all ON answer_codes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM template_codes tc JOIN templates t ON t.id = tc.template_id
                 WHERE tc.id = answer_codes.code_id
                   AND t.org_id IS NOT NULL AND is_org_member(t.org_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM template_codes tc JOIN templates t ON t.id = tc.template_id
                 WHERE tc.id = answer_codes.code_id
                   AND t.org_id IS NOT NULL AND is_org_member(t.org_id)));

-- Sessions and their data: read-only for members.
CREATE POLICY test_sessions_org_select ON test_sessions FOR SELECT TO authenticated
  USING (org_id IS NOT NULL AND is_org_member(org_id));

CREATE POLICY task_results_org_select ON task_results FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM test_sessions ts WHERE ts.id = task_results.session_id
                 AND ts.org_id IS NOT NULL AND is_org_member(ts.org_id)));

CREATE POLICY interview_answers_org_select ON interview_answers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM test_sessions ts WHERE ts.id = interview_answers.session_id
                 AND ts.org_id IS NOT NULL AND is_org_member(ts.org_id)));

CREATE POLICY sus_answers_org_select ON sus_answers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM test_sessions ts WHERE ts.id = sus_answers.session_id
                 AND ts.org_id IS NOT NULL AND is_org_member(ts.org_id)));

CREATE POLICY instrument_answers_org_select ON instrument_answers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM test_sessions ts WHERE ts.id = instrument_answers.session_id
                 AND ts.org_id IS NOT NULL AND is_org_member(ts.org_id)));

CREATE POLICY error_logs_org_select ON error_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM task_results tr JOIN test_sessions ts ON ts.id = tr.session_id
                 WHERE tr.id = error_logs.task_result_id
                   AND ts.org_id IS NOT NULL AND is_org_member(ts.org_id)));

CREATE POLICY hesitation_logs_org_select ON hesitation_logs FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM task_results tr JOIN test_sessions ts ON ts.id = tr.session_id
                 WHERE tr.id = hesitation_logs.task_result_id
                   AND ts.org_id IS NOT NULL AND is_org_member(ts.org_id)));

CREATE POLICY task_question_answers_org_select ON task_question_answers FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM task_results tr JOIN test_sessions ts ON ts.id = tr.session_id
                 WHERE tr.id = task_question_answers.task_result_id
                   AND ts.org_id IS NOT NULL AND is_org_member(ts.org_id)));

CREATE POLICY auto_events_org_select ON auto_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM test_sessions ts WHERE ts.id = auto_events.session_id
                 AND ts.org_id IS NOT NULL AND is_org_member(ts.org_id)));

-- Participants: readable when they took part in an org session.
CREATE POLICY participants_org_select ON participants FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM test_sessions ts WHERE ts.participant_id = participants.id
                 AND ts.org_id IS NOT NULL AND is_org_member(ts.org_id)));

CREATE POLICY participant_field_values_org_select ON participant_field_values FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM test_sessions ts
                 WHERE ts.participant_id = participant_field_values.participant_id
                   AND ts.org_id IS NOT NULL AND is_org_member(ts.org_id)));
