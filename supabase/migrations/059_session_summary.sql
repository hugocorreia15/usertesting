-- ============================================================
-- 059 – Summarising a study across its sessions
-- ============================================================
-- A team runs eight sessions, writes notes in each, and then has to answer one
-- question: what did we actually learn. The notes are scattered across sessions
-- and tasks, the same problem is described in different words each time, and
-- the tired way out is to report the last session and call it a finding.
--
-- This is the same merge problem the inspection already solves, with the
-- evidence spread across sessions instead of across evaluators, so it is
-- proposed the same way: a model reads, a person decides, and accepting a
-- proposal writes an ordinary row marked assisted.
--
-- TWO TIERS, BECAUSE TWO KINDS OF TEXT LIVE IN A SESSION
--
-- Tier A is what the team wrote: observer notes, the moderation events, task
-- outcomes and the problems already entered during synthesis. That is student
-- work, exactly like an inspection finding, and it rides on the organization
-- opt-in that migration 058 established.
--
-- Tier B is what the participant wrote: task question answers and interview
-- answers. Those are someone else's words, given under a consent text that
-- very likely said nothing about a language model. So Tier B is off by
-- default, is enabled per study rather than per organization, and is refused
-- for any session whose participant consented before the wording changed.
--
-- THE EXCLUSION IS A TIMESTAMP, NOT A PROMISE
--
-- templates.ai_participant_text_from records when the study first turned Tier B
-- on. A session qualifies only if its own consent_accepted_at is at or after
-- that moment. A study that ran before anyone thought of this can therefore
-- never be included, no matter what is ticked afterwards, because its sessions
-- accepted a consent that did not mention it. Turning the setting off and on
-- again does not move the timestamp: participants who did consent under the
-- wording stay eligible, and those who did not stay excluded.

-- ── 1. the sentence a participant has to have seen ──────────

-- Kept in the database rather than the interface so the check below can be
-- made against it, and so changing the wording is a migration with a number
-- and not an afternoon edit in a text field.
CREATE OR REPLACE FUNCTION ai_consent_clause() RETURNS text
  LANGUAGE sql IMMUTABLE AS $$
  SELECT 'Your written answers may be read by an automated language model to help the research team group similar comments together. Your name and contact details are never sent.'::text;
$$;

GRANT EXECUTE ON FUNCTION ai_consent_clause() TO authenticated, anon;

-- ── 2. the per-study opt-in ─────────────────────────────────

ALTER TABLE templates
  ADD COLUMN ai_participant_text_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN ai_participant_text_from timestamptz;

COMMENT ON COLUMN templates.ai_participant_text_enabled IS
  'Off by default. When on, a cross-session summary may also read what participants wrote. Set only through set_participant_text_ai(), which requires the consent clause to be present.';
COMMENT ON COLUMN templates.ai_participant_text_from IS
  'When this study first turned participant text on. Sessions that consented before this instant are never eligible, which is what keeps studies run under the old wording out.';

ALTER TABLE test_problems
  ADD COLUMN assisted boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN test_problems.assisted IS
  'True when this problem came from accepting a model suggestion, so a report can tell assisted work from unassisted.';

-- ── 3. turning it on is guarded ─────────────────────────────

CREATE OR REPLACE FUNCTION set_participant_text_ai(tid uuid, enable boolean) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE t record;
BEGIN
  SELECT org_id, consent_text, ai_participant_text_from
    INTO t FROM templates WHERE id = tid;

  IF t.org_id IS NULL OR NOT is_org_owner(t.org_id) THEN
    RAISE EXCEPTION 'only an organization owner can decide this'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF enable THEN
    IF NOT EXISTS (SELECT 1 FROM organizations
                    WHERE id = t.org_id AND ai_suggestions_enabled) THEN
      RAISE EXCEPTION 'the organization has not enabled model suggestions at all';
    END IF;

    -- Consent is not a checkbox an owner ticks on a participant's behalf. The
    -- text the participant is shown has to carry the clause, or there is
    -- nothing to rely on later.
    IF t.consent_text IS NULL OR position(ai_consent_clause() in t.consent_text) = 0 THEN
      RAISE EXCEPTION 'the consent text this study shows does not contain the clause about automated processing';
    END IF;
  END IF;

  UPDATE templates
     SET ai_participant_text_enabled = enable,
         -- Set once, on the first enable, and never moved. Moving it forward
         -- would drop participants who did consent under the wording; moving it
         -- back would pull in participants who did not.
         ai_participant_text_from = COALESCE(t.ai_participant_text_from,
                                             CASE WHEN enable THEN clock_timestamp() END)
   WHERE id = tid;
END
$$;

REVOKE ALL ON FUNCTION set_participant_text_ai(uuid, boolean) FROM public;
GRANT EXECUTE ON FUNCTION set_participant_text_ai(uuid, boolean) TO authenticated;

-- ── 4. which sessions may contribute participant text ───────

-- The whole Tier B decision in one place, so the edge function, the interface
-- and the verification script all ask the same question.
CREATE OR REPLACE FUNCTION session_participant_text_allowed(sid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
      FROM test_sessions s
      JOIN templates t ON t.id = s.template_id
     WHERE s.id = sid
       AND t.ai_participant_text_enabled
       AND t.ai_participant_text_from IS NOT NULL
       AND s.consent_accepted_at IS NOT NULL
       AND s.consent_accepted_at >= t.ai_participant_text_from
       -- A pilot is excluded from every other template-level aggregate; a
       -- summary of what the study found is no different.
       AND NOT s.is_pilot
  );
