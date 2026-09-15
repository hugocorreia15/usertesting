-- ============================================================
-- 058 – Model suggestions during consolidation, never applied by themselves
-- ============================================================
-- Merging a dozen evaluators' findings into one problem list is the slowest
-- manual step in an inspection, and deciding which heuristic a problem violates
-- is the one students hesitate over most. A model can propose both. It must not
-- decide either.
--
-- FOUR RULES, ENFORCED HERE RATHER THAN IN THE INTERFACE
--
-- 1. Nothing is applied automatically. A suggestion is a row a team reads and
--    then accepts or dismisses. Accepting creates the same rows a person would
--    have created by hand, marked `assisted` so that a report, an export, and
--    the classroom study can tell assisted work from unassisted.
--
-- 2. It cannot run before the team has done its own work. A suggestion needs
--    every evaluator's findings, and row-level security releases those only
--    once every pass is submitted. The existing anchoring rule therefore gates
--    this feature too: no student can read a model's problem list before
--    writing their own findings.
--
-- 3. An organization opts in. Even though only student-written text is sent,
--    text still leaves the system, so the default is off and only an owner can
--    change it.
--
-- 4. Suggestions are visible to the whole team, not only their requester, so a
--    team can see what was proposed and what was done with it.
--
-- The edge function that produces them runs with the caller's own token, so it
-- can read exactly what the caller can read and nothing else. There is no
-- service-role path to findings anywhere in this feature.

-- ── 1. the organization opts in ─────────────────────────────

ALTER TABLE organizations
  ADD COLUMN ai_suggestions_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN organizations.ai_suggestions_enabled IS
  'Off by default. When on, an inspection being consolidated may ask a model to propose merges and heuristics. Only student-written findings are sent.';

-- ── 2. provenance on what a suggestion produced ─────────────

ALTER TABLE inspection_problems
  ADD COLUMN assisted boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN inspection_problems.assisted IS
  'True when this problem was created by accepting a model suggestion. Kept so assisted work can be told from unassisted in reports and in the classroom study.';

-- ── 3. the suggestions themselves ───────────────────────────

CREATE TABLE ai_suggestions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  kind          text NOT NULL CHECK (kind IN ('merge', 'heuristic')),
  -- The proposal as the client validated it: clusters of finding ids, a title,
  -- and an optional heuristic. Stored so a team sees what was proposed even
  -- after acting on it, and so the study can count what was accepted.
  payload       jsonb NOT NULL,
  model         text,
  status        text NOT NULL DEFAULT 'open'
                  CHECK (status IN ('open', 'accepted', 'dismissed')),
  requested_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  resolved_at   timestamptz
);

CREATE INDEX idx_ai_suggestions_inspection ON ai_suggestions(inspection_id, created_at);

COMMENT ON TABLE ai_suggestions IS
  'Model proposals for merging findings or naming a heuristic. Never applied on their own; accepting one creates ordinary rows marked assisted.';

ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

-- Is the organization behind this inspection opted in? A personal template has
-- no organization and therefore no way to opt in, which is deliberate: the
-- setting belongs to whoever is accountable for the data.
CREATE OR REPLACE FUNCTION inspection_ai_enabled(iid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1
      FROM inspections i
      JOIN templates t ON t.id = i.template_id
      JOIN organizations o ON o.id = t.org_id
     WHERE i.id = iid AND o.ai_suggestions_enabled
  );
$$;

REVOKE ALL ON FUNCTION inspection_ai_enabled(uuid) FROM public;
GRANT EXECUTE ON FUNCTION inspection_ai_enabled(uuid) TO authenticated;


-- The whole team reads them; only during consolidation, which is also the only
-- time anyone can read the findings they are made from.
CREATE POLICY ai_suggestions_read ON ai_suggestions
  FOR SELECT TO authenticated
  USING (can_use_inspection(inspection_id));

CREATE POLICY ai_suggestions_insert ON ai_suggestions
  FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND can_use_inspection(inspection_id)
    AND inspection_collection_closed(inspection_id)
    AND inspection_ai_enabled(inspection_id)
  );

-- Only the status changes after the fact: accepted or dismissed.
CREATE POLICY ai_suggestions_update ON ai_suggestions
  FOR UPDATE TO authenticated
  USING (can_use_inspection(inspection_id))
  WITH CHECK (can_use_inspection(inspection_id));

-- ── 4. a suggestion is a record, not a draft ────────────────

-- The payload's content must not change once written: a team should see the
-- proposal as it was made, not a tidied version.
CREATE OR REPLACE FUNCTION guard_ai_suggestion() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public AS $$
BEGIN
  IF NEW.payload IS DISTINCT FROM OLD.payload
     OR NEW.inspection_id IS DISTINCT FROM OLD.inspection_id
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

CREATE TRIGGER trg_guard_ai_suggestion
  BEFORE UPDATE ON ai_suggestions
  FOR EACH ROW EXECUTE FUNCTION guard_ai_suggestion();
