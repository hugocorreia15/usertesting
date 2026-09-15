-- ============================================================
-- 060 – Taking a template back out of an organization
-- ============================================================
-- Sharing a template with an organization had no symmetric way out.
--
-- 1. WHO MAY UNSHARE. set_template_org() required user_id = auth.uid(), so only
--    the creator could change sharing in either direction. An owner could not
--    remove a student's project from their own organization, which is the one
--    case a teacher actually needs: a project shared into the wrong class, or a
--    student who has left. Putting a template into an organization still
--    belongs to its creator alone, because that is someone choosing to show
--    their work. Taking one out is now also available to an owner of the
--    organization it is currently in. The asymmetry is the point: you may
--    always remove something from your own organization, and you may never put
--    someone else's work into it.
--
-- 2. A GROUP LEFT BEHIND. org_group_id was never cleared when org_id changed,
--    so a template removed from an organization kept pointing at a group inside
--    it, and a template moved between organizations pointed at a group in the
--    one it had left. Groups belong to an organization; the link cannot outlive
--    the membership.
--
-- 3. ASSIGNMENTS LEFT BEHIND. template_members is how an owner scopes a project
--    to particular students. Those rows survived the template leaving the
--    organization, so re-sharing it silently restored an assignment list from
--    before, including students who had since been removed. They go with it.
--
-- What has deliberately NOT changed is set_template_group(). Detaching a
-- template from a group still leaves it shared with the organization, because a
-- shared template that belongs to no group is a real state and the list on the
-- organization page exists to show it. The missing piece was never the
-- behaviour, it was the way out, which is now in the interface.

CREATE OR REPLACE FUNCTION set_template_org(template_id_in uuid, org_id_in uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  o record;
  current_org uuid;
  is_creator boolean;
BEGIN
  SELECT org_id, user_id = auth.uid()
    INTO current_org, is_creator
    FROM templates WHERE id = template_id_in;

  IF current_org IS NULL AND is_creator IS NULL THEN
    RETURN false;             -- no such template
  END IF;

  -- Only the creator may place a template into an organization. Removing it
  -- from one is also open to an owner of that organization.
  IF NOT COALESCE(is_creator, false) THEN
    IF org_id_in IS NOT NULL
       OR current_org IS NULL
       OR NOT is_org_owner(current_org) THEN
      RETURN false;
    END IF;
  END IF;

  IF org_id_in IS NOT NULL AND NOT is_org_member(org_id_in) THEN
    RETURN false;
  END IF;

  UPDATE templates
     SET org_id = org_id_in,
         -- A group belongs to one organization, so the link cannot survive a
         -- change of organization in either direction.
         org_group_id = CASE
           WHEN org_id_in IS DISTINCT FROM current_org THEN NULL
           ELSE org_group_id
         END
   WHERE id = template_id_in;

  UPDATE test_sessions SET org_id = org_id_in WHERE template_id = template_id_in;

  -- Student scoping is an organization concept. Leaving one drops it, so that
  -- coming back later starts from nobody assigned rather than from a list that
  -- may name people who have since been removed.
  IF org_id_in IS DISTINCT FROM current_org THEN
    DELETE FROM template_members WHERE template_id = template_id_in;
  END IF;

  IF org_id_in IS NOT NULL THEN
    SELECT default_review_mode, default_consent_text, default_instruments
      INTO o FROM organizations WHERE id = org_id_in;

    PERFORM set_config('avalux.review_rpc', 'on', true);
    UPDATE templates t
       SET review_mode = o.default_review_mode,
           consent_text = COALESCE(NULLIF(btrim(t.consent_text), ''),
                                   o.default_consent_text),
           instruments = CASE
             WHEN cardinality(t.instruments) = 0 THEN o.default_instruments
             ELSE t.instruments
           END
     WHERE t.id = template_id_in;
    PERFORM set_config('avalux.review_rpc', 'off', true);
  END IF;

  RETURN true;
END $$;

REVOKE ALL ON FUNCTION set_template_org(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION set_template_org(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION set_template_org(uuid, uuid) IS
  'Share a template with an organization, or take it out. Only the creator may put one in; an owner of the organization it is in may also take it out. Clears the group link and any student assignments when the organization changes.';
