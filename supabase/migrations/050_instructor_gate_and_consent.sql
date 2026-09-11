-- ============================================================
-- 050 – Instructor gate (per-template review) and consent capture
-- ============================================================
-- INSTRUCTOR GATE
-- An organization owner can put a template under review: students request
-- review, the owner approves or requests changes. The gate closes on
-- recruiting, not rehearsal. While a template that *requires* review is
-- unapproved:
--   - join links cannot be created, except by an org owner;
--   - a session created directly is recorded as a pilot (is_pilot) and is
--     excluded from the template's aggregates, so a student can rehearse
--     the protocol and the instructor reviews with that data in hand.
-- Any protocol edit (tasks, questions, groups, error types, fields,
-- instruments) after approval or submission drops the status back to
-- draft, so what was approved is what runs.
--
-- Three modes per template: off (default), advisory (workflow visible,
-- nothing blocked), required (as above). Only meaningful on org templates.
--
-- CONSENT
-- A template may carry consent text. The join form shows it first and
-- records acceptance on the session; an evaluator can also record that
-- consent was obtained outside the platform (paper, verbal) for sessions
-- created directly.
--
-- This migration adds columns with defaults, functions, triggers and
-- policies. No existing row is rewritten and nothing is deleted.

-- ── 1. Columns ──────────────────────────────────────────────
ALTER TABLE templates
  ADD COLUMN review_mode text NOT NULL DEFAULT 'off'
    CHECK (review_mode IN ('off', 'advisory', 'required')),
  ADD COLUMN review_status text NOT NULL DEFAULT 'draft'
    CHECK (review_status IN ('draft', 'submitted', 'approved', 'changes_requested')),
  ADD COLUMN review_note text,
  ADD COLUMN review_submitted_at timestamptz,
  ADD COLUMN reviewed_at timestamptz,
  ADD COLUMN reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN approval_invalidated_at timestamptz,
  ADD COLUMN consent_text text;

COMMENT ON COLUMN templates.review_mode IS
  'off | advisory | required. Set by an org owner through set_template_review_mode().';
COMMENT ON COLUMN templates.review_status IS
  'draft | submitted | approved | changes_requested. Changes only through the review functions and the invalidation trigger.';
COMMENT ON COLUMN templates.consent_text IS
  'Shown on the join form before any data is collected. Null means no consent step.';

ALTER TABLE test_sessions
  ADD COLUMN is_pilot boolean NOT NULL DEFAULT false,
  ADD COLUMN consent_accepted_at timestamptz,
  ADD COLUMN consent_method text
    CHECK (consent_method IN ('join_form', 'recorded_by_evaluator'));

COMMENT ON COLUMN test_sessions.is_pilot IS
  'Created on a template that required review before it was approved. Excluded from template-level aggregates.';

CREATE INDEX idx_test_sessions_pilot ON test_sessions(template_id) WHERE is_pilot;

-- ── 2. Review columns change only through the functions below ──
-- Students have UPDATE on org templates, so a plain column would let them
-- approve themselves. A trigger refuses any change to the review columns
-- unless the transaction-local flag set by the review functions is on.
-- Column-level REVOKE would not do: a table-level UPDATE grant cannot be
-- narrowed by revoking one column.

CREATE OR REPLACE FUNCTION guard_template_review_columns() RETURNS trigger
  LANGUAGE plpgsql
AS $$
BEGIN
  IF current_setting('avalux.review_rpc', true) = 'on' THEN
    RETURN NEW;
  END IF;

  IF NEW.review_mode            IS DISTINCT FROM OLD.review_mode
  OR NEW.review_status          IS DISTINCT FROM OLD.review_status
  OR NEW.review_note            IS DISTINCT FROM OLD.review_note
  OR NEW.review_submitted_at    IS DISTINCT FROM OLD.review_submitted_at
  OR NEW.reviewed_at            IS DISTINCT FROM OLD.reviewed_at
  OR NEW.reviewed_by            IS DISTINCT FROM OLD.reviewed_by
  OR NEW.approval_invalidated_at IS DISTINCT FROM OLD.approval_invalidated_at
  THEN
    RAISE EXCEPTION 'review columns change only through the review functions'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Changing the instruments is a protocol edit on the template row itself.
  IF NEW.instruments IS DISTINCT FROM OLD.instruments
     AND OLD.review_mode <> 'off'
     AND OLD.review_status IN ('approved', 'submitted') THEN
    NEW.review_status := 'draft';
    NEW.approval_invalidated_at := now();
  END IF;

  RETURN NEW;
