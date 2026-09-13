-- ============================================================
-- 052 – Heuristic inspection: the stage before the usability test
-- ============================================================
-- Until now the platform began at stage two of the evaluation pipeline: it
-- assumed participants existed and a protocol was written. An HCI methods
-- course teaches inspection first, because it needs neither participants nor
-- ethical approval, and because it produces the ranked problem list that a
-- usability test is then designed to confirm.
--
-- THE SHAPE
-- Several evaluators inspect one subject (the team's own prototype, or a
-- comparable product) against a set of heuristics, each working ALONE. The
-- passes are then merged into one problem list, and the platform reports how
-- much any two evaluators actually overlapped.
--
-- WHY ISOLATION IS ENFORCED HERE AND NOT IN THE INTERFACE
-- The teaching payload is the evaluator effect: Hertzum and Jacobsen (2003)
-- found average agreement between any two evaluators ranging from 5% to 65%
-- across eleven studies, for experts as much as novices. They attribute it in
-- part to ANCHORING. If a student reads a teammate's findings before writing
-- their own, they anchor, the overlap is inflated, and the statistic measures
-- nothing. Isolation is therefore a correctness requirement for the metric,
-- not a classroom courtesy, which is why it lives in row-level security
-- alongside the review guard rather than in a component.
--
-- The rules, in full:
--   1. You always read your own findings.
--   2. You read another evaluator's findings only once BOTH of you have
--      submitted. Unlock is per evaluator; nobody waits for the slowest.
--   3. Submitting FREEZES your pass. Without this the rule is defeated by
--      submitting an empty pass, reading everyone else's, then filling yours
--      in. Frozen sets are also what make the agreement statistic mean
--      anything, since it is computed over what each evaluator found alone.
--      After consolidation opens, a frozen finding may still be attached to a
--      merged problem: that is the collaborative step, and it changes no
--      content.
--   4. An instructor who is not an evaluator sees progress, not content,
--      until every pass is in. An instructor who reads one pass early can
--      steer the rest, which is the independence hazard Schwind et al. warn
--      about.
--
-- Nothing here reads or writes any existing row. Two columns are added to
-- template_tasks and templates, both nullable with defaults.

-- ── 1. Heuristic sets ───────────────────────────────────────
-- A set is built in (org_id and user_id null), owned by an organization so a
-- course can teach its own, or personal.

CREATE TABLE heuristic_sets (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text,
  org_id      uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id)    ON DELETE CASCADE,
  is_builtin  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT heuristic_set_ownership CHECK (
    (is_builtin AND org_id IS NULL AND user_id IS NULL)
    OR (NOT is_builtin AND (org_id IS NOT NULL OR user_id IS NOT NULL))
  )
);

CREATE TABLE heuristics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id      uuid NOT NULL REFERENCES heuristic_sets(id) ON DELETE CASCADE,
  sort_order  int  NOT NULL DEFAULT 0,
  code        text,
  name        text NOT NULL,
  description text
);

CREATE INDEX idx_heuristics_set ON heuristics(set_id, sort_order);

COMMENT ON TABLE heuristic_sets IS
  'A named list of heuristics. Built-in sets are readable by everyone; an org can define its own so a course can teach a different list.';

-- ── 2. An inspection and its evaluators ─────────────────────

CREATE TABLE inspections (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id      uuid NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  heuristic_set_id uuid REFERENCES heuristic_sets(id) ON DELETE SET NULL,
  subject_kind     text NOT NULL DEFAULT 'own'
                     CHECK (subject_kind IN ('own', 'comparator')),
  subject_name     text NOT NULL,
  subject_url      text,
  status           text NOT NULL DEFAULT 'collecting'
                     CHECK (status IN ('collecting', 'consolidating', 'closed')),
  created_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  collection_closed_at timestamptz,
  closed_at        timestamptz
);

CREATE INDEX idx_inspections_template ON inspections(template_id);

COMMENT ON COLUMN inspections.subject_kind IS
  'own = the team''s own design; comparator = a similar product, which is what a cohort can inspect in week one before building anything.';
COMMENT ON COLUMN inspections.status IS
  'collecting (passes are isolated) | consolidating (all passes frozen, merging) | closed. Advances through submit_inspection_pass() and close_inspection_collection().';

