-- ============================================================
-- 048 – Anon access becomes possession-based, not existence-based
-- ============================================================
-- ROOT CAUSE
-- Every anon policy in the participant flow tested whether a row was
-- the *kind* of row a participant may see, never whether this caller
-- holds the secret for it:
--
--   023  participants     TO anon  USING (user_id IS NOT NULL)
--   021  test_sessions    TO anon  USING (join_code IS NOT NULL)
--   007  templates        (no TO -> PUBLIC) USING (EXISTS active invitation)
--   007  session_invit.   (no TO -> PUBLIC) USING (is_active = true)
--
-- Those predicates are true for every row, so for the anon role they
-- are equivalent to RLS being switched off. Verified against the live
-- project with only the public anon key: participant names, e-mails,
-- free-text answers, session results, study designs and live join
-- codes were all readable without authenticating.
--
-- A policy with no TO clause defaults to PUBLIC, which includes
-- `authenticated`, and policies are OR-ed, so one loose policy defeats
-- every strict one. Migration 035 fixed one instance of this on the
-- invitation UPDATE; the SELECTs were missed.
--
-- FIX
-- The participant client always knows a secret: the invitation code
-- while joining, the session join code afterwards. It now sends that
-- secret as a request header, and every anon policy checks the row
-- against it. Existence checks become possession checks.
--
-- NO DATA IS READ, WRITTEN OR DELETED BY THIS MIGRATION.
-- It contains only CREATE FUNCTION, DROP POLICY and CREATE POLICY.
--
-- APPLY ORDER: deploy the client that sends the headers FIRST, then
-- run this file. See docs/security/048-rollout.md.

-- ── 1. The secrets carried by the current request ──
-- PostgREST exposes request headers as a JSON GUC. Missing setting ->
-- NULL -> every comparison below is NULL -> false. Fail closed.

CREATE OR REPLACE FUNCTION current_join_code() RETURNS text
  LANGUAGE sql STABLE
  SET search_path = public
AS $$
  SELECT nullif(
    current_setting('request.headers', true)::json ->> 'x-join-code',
    ''
  );
$$;

CREATE OR REPLACE FUNCTION current_invite_code() RETURNS text
  LANGUAGE sql STABLE
  SET search_path = public
AS $$
  SELECT nullif(
    current_setting('request.headers', true)::json ->> 'x-invite-code',
    ''
  );
$$;

-- ── 2. Possession predicates ──
-- SECURITY DEFINER so the lookups inside do not re-enter RLS on the
-- tables being protected (the recursion lesson from migration 043).

-- The session whose join code this request carries.
CREATE OR REPLACE FUNCTION anon_session_id() RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT ts.id
    FROM test_sessions ts
   WHERE current_join_code() IS NOT NULL
     AND ts.join_code = current_join_code()
   LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION anon_can_read_session(p_session_id uuid)
  RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT p_session_id IS NOT NULL AND p_session_id = anon_session_id();
$$;

-- A template is reachable either through the invitation code being
-- redeemed right now, or through the session the participant is in.
CREATE OR REPLACE FUNCTION anon_can_read_template(p_template_id uuid)
  RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
           SELECT 1 FROM session_invitations si
            WHERE current_invite_code() IS NOT NULL
              AND si.code = current_invite_code()
              AND si.is_active = true
              AND si.template_id = p_template_id
         )
      OR EXISTS (
           SELECT 1 FROM test_sessions ts
            WHERE current_join_code() IS NOT NULL
              AND ts.join_code = current_join_code()
              AND ts.template_id = p_template_id
         );
$$;

-- The evaluator account that owns the invitation being redeemed.
-- Used by the join-flow INSERT checks.
CREATE OR REPLACE FUNCTION anon_invite_owner() RETURNS uuid
  LANGUAGE sql STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT si.user_id
    FROM session_invitations si
   WHERE current_invite_code() IS NOT NULL
     AND si.code = current_invite_code()
     AND si.is_active = true
   LIMIT 1;
$$;

REVOKE ALL ON FUNCTION current_join_code()               FROM public;
REVOKE ALL ON FUNCTION current_invite_code()             FROM public;
REVOKE ALL ON FUNCTION anon_session_id()                 FROM public;
REVOKE ALL ON FUNCTION anon_can_read_session(uuid)       FROM public;
REVOKE ALL ON FUNCTION anon_can_read_template(uuid)      FROM public;
REVOKE ALL ON FUNCTION anon_invite_owner()               FROM public;
GRANT EXECUTE ON FUNCTION current_join_code()            TO anon, authenticated;
GRANT EXECUTE ON FUNCTION current_invite_code()          TO anon, authenticated;
GRANT EXECUTE ON FUNCTION anon_session_id()              TO anon, authenticated;
GRANT EXECUTE ON FUNCTION anon_can_read_session(uuid)    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION anon_can_read_template(uuid)   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION anon_invite_owner()            TO anon, authenticated;