$$;

REVOKE ALL ON FUNCTION session_participant_text_allowed(uuid) FROM public;
GRANT EXECUTE ON FUNCTION session_participant_text_allowed(uuid) TO authenticated;

-- Every session of a study whose participant text may be sent, in one call, so
-- the edge function does not ask the question once per session.
CREATE OR REPLACE FUNCTION sessions_with_participant_text_ai(tid uuid)
RETURNS TABLE (session_id uuid) LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT s.id
    FROM test_sessions s
    JOIN templates t ON t.id = s.template_id
   WHERE s.template_id = tid
     AND t.ai_participant_text_enabled
     AND t.ai_participant_text_from IS NOT NULL
     AND s.consent_accepted_at IS NOT NULL
     AND s.consent_accepted_at >= t.ai_participant_text_from
     AND NOT s.is_pilot;
$$;

REVOKE ALL ON FUNCTION sessions_with_participant_text_ai(uuid) FROM public;
GRANT EXECUTE ON FUNCTION sessions_with_participant_text_ai(uuid) TO authenticated;

-- Is this study allowed to ask for a summary at all? Tier A only needs the
-- organization, the same rule inspections follow.
CREATE OR REPLACE FUNCTION template_ai_enabled(tid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM templates t
      JOIN organizations o ON o.id = t.org_id
     WHERE t.id = tid AND o.ai_suggestions_enabled
  );
$$;

REVOKE ALL ON FUNCTION template_ai_enabled(uuid) FROM public;
GRANT EXECUTE ON FUNCTION template_ai_enabled(uuid) TO authenticated;

-- The anchoring rule, carried over from the inspection: a model may not hand a
-- team its problem list before the team has written any of it. One problem of
-- their own is the price of asking.
CREATE OR REPLACE FUNCTION template_synthesis_started(tid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM test_problems WHERE template_id = tid);
$$;

REVOKE ALL ON FUNCTION template_synthesis_started(uuid) FROM public;
GRANT EXECUTE ON FUNCTION template_synthesis_started(uuid) TO authenticated;

-- ── 5. a suggestion may now belong to a study ───────────────

ALTER TABLE ai_suggestions
  ALTER COLUMN inspection_id DROP NOT NULL,
  ADD COLUMN template_id uuid REFERENCES templates(id) ON DELETE CASCADE;

ALTER TABLE ai_suggestions
  DROP CONSTRAINT ai_suggestions_kind_check,
  ADD CONSTRAINT ai_suggestions_kind_check
    CHECK (kind IN ('merge', 'heuristic', 'session_summary')),
  ADD CONSTRAINT ai_suggestions_one_subject
    CHECK (num_nonnulls(inspection_id, template_id) = 1);

CREATE INDEX idx_ai_suggestions_template ON ai_suggestions(template_id, created_at);

-- The old policies asked can_use_inspection(inspection_id), which is false for
-- a row that has no inspection. Each one now branches on which subject the row
-- carries.
DROP POLICY ai_suggestions_read ON ai_suggestions;
DROP POLICY ai_suggestions_insert ON ai_suggestions;
DROP POLICY ai_suggestions_update ON ai_suggestions;

CREATE POLICY ai_suggestions_read ON ai_suggestions
  FOR SELECT TO authenticated
  USING (
    CASE WHEN inspection_id IS NOT NULL
         THEN can_use_inspection(inspection_id)
         ELSE can_use_template(template_id)
    END
  );

CREATE POLICY ai_suggestions_insert ON ai_suggestions
  FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND CASE WHEN inspection_id IS NOT NULL
             THEN can_use_inspection(inspection_id)
                  AND inspection_collection_closed(inspection_id)
                  AND inspection_ai_enabled(inspection_id)
             ELSE can_use_template(template_id)
                  AND template_ai_enabled(template_id)
                  AND template_synthesis_started(template_id)
        END
  );

CREATE POLICY ai_suggestions_update ON ai_suggestions
  FOR UPDATE TO authenticated
  USING (
    CASE WHEN inspection_id IS NOT NULL
         THEN can_use_inspection(inspection_id)
         ELSE can_use_template(template_id)
    END
  )
  WITH CHECK (
    CASE WHEN inspection_id IS NOT NULL
         THEN can_use_inspection(inspection_id)
         ELSE can_use_template(template_id)
    END
  );

-- The record stays a record: template_id joins the list of columns that may
-- not be rewritten after the fact.
CREATE OR REPLACE FUNCTION guard_ai_suggestion() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public AS $$
BEGIN
  IF NEW.payload IS DISTINCT FROM OLD.payload
     OR NEW.inspection_id IS DISTINCT FROM OLD.inspection_id
     OR NEW.template_id IS DISTINCT FROM OLD.template_id
     OR NEW.kind IS DISTINCT FROM OLD.kind
     OR NEW.model IS DISTINCT FROM OLD.model
     OR NEW.requested_by IS DISTINCT FROM OLD.requested_by THEN
    RAISE EXCEPTION 'a suggestion is a record of what was proposed; only its status may change';
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'open' THEN
    NEW.resolved_at := now();
  END IF;
  RETURN NEW;
END $$;