CREATE TABLE inspection_evaluators (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submitted_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (inspection_id, user_id)
);

CREATE INDEX idx_inspection_evaluators_inspection
  ON inspection_evaluators(inspection_id);

COMMENT ON COLUMN inspection_evaluators.submitted_at IS
  'Set once, by submit_inspection_pass(). Freezes this pass and unlocks reading of other submitted passes.';

-- ── 3. The merged problem list, then the findings ───────────
-- Problems are created during consolidation; findings point at them.

CREATE TABLE inspection_problems (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id   uuid NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  title           text NOT NULL,
  notes           text,
  heuristic_id    uuid REFERENCES heuristics(id) ON DELETE SET NULL,
  agreed_severity smallint CHECK (agreed_severity BETWEEN 0 AND 4),
  sort_order      int NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inspection_problems_inspection ON inspection_problems(inspection_id);

CREATE TABLE inspection_findings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL REFERENCES inspections(id) ON DELETE CASCADE,
  evaluator_id  uuid NOT NULL REFERENCES inspection_evaluators(id) ON DELETE CASCADE,
  heuristic_id  uuid REFERENCES heuristics(id) ON DELETE SET NULL,
  location      text,
  description   text NOT NULL,
  severity      smallint CHECK (severity BETWEEN 0 AND 4),
  evidence_path text,
  problem_id    uuid REFERENCES inspection_problems(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_inspection_findings_inspection ON inspection_findings(inspection_id);
CREATE INDEX idx_inspection_findings_evaluator  ON inspection_findings(evaluator_id);

COMMENT ON COLUMN inspection_findings.severity IS
  'Nielsen''s 0..4 scale. 3 and 4 are major and catastrophic: disagreement across that line is disagreement about whether to act at all.';
COMMENT ON COLUMN inspection_findings.problem_id IS
  'Set during consolidation. The only column that may change after a pass is frozen.';
COMMENT ON COLUMN inspection_findings.evidence_path IS
  'Reserved for evidence images. Uploads are not wired yet: a storage policy would have to re-implement the isolation predicate above, and getting it wrong would leak evidence past that boundary.';

-- ── 4. Traceability: a task derived from a problem ──────────

ALTER TABLE template_tasks
  ADD COLUMN from_problem_id uuid REFERENCES inspection_problems(id) ON DELETE SET NULL;

COMMENT ON COLUMN template_tasks.from_problem_id IS
  'The inspection problem this task was written to confirm. Lets a report say why each task exists.';

-- ── 5. Gate integration: inspection before review ───────────

ALTER TABLE templates
  ADD COLUMN require_inspection boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN templates.require_inspection IS
  'Opt-in, like review_mode. When true, request_template_review() refuses until a consolidated inspection exists.';

-- ── 6. Access helpers ───────────────────────────────────────

-- Can the current user work with this template at all?
CREATE OR REPLACE FUNCTION can_use_template(tid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM templates t
                 WHERE t.id = tid AND t.user_id = auth.uid())
      OR can_access_org_template(tid);
$$;

CREATE OR REPLACE FUNCTION can_use_inspection(iid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM inspections i
                 WHERE i.id = iid AND can_use_template(i.template_id));
$$;

-- Has the current user submitted their own pass on this inspection?
CREATE OR REPLACE FUNCTION has_submitted_pass(iid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM inspection_evaluators e
                 WHERE e.inspection_id = iid
                   AND e.user_id = auth.uid()
                   AND e.submitted_at IS NOT NULL);
$$;

-- Is collection over, so that anchoring is no longer possible?
CREATE OR REPLACE FUNCTION inspection_collection_closed(iid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM inspections i
                 WHERE i.id = iid AND i.status IN ('consolidating', 'closed'));
$$;

REVOKE ALL ON FUNCTION can_use_template(uuid)              FROM public;
REVOKE ALL ON FUNCTION can_use_inspection(uuid)            FROM public;
REVOKE ALL ON FUNCTION has_submitted_pass(uuid)            FROM public;
REVOKE ALL ON FUNCTION inspection_collection_closed(uuid)  FROM public;
GRANT EXECUTE ON FUNCTION can_use_template(uuid)             TO authenticated;
GRANT EXECUTE ON FUNCTION can_use_inspection(uuid)           TO authenticated;
GRANT EXECUTE ON FUNCTION has_submitted_pass(uuid)           TO authenticated;
GRANT EXECUTE ON FUNCTION inspection_collection_closed(uuid) TO authenticated;

-- ── 7. The freeze guard ─────────────────────────────────────
-- After a pass is submitted, only problem_id may change. Consolidation needs
-- to attach findings to merged problems; nothing may rewrite what was found.

CREATE OR REPLACE FUNCTION guard_frozen_finding() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public AS $$
DECLARE
  frozen boolean;
BEGIN
  SELECT e.submitted_at IS NOT NULL INTO frozen
    FROM inspection_evaluators e
   WHERE e.id = COALESCE(NEW.evaluator_id, OLD.evaluator_id);

  IF NOT COALESCE(frozen, false) THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF NEW.description  IS DISTINCT FROM OLD.description
     OR NEW.severity     IS DISTINCT FROM OLD.severity
     OR NEW.heuristic_id IS DISTINCT FROM OLD.heuristic_id
     OR NEW.location     IS DISTINCT FROM OLD.location
     OR NEW.evaluator_id IS DISTINCT FROM OLD.evaluator_id
     OR NEW.evidence_path IS DISTINCT FROM OLD.evidence_path THEN
    RAISE EXCEPTION 'This pass was submitted and is frozen; only consolidation may change it.';
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER trg_guard_frozen_finding
  BEFORE UPDATE ON inspection_findings
  FOR EACH ROW EXECUTE FUNCTION guard_frozen_finding();

-- A frozen pass also refuses new findings.
CREATE OR REPLACE FUNCTION guard_frozen_insert() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM inspection_evaluators e
             WHERE e.id = NEW.evaluator_id AND e.submitted_at IS NOT NULL) THEN
    RAISE EXCEPTION 'This pass was submitted and is frozen; no findings may be added.';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_guard_frozen_insert
  BEFORE INSERT ON inspection_findings
  FOR EACH ROW EXECUTE FUNCTION guard_frozen_insert();

-- submitted_at is set only by the function below, never by a direct write.
CREATE OR REPLACE FUNCTION guard_submitted_at() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public AS $$
BEGIN
  IF NEW.submitted_at IS DISTINCT FROM OLD.submitted_at
     AND COALESCE(current_setting('avalux.inspection_rpc', true), 'off') <> 'on' THEN
    RAISE EXCEPTION 'submitted_at changes only through submit_inspection_pass().';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_guard_submitted_at
  BEFORE UPDATE ON inspection_evaluators
  FOR EACH ROW EXECUTE FUNCTION guard_submitted_at();

-- Status advances only through the functions below, and never backwards:
-- reopening collection would hide findings that teammates have already read.
CREATE OR REPLACE FUNCTION guard_inspection_status() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public AS $$
DECLARE
  rank_old int;
  rank_new int;
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;

  IF COALESCE(current_setting('avalux.inspection_rpc', true), 'off') <> 'on' THEN
    RAISE EXCEPTION 'inspection status changes only through submit_inspection_pass(), close_inspection_collection() or close_inspection()';
  END IF;

  rank_old := CASE OLD.status WHEN 'collecting' THEN 0 WHEN 'consolidating' THEN 1 ELSE 2 END;
  rank_new := CASE NEW.status WHEN 'collecting' THEN 0 WHEN 'consolidating' THEN 1 ELSE 2 END;
  IF rank_new < rank_old THEN
    RAISE EXCEPTION 'an inspection cannot go back to %', NEW.status;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_guard_inspection_status
  BEFORE UPDATE ON inspections
  FOR EACH ROW EXECUTE FUNCTION guard_inspection_status();

-- ── 8. Submitting a pass ────────────────────────────────────

CREATE OR REPLACE FUNCTION submit_inspection_pass(iid uuid) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public AS $$
DECLARE
  v_eval uuid;
  v_open int;
BEGIN
  IF NOT can_use_inspection(iid) THEN
    RAISE EXCEPTION 'Not your inspection.';
  END IF;

  SELECT id INTO v_eval FROM inspection_evaluators
   WHERE inspection_id = iid AND user_id = auth.uid();
  IF v_eval IS NULL THEN
    RAISE EXCEPTION 'You are not an evaluator on this inspection.';
  END IF;

  PERFORM set_config('avalux.inspection_rpc', 'on', true);
  UPDATE inspection_evaluators
     SET submitted_at = now()
   WHERE id = v_eval AND submitted_at IS NULL;
  PERFORM set_config('avalux.inspection_rpc', 'off', true);

  -- When the last pass lands, collection is over and everything opens.
  SELECT count(*) INTO v_open FROM inspection_evaluators
   WHERE inspection_id = iid AND submitted_at IS NULL;

  IF v_open = 0 THEN
    PERFORM set_config('avalux.inspection_rpc', 'on', true);
    UPDATE inspections
       SET status = 'consolidating', collection_closed_at = now()
     WHERE id = iid AND status = 'collecting';
    PERFORM set_config('avalux.inspection_rpc', 'off', true);
  END IF;
END $$;

-- An inspection can stall on one evaluator who never submits. The template's
-- owner, or an org owner, may end collection: remaining passes are frozen as
-- they stand rather than discarded, so the statistic still describes
-- independent work.
CREATE OR REPLACE FUNCTION close_inspection_collection(iid uuid) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public AS $$
DECLARE v_tid uuid;
BEGIN
  SELECT template_id INTO v_tid FROM inspections WHERE id = iid;
  IF v_tid IS NULL THEN RAISE EXCEPTION 'inspection not found'; END IF;
  -- Freezing someone else's unfinished pass is an owner's call, not a
  -- teammate's: it decides what their independent set will be forever.
  IF NOT (EXISTS (SELECT 1 FROM templates t
                  WHERE t.id = v_tid AND t.user_id = auth.uid())
          OR template_in_owned_org(v_tid)) THEN
    RAISE EXCEPTION 'only the template owner or an organization owner can end collection'
      USING ERRCODE = 'insufficient_privilege';
  END IF;

  PERFORM set_config('avalux.inspection_rpc', 'on', true);
  UPDATE inspection_evaluators
     SET submitted_at = now()
   WHERE inspection_id = iid AND submitted_at IS NULL;
  PERFORM set_config('avalux.inspection_rpc', 'off', true);

  PERFORM set_config('avalux.inspection_rpc', 'on', true);
  UPDATE inspections
     SET status = 'consolidating', collection_closed_at = now()
   WHERE id = iid AND status = 'collecting';
  PERFORM set_config('avalux.inspection_rpc', 'off', true);
END $$;

CREATE OR REPLACE FUNCTION close_inspection(iid uuid) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public AS $$
BEGIN
  IF NOT can_use_inspection(iid) THEN
    RAISE EXCEPTION 'Not your inspection.';
  END IF;
  PERFORM set_config('avalux.inspection_rpc', 'on', true);
  UPDATE inspections SET status = 'closed', closed_at = now()
   WHERE id = iid AND status = 'consolidating';
  PERFORM set_config('avalux.inspection_rpc', 'off', true);
END $$;

GRANT EXECUTE ON FUNCTION submit_inspection_pass(uuid)      TO authenticated;
GRANT EXECUTE ON FUNCTION close_inspection_collection(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION close_inspection(uuid)            TO authenticated;

-- Does this template have a consolidated inspection behind it?
CREATE OR REPLACE FUNCTION template_has_inspection(tid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM inspections i
    WHERE i.template_id = tid
      AND i.status IN ('consolidating', 'closed')
      AND EXISTS (SELECT 1 FROM inspection_problems p WHERE p.inspection_id = i.id)
  );
$$;
GRANT EXECUTE ON FUNCTION template_has_inspection(uuid) TO authenticated;

-- ── 9. The gate asks for it, when the org opted in ──────────

CREATE OR REPLACE FUNCTION request_template_review(tid uuid) RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public
AS $$
DECLARE t record;
BEGIN
  SELECT user_id, org_id, review_mode, review_status, require_inspection
    INTO t FROM templates WHERE id = tid;
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
  -- The only addition in 052. Everything above is unchanged from 050.
  IF COALESCE(t.require_inspection, false) AND NOT template_has_inspection(tid) THEN
    RAISE EXCEPTION 'this template requires a consolidated heuristic inspection before review';
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

GRANT EXECUTE ON FUNCTION request_template_review(uuid) TO authenticated;

-- ── 10. Row-level security ──────────────────────────────────

ALTER TABLE heuristic_sets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE heuristics             ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections            ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_evaluators  ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_problems    ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_findings    ENABLE ROW LEVEL SECURITY;

-- Heuristic sets: built-ins are public to signed-in users; own and org sets
-- are readable and writable by their owners.
CREATE POLICY heuristic_sets_read ON heuristic_sets FOR SELECT TO authenticated
  USING (is_builtin
         OR user_id = auth.uid()
         OR (org_id IS NOT NULL AND is_org_member(org_id)));

CREATE POLICY heuristic_sets_write ON heuristic_sets FOR ALL TO authenticated
  USING (NOT is_builtin
         AND (user_id = auth.uid() OR (org_id IS NOT NULL AND is_org_owner(org_id))))
  WITH CHECK (NOT is_builtin
         AND (user_id = auth.uid() OR (org_id IS NOT NULL AND is_org_owner(org_id))));

CREATE POLICY heuristics_read ON heuristics FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM heuristic_sets s WHERE s.id = heuristics.set_id
                 AND (s.is_builtin OR s.user_id = auth.uid()
                      OR (s.org_id IS NOT NULL AND is_org_member(s.org_id)))));