END
$$;

CREATE TRIGGER trg_templates_guard_review
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION guard_template_review_columns();

-- ── 3. Protocol edits drop an approved or submitted template to draft ──
CREATE OR REPLACE FUNCTION invalidate_template_approval() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE
  rec record;
  tid uuid;
BEGIN
  rec := CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;

  IF TG_TABLE_NAME = 'task_questions' THEN
    SELECT template_id INTO tid FROM template_tasks WHERE id = rec.task_id;
  ELSE
    tid := rec.template_id;
  END IF;

  IF tid IS NOT NULL THEN
    PERFORM set_config('avalux.review_rpc', 'on', true);
    UPDATE templates
       SET review_status = 'draft',
           approval_invalidated_at = now()
     WHERE id = tid
       AND review_mode <> 'off'
       AND review_status IN ('approved', 'submitted');
    PERFORM set_config('avalux.review_rpc', 'off', true);
  END IF;

  RETURN NULL;
END
$$;

CREATE TRIGGER trg_invalidate_approval_tasks
  AFTER INSERT OR UPDATE OR DELETE ON template_tasks
  FOR EACH ROW EXECUTE FUNCTION invalidate_template_approval();
CREATE TRIGGER trg_invalidate_approval_task_questions
  AFTER INSERT OR UPDATE OR DELETE ON task_questions
  FOR EACH ROW EXECUTE FUNCTION invalidate_template_approval();
CREATE TRIGGER trg_invalidate_approval_groups
  AFTER INSERT OR UPDATE OR DELETE ON task_groups
  FOR EACH ROW EXECUTE FUNCTION invalidate_template_approval();
CREATE TRIGGER trg_invalidate_approval_error_types
  AFTER INSERT OR UPDATE OR DELETE ON template_error_types
  FOR EACH ROW EXECUTE FUNCTION invalidate_template_approval();
CREATE TRIGGER trg_invalidate_approval_questions
  AFTER INSERT OR UPDATE OR DELETE ON template_questions
  FOR EACH ROW EXECUTE FUNCTION invalidate_template_approval();
CREATE TRIGGER trg_invalidate_approval_fields
  AFTER INSERT OR UPDATE OR DELETE ON template_participant_fields
  FOR EACH ROW EXECUTE FUNCTION invalidate_template_approval();

-- ── 4. Review functions ─────────────────────────────────────
CREATE OR REPLACE FUNCTION set_template_review_mode(tid uuid, mode text) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE t record;
BEGIN
  IF mode NOT IN ('off', 'advisory', 'required') THEN
    RAISE EXCEPTION 'invalid review mode %', mode;
  END IF;
  SELECT org_id INTO t FROM templates WHERE id = tid;
  IF t.org_id IS NULL OR NOT is_org_owner(t.org_id) THEN
    RAISE EXCEPTION 'only an organization owner can set the review mode'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  PERFORM set_config('avalux.review_rpc', 'on', true);
  UPDATE templates
     SET review_mode = mode,
         review_status = CASE WHEN mode = 'off' THEN 'draft' ELSE review_status END
   WHERE id = tid;
  PERFORM set_config('avalux.review_rpc', 'off', true);
END
$$;

CREATE OR REPLACE FUNCTION request_template_review(tid uuid) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE t record;
BEGIN
  SELECT user_id, org_id, review_mode, review_status INTO t FROM templates WHERE id = tid;
  IF t IS NULL THEN RAISE EXCEPTION 'template not found'; END IF;
  IF NOT (t.user_id = auth.uid() OR can_access_org_template(tid)) THEN
    RAISE EXCEPTION 'no edit access to this template' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF t.review_mode = 'off' THEN
    RAISE EXCEPTION 'this template is not under review';
  END IF;
  IF t.review_status NOT IN ('draft', 'changes_requested') THEN
    RAISE EXCEPTION 'review can only be requested from draft or after changes were requested';
  END IF;
  PERFORM set_config('avalux.review_rpc', 'on', true);
  UPDATE templates
     SET review_status = 'submitted',
         review_submitted_at = now(),
         approval_invalidated_at = NULL
   WHERE id = tid;
  PERFORM set_config('avalux.review_rpc', 'off', true);