-- ============================================================
-- 3. Replace every existence-predicate policy with a possession one
-- ============================================================
-- Each block drops EVERY historical name for that grant (several
-- tables accumulated two live copies, e.g. 015 and 021 both left an
-- anon read on test_sessions), then creates one scoped replacement.
--
-- Template reads are granted to anon AND authenticated: a logged-in
-- person opening a join link is still a participant. The predicate,
-- not the role, is what protects the row now.

-- ── session_invitations ──────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read active invitations" ON session_invitations;

CREATE POLICY "Read the invitation whose code was supplied"
  ON session_invitations FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND code = current_invite_code());

-- ── templates and their definition children ─────────────────
DROP POLICY IF EXISTS "Anon can read templates via invitation" ON templates;

CREATE POLICY "Participants read the template they were invited to"
  ON templates FOR SELECT
  TO anon, authenticated
  USING (anon_can_read_template(id));

DROP POLICY IF EXISTS "Anon can read template tasks via invitation" ON template_tasks;

CREATE POLICY "Participants read tasks of their template"
  ON template_tasks FOR SELECT
  TO anon, authenticated
  USING (anon_can_read_template(template_id));

DROP POLICY IF EXISTS "Anon can read task groups via invitation" ON task_groups;

CREATE POLICY "Participants read task groups of their template"
  ON task_groups FOR SELECT
  TO anon, authenticated
  USING (anon_can_read_template(template_id));

DROP POLICY IF EXISTS "Anon can read task questions via invitation" ON task_questions;

CREATE POLICY "Participants read task questions of their template"
  ON task_questions FOR SELECT
  TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM template_tasks tt
     WHERE tt.id = task_questions.task_id
       AND anon_can_read_template(tt.template_id)
  ));

DROP POLICY IF EXISTS "Anon can read template questions via join code" ON template_questions;

CREATE POLICY "Participants read interview questions of their template"
  ON template_questions FOR SELECT
  TO anon, authenticated
  USING (anon_can_read_template(template_id));

DROP POLICY IF EXISTS "Anon can read participant field definitions" ON template_participant_fields;

CREATE POLICY "Participants read the custom fields they must fill"
  ON template_participant_fields FOR SELECT
  TO anon, authenticated
  USING (anon_can_read_template(template_id));

-- ── participants ────────────────────────────────────────────
-- 023 existed only so `.insert().select().single()` could read the row
-- back. The client now generates the id, so no anon read is needed at
-- all. This is the policy that exposed names, e-mails and notes.
DROP POLICY IF EXISTS "Anon can read participants for join flow" ON participants;
DROP POLICY IF EXISTS "Anon can read participants via invitation" ON participants;

DROP POLICY IF EXISTS "Anon can insert participants for join flow" ON participants;
DROP POLICY IF EXISTS "Anon can insert participants via invitation" ON participants;

CREATE POLICY "Join flow creates a participant for the invited study"
  ON participants FOR INSERT
  TO anon, authenticated
  WITH CHECK (user_id IS NOT NULL AND user_id = anon_invite_owner());

-- ── participant_field_values ────────────────────────────────
DROP POLICY IF EXISTS "Anon can read participant field values for join flow"
  ON participant_field_values;

CREATE POLICY "Participants read their own field values"
  ON participant_field_values FOR SELECT
  TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM test_sessions ts
     WHERE ts.id = anon_session_id()
       AND ts.participant_id = participant_field_values.participant_id
  ));

DROP POLICY IF EXISTS "Anon can insert participant field values for join flow"
  ON participant_field_values;

CREATE POLICY "Join flow records the custom field answers"
  ON participant_field_values FOR INSERT
  TO anon, authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM participants p
     WHERE p.id = participant_field_values.participant_id
       AND p.user_id = anon_invite_owner()
  ));

-- ── test_sessions ───────────────────────────────────────────
DROP POLICY IF EXISTS "Anon can read sessions by join code"   ON test_sessions;  -- 015
DROP POLICY IF EXISTS "Anon can read sessions with join code" ON test_sessions;  -- 021
DROP POLICY IF EXISTS "Anon can read sessions via invitation" ON test_sessions;

CREATE POLICY "Participants read the session they hold the code for"
  ON test_sessions FOR SELECT
  TO anon, authenticated
  USING (current_join_code() IS NOT NULL AND join_code = current_join_code());

DROP POLICY IF EXISTS "Anon can insert sessions for join flow"  ON test_sessions;
DROP POLICY IF EXISTS "Anon can insert sessions via invitation" ON test_sessions;

CREATE POLICY "Join flow creates the session it just generated a code for"
  ON test_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id = anon_invite_owner()
    AND join_code IS NOT NULL
    AND join_code = current_join_code()
  );

-- ── task_results ────────────────────────────────────────────
DROP POLICY IF EXISTS "Anon can read task results by session join code" ON task_results;  -- 015
DROP POLICY IF EXISTS "Anon can read task results via join code"        ON task_results;  -- 021