CREATE POLICY heuristics_write ON heuristics FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM heuristic_sets s WHERE s.id = heuristics.set_id
                 AND NOT s.is_builtin
                 AND (s.user_id = auth.uid()
                      OR (s.org_id IS NOT NULL AND is_org_owner(s.org_id)))))
  WITH CHECK (EXISTS (SELECT 1 FROM heuristic_sets s WHERE s.id = heuristics.set_id
                 AND NOT s.is_builtin
                 AND (s.user_id = auth.uid()
                      OR (s.org_id IS NOT NULL AND is_org_owner(s.org_id)))));

-- Inspections and the evaluator roster: visible to anyone who can work with
-- the template. Progress is not content, and the class view needs it.
CREATE POLICY inspections_all ON inspections FOR ALL TO authenticated
  USING (can_use_template(template_id))
  WITH CHECK (can_use_template(template_id));

CREATE POLICY inspection_evaluators_read ON inspection_evaluators
  FOR SELECT TO authenticated
  USING (can_use_inspection(inspection_id));

-- Joining after collection has closed would create an unfrozen pass beside
-- frozen ones, and findings added then would enter the statistic as though
-- they had been produced independently.
CREATE POLICY inspection_evaluators_insert ON inspection_evaluators
  FOR INSERT TO authenticated
  WITH CHECK (can_use_inspection(inspection_id)
              AND NOT inspection_collection_closed(inspection_id));

