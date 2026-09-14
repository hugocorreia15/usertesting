-- ============================================================
-- 056 – Synthesis after testing: did participants hit what was predicted?
-- ============================================================
-- An inspection predicts problems; sessions observe them. Until now nothing
-- connected the two, so a team could not see which predicted problems their
-- participants actually ran into, or what testing turned up that nobody
-- predicted. That comparison is the lesson inspection exists to teach: what an
-- expert walkthrough is good at finding, and what it misses.
--
-- SHAPE
--   inspection_problems gains a test outcome: untested, confirmed, or
--   not_observed, with a note.
--
--   test_problems holds problems observed in testing that the inspection did
--   not predict.
--
--   problem_evidence links either kind of problem to the sessions where it was
--   seen, so a "confirmed" rests on a session someone can open.
--
-- "not_observed", NEVER "false alarm". A problem no participant hit in five
-- sessions may still be real; testing with a handful of people is not ground
-- truth, and a team that reads it as such learns the wrong lesson.
--
-- Evidence must be consistent: the session and the problem must belong to the
-- same study. That is checked in row-level security through a SECURITY DEFINER
-- helper, so a crafted request cannot attach one study's session to another's
-- problem.
--
-- Nothing existing is rewritten. The new column defaults to 'untested'.

-- ── 1. outcome of a predicted problem ───────────────────────

ALTER TABLE inspection_problems
  ADD COLUMN test_outcome text NOT NULL DEFAULT 'untested'
    CHECK (test_outcome IN ('untested', 'confirmed', 'not_observed')),
  ADD COLUMN outcome_note text;

COMMENT ON COLUMN inspection_problems.test_outcome IS
  'untested | confirmed | not_observed. Not observed is not a false alarm: a few sessions are not ground truth.';

-- ── 2. problems only testing found ──────────────────────────

CREATE TABLE test_problems (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id  uuid NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  title        text NOT NULL,
  severity     smallint CHECK (severity BETWEEN 0 AND 4),
  heuristic_id uuid REFERENCES heuristics(id) ON DELETE SET NULL,
  note         text,
  created_by   uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_test_problems_template ON test_problems(template_id);

COMMENT ON TABLE test_problems IS
  'Problems observed in usability testing that the inspection did not predict.';

-- ── 3. evidence: which sessions showed a problem ────────────

CREATE TABLE problem_evidence (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id           uuid NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  inspection_problem_id uuid REFERENCES inspection_problems(id) ON DELETE CASCADE,
  test_problem_id       uuid REFERENCES test_problems(id) ON DELETE CASCADE,
  session_id            uuid NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
  created_by            uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT evidence_names_one_problem CHECK (
    (inspection_problem_id IS NULL) <> (test_problem_id IS NULL)
  )
);

CREATE UNIQUE INDEX uq_evidence_inspection_problem
  ON problem_evidence(inspection_problem_id, session_id) WHERE inspection_problem_id IS NOT NULL;
CREATE UNIQUE INDEX uq_evidence_test_problem
  ON problem_evidence(test_problem_id, session_id) WHERE test_problem_id IS NOT NULL;
CREATE INDEX idx_problem_evidence_template ON problem_evidence(template_id);

-- The session and the problem must both belong to the evidence row's study.
CREATE OR REPLACE FUNCTION evidence_is_consistent(
  tid uuid, ip uuid, tp uuid, sid uuid
) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM test_sessions s WHERE s.id = sid AND s.template_id = tid)
     AND (
       (ip IS NOT NULL AND EXISTS (
          SELECT 1 FROM inspection_problems p
          JOIN inspections i ON i.id = p.inspection_id
          WHERE p.id = ip AND i.template_id = tid))
       OR
       (tp IS NOT NULL AND EXISTS (
          SELECT 1 FROM test_problems t WHERE t.id = tp AND t.template_id = tid))
     );
$$;

REVOKE ALL ON FUNCTION evidence_is_consistent(uuid, uuid, uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION evidence_is_consistent(uuid, uuid, uuid, uuid) TO authenticated;

-- ── 4. row-level security ───────────────────────────────────

ALTER TABLE test_problems    ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY test_problems_all ON test_problems
  FOR ALL TO authenticated
  USING (can_use_template(template_id))
  WITH CHECK (can_use_template(template_id));

CREATE POLICY problem_evidence_read ON problem_evidence
  FOR SELECT TO authenticated
  USING (can_use_template(template_id));

CREATE POLICY problem_evidence_insert ON problem_evidence
  FOR INSERT TO authenticated
  WITH CHECK (
    can_use_template(template_id)
    AND evidence_is_consistent(template_id, inspection_problem_id, test_problem_id, session_id)
  );

-- Evidence is added or removed, never rewritten to point somewhere else.
CREATE POLICY problem_evidence_delete ON problem_evidence
  FOR DELETE TO authenticated
  USING (can_use_template(template_id));
