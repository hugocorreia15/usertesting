-- ============================================================
-- 054 – Review history: every decision kept, with the protocol it judged
-- ============================================================
-- WHY THIS CANNOT WAIT
-- The instructor review (050) stores only the current state. Each decision
-- overwrites the last: a new note replaces the previous note, a new review date
-- replaces the previous date, and nothing records what the protocol looked like
-- when it was submitted. A "changes requested, fixed, approved" cycle leaves
-- behind only "approved". That history was assumed to be recoverable later. It
-- is not, and the classroom study's question of which mistakes persist across
-- iterations needs exactly the before-and-after record that is being lost.
--
-- HOW
-- One AFTER UPDATE trigger on templates appends an event whenever the review
-- mode or review status actually changes. A trigger rather than edits to the
-- review functions, for two reasons: it leaves the verified functions of 050
-- and 052 untouched, and it catches every path that changes review state,
-- including the automatic return to draft when a protocol is edited and the
-- organization defaults applied when a template is shared.
--
-- On submission the event carries a snapshot of the protocol as submitted:
-- tasks with their questions, groups, error types, interview questions,
-- instruments and consent text. Two consecutive submission snapshots are the
-- before and after of one revision.
--
-- The table is append-only. Row-level security grants reads to anyone who can
-- work with the template and grants no writes at all; only the trigger, running
-- as its owner, inserts.
--
-- EXISTING DATA
-- Nothing is updated or deleted. Templates already under review get one
-- backfilled event describing their current state, marked backfilled = true.
-- For a template currently submitted or approved the snapshot is accurate,
-- because any edit since would have returned it to draft. For one where
-- changes were requested the protocol may have been edited since, so no
-- snapshot is recorded rather than a misleading one.

CREATE TABLE template_review_events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Order of events. A timestamp cannot provide it: now() is fixed for a whole
  -- transaction, and one transaction can write two events (turning review off
  -- records the mode change and the return to draft together).
  seq               bigint GENERATED ALWAYS AS IDENTITY,
  template_id       uuid NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
  event             text NOT NULL CHECK (event IN (
                      'mode_changed', 'submitted', 'approved',
                      'changes_requested', 'invalidated', 'returned_to_draft')),
  review_mode       text NOT NULL,
  actor_id          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note              text,
  protocol_snapshot jsonb,
  backfilled        boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE INDEX idx_template_review_events_template
  ON template_review_events(template_id, seq);

COMMENT ON TABLE template_review_events IS
  'Append-only history of instructor review, written only by trigger. Submission events carry the protocol as submitted.';
COMMENT ON COLUMN template_review_events.backfilled IS
  'True for the single event created by migration 054 to describe a template''s state at that moment; earlier history was never recorded.';

-- ── the protocol as it stands ───────────────────────────────

CREATE OR REPLACE FUNCTION template_protocol_snapshot(tid uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT jsonb_build_object(
    'name', t.name,
    'instruments', to_jsonb(t.instruments),
    'consent_text', t.consent_text,
    'groups', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name, 'sort_order', g.sort_order)
                       ORDER BY g.sort_order)
        FROM task_groups g WHERE g.template_id = t.id), '[]'::jsonb),
    'tasks', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
               'id', k.id,
               'name', k.name,
               'description', k.description,
               'group_id', k.group_id,
               'sort_order', k.sort_order,
               'is_practice', k.is_practice,
               'optimal_time_seconds', k.optimal_time_seconds,
               'optimal_actions', k.optimal_actions,
               'questions', COALESCE((
                 SELECT jsonb_agg(jsonb_build_object(
                          'question_text', q.question_text,
                          'question_type', q.question_type,
                          'options', q.options) ORDER BY q.sort_order)
                   FROM task_questions q WHERE q.task_id = k.id), '[]'::jsonb))
             ORDER BY k.sort_order)
        FROM template_tasks k WHERE k.template_id = t.id), '[]'::jsonb),
    'error_types', COALESCE((
      SELECT jsonb_agg(jsonb_build_object('code', e.code, 'label', e.label) ORDER BY e.code)
        FROM template_error_types e WHERE e.template_id = t.id), '[]'::jsonb),
    'interview_questions', COALESCE((
      SELECT jsonb_agg(q.question_text ORDER BY q.sort_order)
        FROM template_questions q WHERE q.template_id = t.id), '[]'::jsonb)
  )
  FROM templates t WHERE t.id = tid;
$$;

REVOKE ALL ON FUNCTION template_protocol_snapshot(uuid) FROM public;

-- ── the trigger ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION log_template_review_event() RETURNS trigger
  LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public AS $$
BEGIN
  IF NEW.review_mode IS DISTINCT FROM OLD.review_mode THEN
    INSERT INTO template_review_events (template_id, event, review_mode, actor_id)
    VALUES (NEW.id, 'mode_changed', NEW.review_mode, auth.uid());
  END IF;

  IF NEW.review_status IS DISTINCT FROM OLD.review_status THEN
    IF NEW.review_status = 'submitted' THEN
      INSERT INTO template_review_events
        (template_id, event, review_mode, actor_id, protocol_snapshot)
      VALUES (NEW.id, 'submitted', NEW.review_mode, auth.uid(),
              template_protocol_snapshot(NEW.id));

    ELSIF NEW.review_status IN ('approved', 'changes_requested') THEN
      INSERT INTO template_review_events
        (template_id, event, review_mode, actor_id, note)
      VALUES (NEW.id, NEW.review_status, NEW.review_mode,
              COALESCE(NEW.reviewed_by, auth.uid()), NEW.review_note);

    ELSIF NEW.review_status = 'draft' THEN
      INSERT INTO template_review_events (template_id, event, review_mode, actor_id)
      VALUES (NEW.id,
              CASE WHEN NEW.approval_invalidated_at IS DISTINCT FROM OLD.approval_invalidated_at
                        AND NEW.approval_invalidated_at IS NOT NULL
                   THEN 'invalidated' ELSE 'returned_to_draft' END,
              NEW.review_mode, auth.uid());
    END IF;
  END IF;

  RETURN NULL;
END $$;

CREATE TRIGGER trg_log_template_review_event
  AFTER UPDATE OF review_mode, review_status ON templates
  FOR EACH ROW EXECUTE FUNCTION log_template_review_event();

-- ── row-level security: read only, never written by a user ──

ALTER TABLE template_review_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY template_review_events_read ON template_review_events
  FOR SELECT TO authenticated
  USING (can_use_template(template_id));

-- ── one event per template already under review ─────────────

INSERT INTO template_review_events
  (template_id, event, review_mode, actor_id, note, protocol_snapshot, backfilled, created_at)
SELECT t.id,
       CASE WHEN t.review_status = 'draft' THEN 'invalidated' ELSE t.review_status END,
       t.review_mode,
       CASE WHEN t.review_status IN ('approved', 'changes_requested') THEN t.reviewed_by END,
       CASE WHEN t.review_status IN ('approved', 'changes_requested') THEN t.review_note END,
       CASE WHEN t.review_status IN ('submitted', 'approved')
            THEN template_protocol_snapshot(t.id) END,
       true,
       COALESCE(
         CASE WHEN t.review_status = 'draft' THEN t.approval_invalidated_at END,
         t.reviewed_at, t.review_submitted_at, now())
  FROM templates t
 WHERE t.review_mode <> 'off'
   -- A draft that was never submitted has no decision to record.
   AND (t.review_status <> 'draft' OR t.approval_invalidated_at IS NOT NULL);