CREATE POLICY inspection_evaluators_update ON inspection_evaluators
  FOR UPDATE TO authenticated
  USING (can_use_inspection(inspection_id))
  WITH CHECK (can_use_inspection(inspection_id));

-- Removing a submitted evaluator would erase a frozen independent pass and
-- silently change the agreement statistic. Refused here rather than in a
-- trigger, so that deleting the whole inspection still cascades cleanly.
CREATE POLICY inspection_evaluators_delete ON inspection_evaluators
  FOR DELETE TO authenticated
  USING (can_use_inspection(inspection_id) AND submitted_at IS NULL);

-- Findings: the isolation rule.
CREATE POLICY inspection_findings_read ON inspection_findings
  FOR SELECT TO authenticated
  USING (
    -- 1. your own, always
    EXISTS (SELECT 1 FROM inspection_evaluators e
            WHERE e.id = inspection_findings.evaluator_id
              AND e.user_id = auth.uid())
    -- 2. a teammate's, once you have both submitted
    OR (
      has_submitted_pass(inspection_id)
      AND EXISTS (SELECT 1 FROM inspection_evaluators e
                  WHERE e.id = inspection_findings.evaluator_id
                    AND e.submitted_at IS NOT NULL)
    )
    -- 3. anyone with template access, once collection is over
    OR (inspection_collection_closed(inspection_id)
        AND can_use_inspection(inspection_id))
  );