CREATE POLICY "Participants read their own task results"
  ON task_results FOR SELECT
  TO anon, authenticated
  USING (anon_can_read_session(session_id));

DROP POLICY IF EXISTS "Anon can insert task results via join code"  ON task_results;
DROP POLICY IF EXISTS "Anon can insert task results via invitation" ON task_results;

CREATE POLICY "Join flow creates the task skeleton for its own session"
  ON task_results FOR INSERT
  TO anon, authenticated
  WITH CHECK (anon_can_read_session(session_id));

-- ── task_question_answers ───────────────────────────────────
DROP POLICY IF EXISTS "Anon can read task question answers by join code"  ON task_question_answers;  -- 015
DROP POLICY IF EXISTS "Anon can read task question answers via join code" ON task_question_answers;  -- 021

CREATE POLICY "Participants read their own answers"
  ON task_question_answers FOR SELECT
  TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM task_results tr
     WHERE tr.id = task_question_answers.task_result_id
       AND anon_can_read_session(tr.session_id)
  ));

DROP POLICY IF EXISTS "Anon can insert task question answers via join code" ON task_question_answers;
DROP POLICY IF EXISTS "Anon can insert task question answers by join code"  ON task_question_answers;
DROP POLICY IF EXISTS "Anon can update task question answers via join code" ON task_question_answers;
DROP POLICY IF EXISTS "Anon can update task question answers by join code"  ON task_question_answers;

CREATE POLICY "Participants write their own answers"
  ON task_question_answers FOR INSERT
  TO anon, authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM task_results tr
     WHERE tr.id = task_question_answers.task_result_id
       AND anon_can_read_session(tr.session_id)
  ));

CREATE POLICY "Participants revise their own answers"
  ON task_question_answers FOR UPDATE
  TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM task_results tr
     WHERE tr.id = task_question_answers.task_result_id
       AND anon_can_read_session(tr.session_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM task_results tr
     WHERE tr.id = task_question_answers.task_result_id
       AND anon_can_read_session(tr.session_id)
  ));

-- ── questionnaire answers ───────────────────────────────────
DROP POLICY IF EXISTS "Anon can read SUS answers via join code"   ON sus_answers;
DROP POLICY IF EXISTS "Anon can insert SUS answers via join code" ON sus_answers;

CREATE POLICY "Participants read their own SUS answers"
  ON sus_answers FOR SELECT
  TO anon, authenticated
  USING (anon_can_read_session(session_id));

CREATE POLICY "Participants write their own SUS answers"
  ON sus_answers FOR INSERT
  TO anon, authenticated
  WITH CHECK (anon_can_read_session(session_id));

DROP POLICY IF EXISTS "Anon can read instrument answers via join code"   ON instrument_answers;
DROP POLICY IF EXISTS "Anon can insert instrument answers via join code" ON instrument_answers;

CREATE POLICY "Participants read their own instrument answers"
  ON instrument_answers FOR SELECT
  TO anon, authenticated
  USING (anon_can_read_session(session_id));

CREATE POLICY "Participants write their own instrument answers"
  ON instrument_answers FOR INSERT
  TO anon, authenticated
  WITH CHECK (anon_can_read_session(session_id));

DROP POLICY IF EXISTS "Anon can read interview answers via join code"   ON interview_answers;
DROP POLICY IF EXISTS "Anon can insert interview answers via join code" ON interview_answers;
DROP POLICY IF EXISTS "Anon can update interview answers via join code" ON interview_answers;

CREATE POLICY "Participants read their own interview answers"
  ON interview_answers FOR SELECT
  TO anon, authenticated
  USING (anon_can_read_session(session_id));

CREATE POLICY "Participants write their own interview answers"
  ON interview_answers FOR INSERT
  TO anon, authenticated
  WITH CHECK (anon_can_read_session(session_id));

CREATE POLICY "Participants revise their own interview answers"
  ON interview_answers FOR UPDATE
  TO anon, authenticated
  USING (anon_can_read_session(session_id))
  WITH CHECK (anon_can_read_session(session_id));

-- ── storage: session media ──────────────────────────────────
-- Paths are {evaluator_id}/{session_id}/{task_id}/{question_id}, so the
-- grant narrows from "any evaluator with a join-code session" (i.e.
-- every evaluator) to this one session's folder.
DROP POLICY IF EXISTS "Anon can read media for join-code sessions"   ON storage.objects;
DROP POLICY IF EXISTS "Anon can upload media for join-code sessions" ON storage.objects;

CREATE POLICY "Participants read media from their own session"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (
    bucket_id = 'session-media'
    AND anon_session_id() IS NOT NULL
    AND (storage.foldername(name))[2] = anon_session_id()::text
  );

CREATE POLICY "Participants upload media into their own session"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    bucket_id = 'session-media'
    AND anon_session_id() IS NOT NULL
    AND (storage.foldername(name))[2] = anon_session_id()::text
  );
