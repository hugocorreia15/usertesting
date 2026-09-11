-- ============================================================
-- Verification for migrations 050 (instructor gate) and 051 (org defaults)
-- ============================================================
-- Run in the Supabase SQL editor after applying both. Triggers fire for a
-- superuser too, so the guard checks below are meaningful here even though
-- RLS is not. Replace the two placeholders first.
--
--   :tpl  a template id you can safely experiment with
--   :org  an organization id you own
--
-- Each block states what it expects. Anything else is a real finding.

-- ── 1. The guard: review columns cannot be written directly ──
-- The point of this one. Students hold UPDATE on org templates, so if this
-- succeeds a student can approve their own protocol.
-- EXPECT: ERROR "review columns change only through the review functions"
update templates set review_status = 'approved'
 where id = '<tpl>';

-- ── 2. Ordinary template edits still work ──
-- EXPECT: success. The guard must only refuse the review columns.
update templates set description = coalesce(description, '') where id = '<tpl>';

-- ── 3. Mode, request, decide ──
select set_template_review_mode('<tpl>', 'required');
select review_mode, review_status from templates where id = '<tpl>';
-- EXPECT: required | draft

select request_template_review('<tpl>');
select review_status, review_submitted_at from templates where id = '<tpl>';
-- EXPECT: submitted, with a timestamp

select review_template('<tpl>', 'approved', 'Looks good');
select review_status, reviewed_at, review_note from templates where id = '<tpl>';
-- EXPECT: approved, with a timestamp and the note

-- ── 4. A protocol edit sends an approved template back to draft ──
update template_tasks set name = name where template_id = '<tpl>';
select review_status, approval_invalidated_at from templates where id = '<tpl>';
-- EXPECT: draft, with a timestamp

-- ── 5. Recruiting is gated, and owners are exempt ──
select template_recruiting_allowed('<tpl>');
-- EXPECT: true when you own the org (owners are never gated), false otherwise.
-- The student-facing half is the RLS check on session_invitations INSERT and
-- has to be tested from a student account in the app.

-- ── 6. A session on a gated template arrives as a pilot ──
-- Run after creating a session in the app while the template is unapproved.
select id, is_pilot, created_at from test_sessions
 where template_id = '<tpl>' order by created_at desc limit 3;
-- EXPECT: is_pilot = true for a session created by a non-owner while unapproved

-- ── 7. Org defaults reach a template when it is shared (051) ──
update organizations
   set default_review_mode = 'required',
       default_consent_text = 'Class consent text',
       default_instruments = array['sus']
 where id = '<org>';
-- Then share a template into the org from the app and check:
select review_mode, consent_text, instruments from templates where id = '<tpl>';
-- EXPECT: required, and the class consent text and instruments IF the
-- template had none of its own. A template with its own consent text or
-- instruments must keep them.

-- ── 8. Retrofit reports what it touched ──
select apply_org_defaults('<org>', true, false, false);
-- EXPECT: the number of templates shared with that organization.
-- Called by a non-owner it must raise insufficient_privilege.

-- ── 9. Put it back ──
select set_template_review_mode('<tpl>', 'off');
update organizations set default_review_mode = 'off',
       default_consent_text = null, default_instruments = '{}'
 where id = '<org>';