CREATE POLICY inspection_findings_insert ON inspection_findings
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM inspection_evaluators e
                      WHERE e.id = inspection_findings.evaluator_id
                        AND e.user_id = auth.uid()));

-- Update covers two cases: editing your own unfrozen pass, and attaching a
-- frozen finding to a merged problem during consolidation. The freeze trigger
-- decides which columns each may touch.
CREATE POLICY inspection_findings_update ON inspection_findings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM inspection_evaluators e
            WHERE e.id = inspection_findings.evaluator_id
              AND e.user_id = auth.uid())
    OR (inspection_collection_closed(inspection_id)
        AND can_use_inspection(inspection_id))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM inspection_evaluators e
            WHERE e.id = inspection_findings.evaluator_id
              AND e.user_id = auth.uid())
    OR (inspection_collection_closed(inspection_id)
        AND can_use_inspection(inspection_id))
  );

CREATE POLICY inspection_findings_delete ON inspection_findings
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM inspection_evaluators e
                 WHERE e.id = inspection_findings.evaluator_id
                   AND e.user_id = auth.uid()
                   AND e.submitted_at IS NULL));

-- Merged problems exist only from consolidation onward.
CREATE POLICY inspection_problems_read ON inspection_problems
  FOR SELECT TO authenticated
  USING (can_use_inspection(inspection_id));

