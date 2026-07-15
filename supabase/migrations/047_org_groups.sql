-- ============================================================
-- 047 – First-class organization groups + role changes (P3.7)
-- ============================================================
-- Groups are named sub-teams inside an organization (e.g. one per
-- student pair/trio). A group holds members (students) and one or more
-- project templates. A student in a group gets full edit of that
-- group's templates and read access to their sessions — the same
-- access template_members grants, now also reachable via group
-- membership. Owners manage groups, group membership, template
-- attachment, and member roles.
--
-- All cross-table checks live in SECURITY DEFINER helpers (043 lesson:
-- policy subqueries must never recurse through other tables' RLS).

-- ── 1. Tables ──
CREATE TABLE org_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_org_groups_org ON org_groups(org_id);

CREATE TABLE org_group_members (
  group_id uuid NOT NULL REFERENCES org_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_email text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);
CREATE INDEX idx_org_group_members_user ON org_group_members(user_id);

-- A template may belong to one group (a group has many templates).
ALTER TABLE templates
  ADD COLUMN org_group_id uuid REFERENCES org_groups(id) ON DELETE SET NULL;
CREATE INDEX idx_templates_org_group ON templates(org_group_id)
  WHERE org_group_id IS NOT NULL;

-- ── 2. Membership helpers ──
CREATE OR REPLACE FUNCTION is_group_member(gid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_group_members m
    WHERE m.group_id = gid AND m.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION group_in_collab_org(gid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_groups g
    WHERE g.id = gid AND is_org_collaborator(g.org_id)
  );
$$;

CREATE OR REPLACE FUNCTION group_in_owned_org(gid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM org_groups g
    WHERE g.id = gid AND is_org_owner(g.org_id)
  );
$$;

REVOKE ALL ON FUNCTION is_group_member(uuid) FROM public;
REVOKE ALL ON FUNCTION group_in_collab_org(uuid) FROM public;
REVOKE ALL ON FUNCTION group_in_owned_org(uuid) FROM public;
GRANT EXECUTE ON FUNCTION is_group_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION group_in_collab_org(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION group_in_owned_org(uuid) TO authenticated;

-- ── 3. RLS ──
ALTER TABLE org_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_group_members ENABLE ROW LEVEL SECURITY;

-- Full members see all groups; students see only their own.
CREATE POLICY org_groups_select ON org_groups FOR SELECT TO authenticated
  USING (is_org_collaborator(org_id) OR is_group_member(id));
CREATE POLICY org_groups_owner_write ON org_groups FOR ALL TO authenticated
  USING (is_org_owner(org_id))
  WITH CHECK (is_org_owner(org_id));

CREATE POLICY org_group_members_select ON org_group_members FOR SELECT TO authenticated
  USING (is_group_member(group_id) OR group_in_collab_org(group_id));
CREATE POLICY org_group_members_owner_write ON org_group_members FOR ALL TO authenticated
  USING (group_in_owned_org(group_id))
  WITH CHECK (group_in_owned_org(group_id));

-- ── 4. Template access extended to group membership ──
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
        OR EXISTS (SELECT 1 FROM org_group_members gm
                   WHERE gm.group_id = t.org_group_id AND gm.user_id = auth.uid())
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
        OR EXISTS (SELECT 1 FROM templates t
                   JOIN org_group_members gm ON gm.group_id = t.org_group_id
                   WHERE t.id = ts.template_id AND gm.user_id = auth.uid())
      )
  );
$$;

-- ── 5. Owner-managed mutations (definer, guarded) ──

-- Change a member's role. Cannot strip the last owner.
CREATE OR REPLACE FUNCTION set_member_role(
  org_id_in uuid, user_id_in uuid, role_in text
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE owner_count int;
BEGIN
  IF role_in NOT IN ('owner', 'member', 'student') THEN RETURN false; END IF;
  IF NOT is_org_owner(org_id_in) THEN RETURN false; END IF;
  IF role_in <> 'owner' THEN
    SELECT count(*) INTO owner_count FROM organization_members
      WHERE org_id = org_id_in AND role = 'owner';
    IF owner_count <= 1 AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE org_id = org_id_in AND user_id = user_id_in AND role = 'owner'
    ) THEN
      RETURN false; -- would leave the org with no owner
    END IF;
  END IF;
  UPDATE organization_members SET role = role_in
    WHERE org_id = org_id_in AND user_id = user_id_in;
  RETURN FOUND;
END $$;

-- Attach a template to a group (null detaches). Attaching also shares
-- the template with the group's org and moves its existing sessions,
-- mirroring set_template_org.
CREATE OR REPLACE FUNCTION set_template_group(
  template_id_in uuid, group_id_in uuid
) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE grp_org uuid;
BEGIN
  IF group_id_in IS NULL THEN
    UPDATE templates SET org_group_id = NULL
      WHERE id = template_id_in
        AND (user_id = auth.uid()
             OR (org_id IS NOT NULL AND is_org_owner(org_id)));
    RETURN FOUND;
  END IF;

  SELECT org_id INTO grp_org FROM org_groups WHERE id = group_id_in;
  IF grp_org IS NULL OR NOT is_org_owner(grp_org) THEN RETURN false; END IF;

  UPDATE templates SET org_group_id = group_id_in, org_id = grp_org
    WHERE id = template_id_in
      AND (user_id = auth.uid() OR org_id = grp_org);
  IF NOT FOUND THEN RETURN false; END IF;

  UPDATE test_sessions SET org_id = grp_org WHERE template_id = template_id_in;
  RETURN true;
END $$;

REVOKE ALL ON FUNCTION set_member_role(uuid, uuid, text) FROM public;
REVOKE ALL ON FUNCTION set_template_group(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION set_member_role(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION set_template_group(uuid, uuid) TO authenticated;
