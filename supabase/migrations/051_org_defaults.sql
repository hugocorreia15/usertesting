-- ============================================================
-- 051 – Organization-level defaults for shared projects
-- ============================================================
-- A professor sets the policy once for the class rather than per project.
-- Three defaults, all inherited by a template at the moment it is shared
-- into the organization:
--
--   default_review_mode  – off | advisory | required (migration 050)
--   default_consent_text – the ethics text every team shows participants
--   default_instruments  – which post-session questionnaires to administer,
--                          so results are comparable across teams
--
-- Inheritance is deliberate about not clobbering work: consent text and
-- instruments are copied only when the template has none of its own. The
-- review mode is always taken from the organization, because that is the
-- organization's policy rather than the team's choice.
--
-- Changing a default later does NOT silently rewrite existing projects;
-- forcing approval onto a study already running would be worse than the
-- surprise of it not applying. apply_org_defaults() retrofits explicitly,
-- from a button that names how many projects it will touch.
--
-- Existing organizations get review 'off', no consent text, and no
-- instruments, so nothing changes until an owner sets something.

ALTER TABLE organizations
  ADD COLUMN default_review_mode text NOT NULL DEFAULT 'off'
    CHECK (default_review_mode IN ('off', 'advisory', 'required')),
  ADD COLUMN default_consent_text text,
  ADD COLUMN default_instruments text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN organizations.default_review_mode IS
  'Review mode a template takes when shared into this organization.';
COMMENT ON COLUMN organizations.default_consent_text IS
  'Consent text copied to a shared template that has none of its own.';
COMMENT ON COLUMN organizations.default_instruments IS
  'Post-session instruments copied to a shared template that has none.';

-- ── Inheritance at share time ───────────────────────────────
-- Replaces the 041 version. Same contract and same ownership checks; it
-- additionally copies the organization's defaults when sharing. The
-- review-column guard from 050 refuses writes to review_mode unless the
-- transaction-local flag is set, so this function sets it.

CREATE OR REPLACE FUNCTION set_template_org(template_id_in uuid, org_id_in uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE o record;
BEGIN
  UPDATE templates SET org_id = org_id_in
   WHERE id = template_id_in
     AND user_id = auth.uid()
     AND (org_id_in IS NULL OR is_org_member(org_id_in));
  IF NOT FOUND THEN RETURN false; END IF;

  UPDATE test_sessions SET org_id = org_id_in
   WHERE template_id = template_id_in;

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

-- ── Explicit retrofit ───────────────────────────────────────
-- Returns how many templates were touched, so the UI can report it.
-- Each default is applied only if the caller asked for it.

CREATE OR REPLACE FUNCTION apply_org_defaults(
  org_id_in uuid,
  apply_review boolean DEFAULT false,
  apply_consent boolean DEFAULT false,
  apply_instruments boolean DEFAULT false
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  o record;
  touched integer;
BEGIN
  IF NOT is_org_owner(org_id_in) THEN
    RAISE EXCEPTION 'only an organization owner can apply defaults'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF NOT (apply_review OR apply_consent OR apply_instruments) THEN
    RETURN 0;
  END IF;

  SELECT default_review_mode, default_consent_text, default_instruments
    INTO o FROM organizations WHERE id = org_id_in;

  -- The 050 guard short-circuits while this flag is on, so changing
  -- instruments here does not send approved protocols back to draft. That is
  -- intended: the caller is the organization owner, who is also the approver.
  PERFORM set_config('avalux.review_rpc', 'on', true);
  WITH updated AS (
    UPDATE templates t
       SET review_mode = CASE WHEN apply_review
                              THEN o.default_review_mode ELSE t.review_mode END,
           consent_text = CASE WHEN apply_consent
                               THEN o.default_consent_text ELSE t.consent_text END,
           instruments  = CASE WHEN apply_instruments
                               THEN o.default_instruments ELSE t.instruments END
     WHERE t.org_id = org_id_in
    RETURNING 1
  )
  SELECT count(*) INTO touched FROM updated;
  PERFORM set_config('avalux.review_rpc', 'off', true);

  RETURN touched;
END $$;

REVOKE ALL ON FUNCTION apply_org_defaults(uuid, boolean, boolean, boolean) FROM public;
GRANT EXECUTE ON FUNCTION apply_org_defaults(uuid, boolean, boolean, boolean) TO authenticated;