CREATE POLICY inspection_problems_write ON inspection_problems
  FOR ALL TO authenticated
  USING (can_use_inspection(inspection_id)
         AND inspection_collection_closed(inspection_id))
  WITH CHECK (can_use_inspection(inspection_id)
         AND inspection_collection_closed(inspection_id));

-- ── 11. Nielsen's ten, as the built-in set ──────────────────

INSERT INTO heuristic_sets (id, name, description, is_builtin)
VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  'Nielsen''s 10 usability heuristics',
  'Jakob Nielsen, 1994. The default set; an organization can define its own.',
  true
) ON CONFLICT (id) DO NOTHING;

INSERT INTO heuristics (set_id, sort_order, code, name, description) VALUES
 ('11111111-1111-1111-1111-111111111111'::uuid, 1, 'H1', 'Visibility of system status',
  'The design should always keep users informed about what is going on, through appropriate feedback within a reasonable amount of time.'),
 ('11111111-1111-1111-1111-111111111111'::uuid, 2, 'H2', 'Match between the system and the real world',
  'The design should speak the users'' language, with words, phrases and concepts familiar to them, rather than internal jargon.'),
 ('11111111-1111-1111-1111-111111111111'::uuid, 3, 'H3', 'User control and freedom',
  'Users often perform actions by mistake. They need a clearly marked emergency exit to leave the unwanted action.'),
 ('11111111-1111-1111-1111-111111111111'::uuid, 4, 'H4', 'Consistency and standards',
  'Users should not have to wonder whether different words, situations, or actions mean the same thing.'),
 ('11111111-1111-1111-1111-111111111111'::uuid, 5, 'H5', 'Error prevention',
  'Good error messages are important, but the best designs carefully prevent problems from occurring in the first place.'),
 ('11111111-1111-1111-1111-111111111111'::uuid, 6, 'H6', 'Recognition rather than recall',
  'Minimise the user''s memory load by making elements, actions, and options visible.'),
 ('11111111-1111-1111-1111-111111111111'::uuid, 7, 'H7', 'Flexibility and efficiency of use',
  'Shortcuts may speed up the interaction for the expert user without hindering the novice.'),
 ('11111111-1111-1111-1111-111111111111'::uuid, 8, 'H8', 'Aesthetic and minimalist design',
  'Interfaces should not contain information which is irrelevant or rarely needed.'),
 ('11111111-1111-1111-1111-111111111111'::uuid, 9, 'H9', 'Help users recognise, diagnose, and recover from errors',
  'Error messages should be expressed in plain language, precisely indicate the problem, and constructively suggest a solution.'),
 ('11111111-1111-1111-1111-111111111111'::uuid, 10, 'H10', 'Help and documentation',
  'It is best if the system needs no additional explanation, but documentation may be necessary.');