END
$$;

CREATE OR REPLACE FUNCTION review_template(tid uuid, decision text, note text DEFAULT NULL)
  RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE t record;
BEGIN
  IF decision NOT IN ('approved', 'changes_requested') THEN
    RAISE EXCEPTION 'decision must be approved or changes_requested';
  END IF;
  SELECT org_id, review_mode, review_status INTO t FROM templates WHERE id = tid;
  IF t IS NULL THEN RAISE EXCEPTION 'template not found'; END IF;
  IF t.org_id IS NULL OR NOT is_org_owner(t.org_id) THEN
    RAISE EXCEPTION 'only an organization owner can review' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF t.review_mode = 'off' THEN
    RAISE EXCEPTION 'this template is not under review';
  END IF;
  PERFORM set_config('avalux.review_rpc', 'on', true);
  UPDATE templates
     SET review_status = decision,
         review_note = note,
         reviewed_at = now(),
         reviewed_by = auth.uid(),
         approval_invalidated_at = NULL
   WHERE id = tid;
  PERFORM set_config('avalux.review_rpc', 'off', true);
END
$$;

REVOKE ALL ON FUNCTION set_template_review_mode(uuid, text)      FROM public;
REVOKE ALL ON FUNCTION request_template_review(uuid)              FROM public;
REVOKE ALL ON FUNCTION review_template(uuid, text, text)          FROM public;
GRANT EXECUTE ON FUNCTION set_template_review_mode(uuid, text)    TO authenticated;
GRANT EXECUTE ON FUNCTION request_template_review(uuid)           TO authenticated;
GRANT EXECUTE ON FUNCTION review_template(uuid, text, text)       TO authenticated;

-- ── 5. Recruiting waits for approval; rehearsal is recorded as a pilot ──
CREATE OR REPLACE FUNCTION template_recruiting_allowed(tid uuid) RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT NOT (
      t.review_mode = 'required'
      AND t.review_status <> 'approved'
      AND NOT (t.org_id IS NOT NULL AND is_org_owner(t.org_id))
    )
    FROM templates t WHERE t.id = tid
  ), false);
$$;
REVOKE ALL ON FUNCTION template_recruiting_allowed(uuid) FROM public;
GRANT EXECUTE ON FUNCTION template_recruiting_allowed(uuid) TO authenticated;

-- 035 created one FOR ALL policy; its WITH CHECK would also block
-- deactivating a link on a gated template, so the verbs are split.
DROP POLICY IF EXISTS "Users can manage own invitations" ON session_invitations;

CREATE POLICY "Owners read their invitations"
  ON session_invitations FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Owners update their invitations"
  ON session_invitations FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owners delete their invitations"
  ON session_invitations FOR DELETE TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Recruiting waits for approval on gated templates"
  ON session_invitations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND template_recruiting_allowed(template_id));

-- A session created while the gate is closed is a pilot, unless the
-- evaluator behind it is an org owner. The evaluator is the session's
-- user_id in both paths: the creator for direct sessions, the invitation
-- owner for join-link sessions, so this is checked on the row, not on
-- auth.uid(), and works for anonymous joins too.
CREATE OR REPLACE FUNCTION mark_pilot_session() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE t record;
BEGIN
  SELECT review_mode, review_status, org_id INTO t FROM templates WHERE id = NEW.template_id;
  IF t.review_mode = 'required' AND t.review_status <> 'approved'
     AND NOT EXISTS (
       SELECT 1 FROM organization_members m
        WHERE m.org_id = t.org_id AND m.user_id = NEW.user_id AND m.role = 'owner'
     ) THEN
    NEW.is_pilot := true;
  END IF;
  RETURN NEW;
END
$$;

CREATE TRIGGER trg_session_mark_pilot
  BEFORE INSERT ON test_sessions
  FOR EACH ROW EXECUTE FUNCTION mark_pilot_session();
