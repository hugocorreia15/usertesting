-- ============================================================
-- 030 – Seed 2 additional Tobii participants with full sessions
-- ============================================================
-- Grounded in the real responses from João Andrade (d3a86c75) and
-- Mariana Andrade (df394a2e). All open-text answers paraphrase what
-- those two participants actually wrote; single-choice/rating answers
-- are drawn from the observed distribution. Demographics, SEQ, SUS
-- and error/hesitation patterns mirror the real data.
--
-- Henrique Teixeira (22, M, Student, low tech) channels João's
-- profile: fast, mostly success, failure on the Metrics Explorer
-- fixation task. Beatriz Dias (21, F, Student, low tech) channels
-- Mariana's profile: similar AOI/TOI struggles, same failure on
-- the fixation task. Both run 20 tasks (Zone dwell over time was
-- excluded from their session selection, like João's). SUS lands
-- near the existing 80 average.
--
-- Idempotent via top-level DELETE on the two fixed participant ids
-- (cascades to sessions/task_results/answers/logs).

DO $seed$
DECLARE
  v_user  uuid := COALESCE(
    (SELECT id FROM auth.users WHERE email = 'hf_correya@hotmail.com' LIMIT 1),
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
  );
  v_template uuid := 'a1000000-0000-0000-0000-000000000004';
  v_p3 uuid := 'aae70000-0000-0000-0000-000000000001';
  v_p4 uuid := 'aae70000-0000-0000-0000-000000000002';
  v_s3 uuid := 'aae80000-0000-0000-0000-000000000001';
  v_s4 uuid := 'aae80000-0000-0000-0000-000000000002';
BEGIN

-- Clean slate (cascade clears sessions/task_results/answers/logs)
DELETE FROM participants WHERE id IN (v_p3, v_p4);

-- ── Participants ──
INSERT INTO participants
  (id, name, email, age, gender, occupation, tech_proficiency, notes, user_id, is_anonymous)
VALUES
  (v_p3, 'Henrique Teixeira', NULL, 22, 'male',   'Student', 'low', NULL, v_user, false),
  (v_p4, 'Beatriz Dias',      NULL, 21, 'female', 'Student', 'low', NULL, v_user, false);

-- ── Template participant fields (Extra Info card) ──
-- Mirrors João's filled-in pattern (Right / Portuguese / Tobii / Lab),
-- with vision correction varied. Condition/Group and Consent ref are
-- left empty for both, matching João's existing record.
-- Look up template_participant_fields by label so this is robust to
-- whatever UUIDs the fields were assigned with.
WITH pv (participant_id, label, value) AS (
  VALUES
    (v_p3, 'Handedness',         'Right'),
    (v_p3, 'Vision correction',  'None'),
    (v_p3, 'First language',     'Portuguese'),
    (v_p3, 'Device',             'Tobii'),
    (v_p3, 'Location',           'Lab'),
    (v_p4, 'Handedness',         'Right'),
    (v_p4, 'Vision correction',  'Contacts'),
    (v_p4, 'First language',     'Portuguese'),
    (v_p4, 'Device',             'Tobii'),
    (v_p4, 'Location',           'Lab')
)
INSERT INTO participant_field_values (participant_id, field_id, value)
SELECT pv.participant_id, f.id, pv.value
  FROM pv
  JOIN template_participant_fields f
    ON f.template_id = v_template
   AND f.label = pv.label;

-- ── Sessions (both completed) ──
INSERT INTO test_sessions
  (id, template_id, participant_id, evaluator_name, status, started_at, completed_at, user_id, current_task_index)
VALUES
  (v_s3, v_template, v_p3, 'Hugo Correia', 'completed', '2026-05-27 09:00:00+00', '2026-05-27 09:33:00+00', v_user, 20),
  (v_s4, v_template, v_p4, 'Hugo Correia', 'completed', '2026-05-27 11:00:00+00', '2026-05-27 11:40:00+00', v_user, 20);

-- ── Task results ──
INSERT INTO task_results
  (id, session_id, task_id, completion_status, time_seconds, action_count, error_count, hesitation_count, seq_rating, sort_order)
VALUES
  -- Tomás (P3)
  ('aae90000-0000-0000-0000-000000000301', v_s3, 'aae20000-0000-0000-0000-000000000001', 'success',  78.0, 4, 0, 0, 7,  0),
  ('aae90000-0000-0000-0000-000000000302', v_s3, 'aae20000-0000-0000-0000-000000000002', 'success',  32.4, 3, 0, 0, 7,  1),
  ('aae90000-0000-0000-0000-000000000303', v_s3, 'aae20000-0000-0000-0000-000000000003', 'success',  48.2, 4, 0, 0, 7,  2),
  ('aae90000-0000-0000-0000-000000000304', v_s3, 'aae20000-0000-0000-0000-000000000004', 'success',  35.1, 3, 0, 0, 7,  3),
  ('aae90000-0000-0000-0000-000000000305', v_s3, 'aae20000-0000-0000-0000-000000000005', 'success', 142.0, 6, 0, 1, 6,  4),
  ('aae90000-0000-0000-0000-000000000306', v_s3, 'aae20000-0000-0000-0000-000000000006', 'success',  58.7, 4, 0, 0, 7,  5),
  ('aae90000-0000-0000-0000-000000000307', v_s3, 'aae20000-0000-0000-0000-000000000007', 'success',  64.2, 4, 0, 0, 6,  6),
  ('aae90000-0000-0000-0000-000000000308', v_s3, 'aae20000-0000-0000-0000-000000000008', 'success',  27.5, 3, 0, 0, 7,  7),
  ('aae90000-0000-0000-0000-000000000309', v_s3, 'aae20000-0000-0000-0000-000000000009', 'success',  60.4, 5, 0, 0, 6,  8),
  ('aae90000-0000-0000-0000-000000000310', v_s3, 'aae20000-0000-0000-0000-000000000010', 'success',  36.1, 3, 0, 0, 7,  9),
  ('aae90000-0000-0000-0000-000000000311', v_s3, 'aae20000-0000-0000-0000-000000000011', 'success',  49.3, 4, 0, 0, 6, 10),
  ('aae90000-0000-0000-0000-000000000312', v_s3, 'aae20000-0000-0000-0000-000000000012', 'success',  88.6, 5, 1, 0, 6, 11),
  ('aae90000-0000-0000-0000-000000000313', v_s3, 'aae20000-0000-0000-0000-000000000013', 'success',  38.4, 5, 0, 0, 7, 12),
  ('aae90000-0000-0000-0000-000000000314', v_s3, 'aae20000-0000-0000-0000-000000000014', 'success',  34.8, 6, 0, 1, 6, 13),
  ('aae90000-0000-0000-0000-000000000315', v_s3, 'aae20000-0000-0000-0000-000000000015', 'success',  25.7, 3, 0, 0, 7, 14),
  ('aae90000-0000-0000-0000-000000000316', v_s3, 'aae20000-0000-0000-0000-000000000016', 'failure',  82.0, 5, 0, 1, 3, 15),
  ('aae90000-0000-0000-0000-000000000317', v_s3, 'aae20000-0000-0000-0000-000000000017', 'success',  72.4, 3, 0, 0, 6, 16),
  ('aae90000-0000-0000-0000-000000000318', v_s3, 'aae20000-0000-0000-0000-000000000018', 'success',  18.2, 3, 0, 0, 7, 17),
  ('aae90000-0000-0000-0000-000000000319', v_s3, 'aae20000-0000-0000-0000-000000000019', 'success',  65.8, 4, 0, 0, 6, 18),
  ('aae90000-0000-0000-0000-000000000321', v_s3, 'aae20000-0000-0000-0000-000000000021', 'success',  41.2, 4, 0, 0, 7, 19),
  -- Beatriz (P4)
  ('aae90000-0000-0000-0000-000000000401', v_s4, 'aae20000-0000-0000-0000-000000000001', 'success', 165.0, 4, 0, 0, 7,  0),
  ('aae90000-0000-0000-0000-000000000402', v_s4, 'aae20000-0000-0000-0000-000000000002', 'success',  35.7, 3, 0, 0, 7,  1),
  ('aae90000-0000-0000-0000-000000000403', v_s4, 'aae20000-0000-0000-0000-000000000003', 'success',  64.1, 4, 0, 0, 6,  2),
  ('aae90000-0000-0000-0000-000000000404', v_s4, 'aae20000-0000-0000-0000-000000000004', 'success',  44.9, 3, 0, 0, 7,  3),
  ('aae90000-0000-0000-0000-000000000405', v_s4, 'aae20000-0000-0000-0000-000000000005', 'success', 198.3, 7, 1, 2, 5,  4),
  ('aae90000-0000-0000-0000-000000000406', v_s4, 'aae20000-0000-0000-0000-000000000006', 'success',  81.5, 4, 0, 1, 7,  5),
  ('aae90000-0000-0000-0000-000000000407', v_s4, 'aae20000-0000-0000-0000-000000000007', 'success',  73.8, 4, 1, 0, 6,  6),
  ('aae90000-0000-0000-0000-000000000408', v_s4, 'aae20000-0000-0000-0000-000000000008', 'success',  29.6, 3, 0, 0, 7,  7),
  ('aae90000-0000-0000-0000-000000000409', v_s4, 'aae20000-0000-0000-0000-000000000009', 'success',  41.8, 5, 0, 0, 7,  8),
  ('aae90000-0000-0000-0000-000000000410', v_s4, 'aae20000-0000-0000-0000-000000000010', 'success',  26.5, 3, 0, 0, 7,  9),
  ('aae90000-0000-0000-0000-000000000411', v_s4, 'aae20000-0000-0000-0000-000000000011', 'success',  68.4, 5, 1, 1, 6, 10),
  ('aae90000-0000-0000-0000-000000000412', v_s4, 'aae20000-0000-0000-0000-000000000012', 'success', 118.2, 6, 4, 1, 6, 11),
  ('aae90000-0000-0000-0000-000000000413', v_s4, 'aae20000-0000-0000-0000-000000000013', 'success',  51.7, 5, 0, 0, 7, 12),
  ('aae90000-0000-0000-0000-000000000414', v_s4, 'aae20000-0000-0000-0000-000000000014', 'success',  42.9, 6, 0, 1, 6, 13),
  ('aae90000-0000-0000-0000-000000000415', v_s4, 'aae20000-0000-0000-0000-000000000015', 'success',  21.6, 3, 0, 0, 7, 14),
  ('aae90000-0000-0000-0000-000000000416', v_s4, 'aae20000-0000-0000-0000-000000000016', 'failure', 132.3, 5, 0, 1, 2, 15),
  ('aae90000-0000-0000-0000-000000000417', v_s4, 'aae20000-0000-0000-0000-000000000017', 'success',  84.0, 3, 0, 0, 6, 16),
  ('aae90000-0000-0000-0000-000000000418', v_s4, 'aae20000-0000-0000-0000-000000000018', 'success',   9.4, 3, 0, 0, 7, 17),
  ('aae90000-0000-0000-0000-000000000419', v_s4, 'aae20000-0000-0000-0000-000000000019', 'success',  88.7, 5, 0, 0, 5, 18),
  ('aae90000-0000-0000-0000-000000000421', v_s4, 'aae20000-0000-0000-0000-000000000021', 'success',  49.5, 4, 0, 0, 7, 19);

-- ── Task question answers ──
-- Joined to task_questions via (task_id, question_text) so we don't
-- need to know every question's UUID. Media-type prompts and empty
-- Notes are omitted.
WITH ans (tr_id, task_id, question_text, answer_text, selected_options, rating_value) AS (
  VALUES
    -- ============================ Tomás (P3) ============================
    -- T01 Upload cloud study
    ('aae90000-0000-0000-0000-000000000301'::uuid, 'aae20000-0000-0000-0000-000000000001'::uuid, $q$Was it clear which tab to use for a cloud (ZIP) study vs. a filesystem study?$q$, NULL, '["Yes, immediately"]'::jsonb, NULL::int),
    ('aae90000-0000-0000-0000-000000000301'::uuid, 'aae20000-0000-0000-0000-000000000001'::uuid, $q$Did the Tobii / Webcam source filter help you find the right study?$q$, NULL, '["Somewhat"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000301'::uuid, 'aae20000-0000-0000-0000-000000000001'::uuid, $q$Describe how you knew ingestion had completed and the study was ready.$q$, $q$Status changed from processing to ready and the study showed up in the list$q$, NULL, NULL),
    -- T02 Study Summary
    ('aae90000-0000-0000-0000-000000000302'::uuid, 'aae20000-0000-0000-0000-000000000002'::uuid, $q$Rate how well the Study Summary oriented you to the dataset.$q$, NULL, NULL, 5),
    -- T03 Browse recordings & participants
    ('aae90000-0000-0000-0000-000000000303'::uuid, 'aae20000-0000-0000-0000-000000000003'::uuid, $q$Could you tell whether a recording had good data quality (validity)?$q$, NULL, '["Yes, confidently"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000303'::uuid, 'aae20000-0000-0000-0000-000000000003'::uuid, $q$What did you expect to see on the Participants page that was or wasn't there?$q$, $q$Direct link from each participant row to their recordings$q$, NULL, NULL),
    -- T04 Participant detail
    ('aae90000-0000-0000-0000-000000000304'::uuid, 'aae20000-0000-0000-0000-000000000004'::uuid, $q$Was the per-participant breakdown (sessions, validity, consistency) easy to read?$q$, NULL, NULL, 5),
    -- T05 Create AOI + auto-track
    ('aae90000-0000-0000-0000-000000000305'::uuid, 'aae20000-0000-0000-0000-000000000005'::uuid, $q$How confident were you that the AOI tracked the right object?$q$, NULL, NULL, 4),
    ('aae90000-0000-0000-0000-000000000305'::uuid, 'aae20000-0000-0000-0000-000000000005'::uuid, $q$Was drawing and keyframing the AOI intuitive?$q$, NULL, '["Yes, after a brief look"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000305'::uuid, 'aae20000-0000-0000-0000-000000000005'::uuid, $q$Describe anything that made AOI placement harder than expected.$q$, $q$Auto-track being tucked under the three-dot menu wasn't obvious$q$, NULL, NULL),
    -- T06 Scan-path overlay
    ('aae90000-0000-0000-0000-000000000306'::uuid, 'aae20000-0000-0000-0000-000000000006'::uuid, $q$Was it obvious how to turn the AOI layer on over the scan path?$q$, NULL, '["Yes, after a brief look"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000306'::uuid, 'aae20000-0000-0000-0000-000000000006'::uuid, $q$Could you tell, visually, when gaze entered the AOI?$q$, NULL, '["Yes, confidently"]'::jsonb, NULL),
    -- T07 Multi-recording overlay
    ('aae90000-0000-0000-0000-000000000307'::uuid, 'aae20000-0000-0000-0000-000000000007'::uuid, $q$Did you understand that the AOI filter is independent per recording?$q$, NULL, '["Yes, immediately"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000307'::uuid, 'aae20000-0000-0000-0000-000000000007'::uuid, $q$Rate how useful the side-by-side AOI comparison was.$q$, NULL, NULL, 4),
    -- T08 Scope AOI
    ('aae90000-0000-0000-0000-000000000308'::uuid, 'aae20000-0000-0000-0000-000000000008'::uuid, $q$Was the AOI scope selector discoverable?$q$, NULL, '["Yes, after a brief look"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000308'::uuid, 'aae20000-0000-0000-0000-000000000008'::uuid, $q$Did the numbers visibly change to reflect the AOI scope?$q$, NULL, '["Exactly as expected"]'::jsonb, NULL),
    -- T09 Create TOI
    ('aae90000-0000-0000-0000-000000000309'::uuid, 'aae20000-0000-0000-0000-000000000009'::uuid, $q$Was defining a TOI start/end on the timeline intuitive?$q$, NULL, '["Yes, immediately"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000309'::uuid, 'aae20000-0000-0000-0000-000000000009'::uuid, $q$Rate how confident you were the TOI captured the segment you intended.$q$, NULL, NULL, 5),
    -- T10 Scope TOI
    ('aae90000-0000-0000-0000-000000000310'::uuid, 'aae20000-0000-0000-0000-000000000010'::uuid, $q$Was choosing a TOI as the analysis scope clear (vs. AOI vs. all)?$q$, NULL, '["Yes, immediately"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000310'::uuid, 'aae20000-0000-0000-0000-000000000010'::uuid, $q$Did the metrics clearly reflect only the TOI window?$q$, NULL, '["Exactly as expected"]'::jsonb, NULL),
    -- T11 Comparison chart all vs TOI
    ('aae90000-0000-0000-0000-000000000311'::uuid, 'aae20000-0000-0000-0000-000000000011'::uuid, $q$Was the Comparison chart's scope control (all / TOI / AOI) understandable?$q$, NULL, '["Yes, immediately"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000311'::uuid, 'aae20000-0000-0000-0000-000000000011'::uuid, $q$Rate how well the chart communicated the all-vs-TOI difference.$q$, NULL, NULL, 4),
    -- T12 Auto-track within TOI
    ('aae90000-0000-0000-0000-000000000312'::uuid, 'aae20000-0000-0000-0000-000000000012'::uuid, $q$Was it clear you could drive auto-track by a TOI instead of manual start/end?$q$, NULL, '["Yes, after a brief look"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000312'::uuid, 'aae20000-0000-0000-0000-000000000012'::uuid, $q$Did limiting auto-track to the TOI behave as you expected?$q$, $q$Yes, once I found the option$q$, NULL, NULL),
    -- T13 Compare visualizations
    ('aae90000-0000-0000-0000-000000000313'::uuid, 'aae20000-0000-0000-0000-000000000013'::uuid, $q$Which visualization best answered 'where did people look first?'$q$, NULL, '["Heatmap / Density"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000313'::uuid, 'aae20000-0000-0000-0000-000000000013'::uuid, $q$Were the controls for switching visualization modes easy to find?$q$, NULL, '["Yes, immediately"]'::jsonb, NULL),
    -- T14 Compare two participants (C10 vs A4)
    ('aae90000-0000-0000-0000-000000000314'::uuid, 'aae20000-0000-0000-0000-000000000014'::uuid, $q$Was selecting exactly two participants (C10 and A4) to compare straightforward?$q$, NULL, '["Yes, after a brief look"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000314'::uuid, 'aae20000-0000-0000-0000-000000000014'::uuid, $q$From the Comparison Overview, which participant looked stronger and on what?$q$, $q$A4 — more consistent and more active$q$, NULL, NULL),
    ('aae90000-0000-0000-0000-000000000314'::uuid, 'aae20000-0000-0000-0000-000000000014'::uuid, $q$Rate how clearly the Detailed Metrics Comparison let you contrast C10 vs A4.$q$, NULL, NULL, 4),
    ('aae90000-0000-0000-0000-000000000314'::uuid, 'aae20000-0000-0000-0000-000000000014'::uuid, $q$Which metric (Validity, Consistency, Efficiency, ...) did you trust most for judging quality?$q$, NULL, '["Validity"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000314'::uuid, 'aae20000-0000-0000-0000-000000000014'::uuid, $q$Notes$q$, $q$Names of participants should appear in the comparison, not just the IDs$q$, NULL, NULL),
    -- T15 Add third participant
    ('aae90000-0000-0000-0000-000000000315'::uuid, 'aae20000-0000-0000-0000-000000000015'::uuid, $q$Was changing who is being compared obvious and low-friction?$q$, NULL, '["Yes, after a brief look"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000315'::uuid, 'aae20000-0000-0000-0000-000000000015'::uuid, $q$Did the 'Best Data Quality / Most Consistent / Most Active' badges update sensibly?$q$, NULL, '["Exactly as expected"]'::jsonb, NULL),
    -- T16 Fixation metric scoped AOI (partial)
    ('aae90000-0000-0000-0000-000000000316'::uuid, 'aae20000-0000-0000-0000-000000000016'::uuid, $q$Was it clear how to choose a metric and add a condition?$q$, NULL, '["Only after struggling"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000316'::uuid, 'aae20000-0000-0000-0000-000000000016'::uuid, $q$Rate how understandable the strip plot was.$q$, NULL, NULL, 3),
    -- T17 Saccade direction
    ('aae90000-0000-0000-0000-000000000317'::uuid, 'aae20000-0000-0000-0000-000000000017'::uuid, $q$Did you understand the saccade-direction convention without external help?$q$, NULL, '["Only after struggling"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000317'::uuid, 'aae20000-0000-0000-0000-000000000017'::uuid, $q$What would make the direction metric easier to interpret?$q$, $q$A radial / circular plot would be clearer than a strip$q$, NULL, NULL),
    -- T18 Pupil mm
    ('aae90000-0000-0000-0000-000000000318'::uuid, 'aae20000-0000-0000-0000-000000000018'::uuid, $q$Was the pupil metric's unit (mm) obvious?$q$, NULL, '["Yes, immediately"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000318'::uuid, 'aae20000-0000-0000-0000-000000000018'::uuid, $q$Rate confidence that you read the pupil result correctly.$q$, NULL, NULL, 5),
    -- T19 AOI metrics + participant variable
    ('aae90000-0000-0000-0000-000000000319'::uuid, 'aae20000-0000-0000-0000-000000000019'::uuid, $q$Was splitting by a participant variable discoverable?$q$, NULL, '["Yes, immediately"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000319'::uuid, 'aae20000-0000-0000-0000-000000000019'::uuid, $q$Did changing aggregation (participant vs recording) change the result the way you expected?$q$, NULL, '["Mostly"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000319'::uuid, 'aae20000-0000-0000-0000-000000000019'::uuid, $q$Notes$q$, $q$Some labels on the y axis get cut off$q$, NULL, NULL),
    -- T20 Zone dwell skipped — no answers
    -- T21 Produce export
    ('aae90000-0000-0000-0000-000000000321'::uuid, 'aae20000-0000-0000-0000-000000000021'::uuid, $q$Was it clear what would be included in the export (and at what scope)?$q$, NULL, '["Yes, after a brief look"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000321'::uuid, 'aae20000-0000-0000-0000-000000000021'::uuid, $q$Rate how easy producing the export was.$q$, NULL, NULL, 5),

    -- ============================ Beatriz (P4) ============================
    -- T01 Upload cloud study
    ('aae90000-0000-0000-0000-000000000401'::uuid, 'aae20000-0000-0000-0000-000000000001'::uuid, $q$Was it clear which tab to use for a cloud (ZIP) study vs. a filesystem study?$q$, NULL, '["Yes, immediately"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000401'::uuid, 'aae20000-0000-0000-0000-000000000001'::uuid, $q$Did the Tobii / Webcam source filter help you find the right study?$q$, NULL, '["Yes, a lot"]'::jsonb, NULL),
    -- T02
    ('aae90000-0000-0000-0000-000000000402'::uuid, 'aae20000-0000-0000-0000-000000000002'::uuid, $q$Rate how well the Study Summary oriented you to the dataset.$q$, NULL, NULL, 5),
    -- T03
    ('aae90000-0000-0000-0000-000000000403'::uuid, 'aae20000-0000-0000-0000-000000000003'::uuid, $q$Could you tell whether a recording had good data quality (validity)?$q$, NULL, '["Yes, confidently"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000403'::uuid, 'aae20000-0000-0000-0000-000000000003'::uuid, $q$What did you expect to see on the Participants page that was or wasn't there?$q$, $q$Esperava um link direto da página do participante para as suas gravações$q$, NULL, NULL),
    -- T04
    ('aae90000-0000-0000-0000-000000000404'::uuid, 'aae20000-0000-0000-0000-000000000004'::uuid, $q$Was the per-participant breakdown (sessions, validity, consistency) easy to read?$q$, NULL, NULL, 5),
    -- T05 AOI auto-track
    ('aae90000-0000-0000-0000-000000000405'::uuid, 'aae20000-0000-0000-0000-000000000005'::uuid, $q$How confident were you that the AOI tracked the right object?$q$, NULL, NULL, 3),
    ('aae90000-0000-0000-0000-000000000405'::uuid, 'aae20000-0000-0000-0000-000000000005'::uuid, $q$Was drawing and keyframing the AOI intuitive?$q$, NULL, '["Yes, after a brief look"]'::jsonb, NULL),
    -- T06
    ('aae90000-0000-0000-0000-000000000406'::uuid, 'aae20000-0000-0000-0000-000000000006'::uuid, $q$Was it obvious how to turn the AOI layer on over the scan path?$q$, NULL, '["Yes, immediately"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000406'::uuid, 'aae20000-0000-0000-0000-000000000006'::uuid, $q$Could you tell, visually, when gaze entered the AOI?$q$, NULL, '["Yes, confidently"]'::jsonb, NULL),
    -- T07
    ('aae90000-0000-0000-0000-000000000407'::uuid, 'aae20000-0000-0000-0000-000000000007'::uuid, $q$Did you understand that the AOI filter is independent per recording?$q$, NULL, '["Yes, immediately"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000407'::uuid, 'aae20000-0000-0000-0000-000000000007'::uuid, $q$Rate how useful the side-by-side AOI comparison was.$q$, NULL, NULL, 4),
    -- T08
    ('aae90000-0000-0000-0000-000000000408'::uuid, 'aae20000-0000-0000-0000-000000000008'::uuid, $q$Was the AOI scope selector discoverable?$q$, NULL, '["Yes, after a brief look"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000408'::uuid, 'aae20000-0000-0000-0000-000000000008'::uuid, $q$Did the numbers visibly change to reflect the AOI scope?$q$, NULL, '["Exactly as expected"]'::jsonb, NULL),
    -- T09
    ('aae90000-0000-0000-0000-000000000409'::uuid, 'aae20000-0000-0000-0000-000000000009'::uuid, $q$Was defining a TOI start/end on the timeline intuitive?$q$, NULL, '["Yes, immediately"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000409'::uuid, 'aae20000-0000-0000-0000-000000000009'::uuid, $q$Rate how confident you were the TOI captured the segment you intended.$q$, NULL, NULL, 5),
    -- T10
    ('aae90000-0000-0000-0000-000000000410'::uuid, 'aae20000-0000-0000-0000-000000000010'::uuid, $q$Was choosing a TOI as the analysis scope clear (vs. AOI vs. all)?$q$, NULL, '["Yes, immediately"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000410'::uuid, 'aae20000-0000-0000-0000-000000000010'::uuid, $q$Did the metrics clearly reflect only the TOI window?$q$, NULL, '["Exactly as expected"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000410'::uuid, 'aae20000-0000-0000-0000-000000000010'::uuid, $q$What did you expect a TOI scope to change that it did/didn't?$q$, $q$Faltava um botão para análise logo a seguir a definir a TOI$q$, NULL, NULL),
    -- T11
    ('aae90000-0000-0000-0000-000000000411'::uuid, 'aae20000-0000-0000-0000-000000000011'::uuid, $q$Was the Comparison chart's scope control (all / TOI / AOI) understandable?$q$, NULL, '["Yes, immediately"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000411'::uuid, 'aae20000-0000-0000-0000-000000000011'::uuid, $q$Rate how well the chart communicated the all-vs-TOI difference.$q$, NULL, NULL, 4),
    -- T12
    ('aae90000-0000-0000-0000-000000000412'::uuid, 'aae20000-0000-0000-0000-000000000012'::uuid, $q$Was it clear you could drive auto-track by a TOI instead of manual start/end?$q$, NULL, '["Yes, immediately"]'::jsonb, NULL),
    -- T13
    ('aae90000-0000-0000-0000-000000000413'::uuid, 'aae20000-0000-0000-0000-000000000013'::uuid, $q$Which visualization best answered 'where did people look first?'$q$, NULL, '["Scan-path"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000413'::uuid, 'aae20000-0000-0000-0000-000000000013'::uuid, $q$Were the controls for switching visualization modes easy to find?$q$, NULL, '["Yes, immediately"]'::jsonb, NULL),
    -- T14 Compare two participants
    ('aae90000-0000-0000-0000-000000000414'::uuid, 'aae20000-0000-0000-0000-000000000014'::uuid, $q$Was selecting exactly two participants (C10 and A4) to compare straightforward?$q$, NULL, '["Yes, after a brief look"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000414'::uuid, 'aae20000-0000-0000-0000-000000000014'::uuid, $q$From the Comparison Overview, which participant looked stronger and on what?$q$, $q$A4 — pena mostrar IDs em vez do nome$q$, NULL, NULL),
    ('aae90000-0000-0000-0000-000000000414'::uuid, 'aae20000-0000-0000-0000-000000000014'::uuid, $q$Rate how clearly the Detailed Metrics Comparison let you contrast C10 vs A4.$q$, NULL, NULL, 5),
    ('aae90000-0000-0000-0000-000000000414'::uuid, 'aae20000-0000-0000-0000-000000000014'::uuid, $q$Which metric (Validity, Consistency, Efficiency, ...) did you trust most for judging quality?$q$, NULL, '["Samples"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000414'::uuid, 'aae20000-0000-0000-0000-000000000014'::uuid, $q$Notes$q$, $q$Mostrar nome do participante na comparação$q$, NULL, NULL),
    -- T15
    ('aae90000-0000-0000-0000-000000000415'::uuid, 'aae20000-0000-0000-0000-000000000015'::uuid, $q$Was changing who is being compared obvious and low-friction?$q$, NULL, '["Yes, immediately"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000415'::uuid, 'aae20000-0000-0000-0000-000000000015'::uuid, $q$Did the 'Best Data Quality / Most Consistent / Most Active' badges update sensibly?$q$, NULL, '["Exactly as expected"]'::jsonb, NULL),
    -- T16 Fixation metric (failure)
    ('aae90000-0000-0000-0000-000000000416'::uuid, 'aae20000-0000-0000-0000-000000000016'::uuid, $q$Was it clear how to choose a metric and add a condition?$q$, NULL, '["Yes, after a brief look"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000416'::uuid, 'aae20000-0000-0000-0000-000000000016'::uuid, $q$Rate how understandable the strip plot was.$q$, NULL, NULL, 3),
    -- T17 Saccade
    ('aae90000-0000-0000-0000-000000000417'::uuid, 'aae20000-0000-0000-0000-000000000017'::uuid, $q$Did you understand the saccade-direction convention without external help?$q$, NULL, '["Yes, after a brief look"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000417'::uuid, 'aae20000-0000-0000-0000-000000000017'::uuid, $q$What would make the direction metric easier to interpret?$q$, $q$Um gráfico circular ajudaria a interpretar$q$, NULL, NULL),
    -- T18 Pupil
    ('aae90000-0000-0000-0000-000000000418'::uuid, 'aae20000-0000-0000-0000-000000000018'::uuid, $q$Was the pupil metric's unit (mm) obvious?$q$, NULL, '["Yes, immediately"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000418'::uuid, 'aae20000-0000-0000-0000-000000000018'::uuid, $q$Rate confidence that you read the pupil result correctly.$q$, NULL, NULL, 5),
    -- T19
    ('aae90000-0000-0000-0000-000000000419'::uuid, 'aae20000-0000-0000-0000-000000000019'::uuid, $q$Was splitting by a participant variable discoverable?$q$, NULL, '["Yes, immediately"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000419'::uuid, 'aae20000-0000-0000-0000-000000000019'::uuid, $q$Did changing aggregation (participant vs recording) change the result the way you expected?$q$, NULL, '["Partially"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000419'::uuid, 'aae20000-0000-0000-0000-000000000019'::uuid, $q$Notes$q$, $q$Eixo Y com números cortados$q$, NULL, NULL),
    -- T20 Zone dwell skipped — task not selected for this participant
    -- T21 Export
    ('aae90000-0000-0000-0000-000000000421'::uuid, 'aae20000-0000-0000-0000-000000000021'::uuid, $q$Was it clear what would be included in the export (and at what scope)?$q$, NULL, '["Yes, after a brief look"]'::jsonb, NULL),
    ('aae90000-0000-0000-0000-000000000421'::uuid, 'aae20000-0000-0000-0000-000000000021'::uuid, $q$Rate how easy producing the export was.$q$, NULL, NULL, 4)
)
INSERT INTO task_question_answers (task_result_id, question_id, answer_text, selected_options, rating_value)
SELECT a.tr_id, q.id, a.answer_text, a.selected_options, a.rating_value
  FROM ans a
  JOIN task_questions q ON q.task_id = a.task_id AND q.question_text = a.question_text;

-- ── Error logs ──
-- Henrique T12 (1 × E1).
-- Beatriz T05, T07, T11 (1 × E1 each); T12 (3 × E1 + 1 × E8) — mirrors Mariana exactly.
-- Look up the template's error types by code (template_id, code) so this
-- works regardless of whatever UUIDs the error types were assigned with.
WITH el (tr_id, code, ts) AS (
  VALUES
    ('aae90000-0000-0000-0000-000000000312'::uuid, 'E1',  45.0),
    ('aae90000-0000-0000-0000-000000000405'::uuid, 'E1',  80.0),
    ('aae90000-0000-0000-0000-000000000407'::uuid, 'E1',  35.0),
    ('aae90000-0000-0000-0000-000000000411'::uuid, 'E1',  40.0),
    ('aae90000-0000-0000-0000-000000000412'::uuid, 'E1',  25.0),
    ('aae90000-0000-0000-0000-000000000412'::uuid, 'E1',  55.0),
    ('aae90000-0000-0000-0000-000000000412'::uuid, 'E1',  88.0),
    ('aae90000-0000-0000-0000-000000000412'::uuid, 'E8', 100.0)
)
INSERT INTO error_logs (task_result_id, error_type_id, timestamp_seconds, description)
SELECT el.tr_id, et.id, el.ts, NULL
  FROM el
  JOIN template_error_types et
    ON et.template_id = v_template
   AND et.code = el.code;

-- ── Hesitation logs ──
INSERT INTO hesitation_logs (task_result_id, timestamp_seconds, note)
VALUES
  ('aae90000-0000-0000-0000-000000000305',  60.0, NULL),
  ('aae90000-0000-0000-0000-000000000314',  18.0, NULL),
  ('aae90000-0000-0000-0000-000000000316',  50.0, NULL),
  ('aae90000-0000-0000-0000-000000000405',  90.0, NULL),
  ('aae90000-0000-0000-0000-000000000405', 150.0, NULL),
  ('aae90000-0000-0000-0000-000000000406',  40.0, NULL),
  ('aae90000-0000-0000-0000-000000000411',  30.0, NULL),
  ('aae90000-0000-0000-0000-000000000412',  70.0, NULL),
  ('aae90000-0000-0000-0000-000000000414',  20.0, NULL),
  ('aae90000-0000-0000-0000-000000000416',  70.0, NULL);

-- ── Interview answers ──
WITH ia (session_id, question_text, answer_text) AS (
  VALUES
    -- Tomás (paraphrasing João's points: hidden auto-track, missing
    -- participant names in comparison, axis labels cut off, switching
    -- pages to pick comparison participants).
    (v_s3, $q$Describe the full path you took from a raw study ZIP to an exported, scoped result.$q$, $q$Pulled the ZIP into Cloud Studies, waited for ingestion, opened the dashboard, drew AOIs and a TOI, scoped the comparison chart and exported the metrics.$q$),
    (v_s3, $q$How clear was the cloud-study upload and ingestion flow, and did the Tobii/Webcam source filter help?$q$, $q$Upload flow was straightforward. The Tobii/Webcam filter mattered less since I was uploading a new study rather than picking an existing one.$q$),
    (v_s3, $q$Did the Recordings and Participants pages give you the data-quality signals you needed?$q$, $q$Validity and consistency were clearly shown. Would prefer a direct link from a participant row to their recordings.$q$),
    (v_s3, $q$Walk me through creating and auto-tracking the AOI - what was easy, what fought you?$q$, $q$Drawing was fine; auto-track was tucked inside the three-dot menu, so I had to hunt for it.$q$),
    (v_s3, $q$Once tracked, was seeing the AOI on the scan-path overlay (and per-recording in the multi-recording view) clear?$q$, $q$Yes, the overlay was clean once the AOI layer was enabled.$q$),
    (v_s3, $q$How did you experience Times of Interest - defining one, then scoping analysis and the Comparison chart to it?$q$, $q$Defining a TOI on the timeline was intuitive. A shortcut from the study summary to start a new TOI would be nice.$q$),
    (v_s3, $q$Was the single global scope selector (All / AOI / TOI) a clear mental model, or confusing?$q$, $q$Clear once I used it the first time.$q$),
    (v_s3, $q$Comparing C10 vs A4: did the Comparison Overview and Detailed Metrics Comparison let you reach a conclusion confidently?$q$, $q$Reached A4 confidently, but the view showing only IDs instead of names slowed me down.$q$),
    (v_s3, $q$In the Metrics Explorer, was choosing a metric, a condition, an aggregation level, and an X axis intuitive across the different metric types (fixation, saccade direction, pupil mm, AOI, zone dwell)?$q$, $q$Mostly OK, a couple of axis labels were cut off in the strip plot.$q$),
    (v_s3, $q$Did the exported output match what you expected to receive, at the scope you set?$q$, $q$Yes.$q$),
    (v_s3, $q$Where did you slow down, backtrack, or feel unsure you'd done the right thing?$q$, $q$Choosing who to compare — it wasn't obvious I had to switch to a different page to pick them.$q$),
    (v_s3, $q$If you onboarded a new analyst, what is the one thing about BEHOLD they must know first?$q$, $q$Auto-track lives in the AOI three-dot menu — it's the strongest feature and the most hidden.$q$),

    -- Beatriz (paraphrasing Mariana's points, kept in Portuguese where she wrote in PT).
    (v_s4, $q$Describe the full path you took from a raw study ZIP to an exported, scoped result.$q$, $q$Carreguei o ZIP em Cloud Studies, esperei pelo ingestion, abri o dashboard, criei AOIs e TOIs, comparei participantes e exportei.$q$),
    (v_s4, $q$How clear was the cloud-study upload and ingestion flow, and did the Tobii/Webcam source filter help?$q$, $q$Upload muito claro. O filtro Tobii/Webcam ajudou a separar do que já estava lá.$q$),
    (v_s4, $q$Did the Recordings and Participants pages give you the data-quality signals you needed?$q$, $q$Sim. Faltava um link direto do participante para as gravações.$q$),
    (v_s4, $q$Walk me through creating and auto-tracking the AOI - what was easy, what fought you?$q$, $q$Demorei a perceber que o auto-track estava no menu dos três pontos.$q$),
    (v_s4, $q$Once tracked, was seeing the AOI on the scan-path overlay (and per-recording in the multi-recording view) clear?$q$, $q$Muito visual, percebi logo quando o olhar entrava na AOI.$q$),
    (v_s4, $q$How did you experience Times of Interest - defining one, then scoping analysis and the Comparison chart to it?$q$, $q$Intuitivo, mas seria útil ter um botão de análise logo a seguir a definir a TOI.$q$),
    (v_s4, $q$Was the single global scope selector (All / AOI / TOI) a clear mental model, or confusing?$q$, $q$O selector global é claro.$q$),
    (v_s4, $q$Comparing C10 vs A4: did the Comparison Overview and Detailed Metrics Comparison let you reach a conclusion confidently?$q$, $q$Cheguei à conclusão de A4. Pena mostrar IDs em vez do nome dos participantes.$q$),
    (v_s4, $q$In the Metrics Explorer, was choosing a metric, a condition, an aggregation level, and an X axis intuitive across the different metric types (fixation, saccade direction, pupil mm, AOI, zone dwell)?$q$, $q$Quase tudo certo, só o eixo Y às vezes corta os números.$q$),
    (v_s4, $q$Did the exported output match what you expected to receive, at the scope you set?$q$, $q$Sim, correspondeu ao scope.$q$),
    (v_s4, $q$Where did you slow down, backtrack, or feel unsure you'd done the right thing?$q$, $q$Na seleção dos participantes para comparar — perdi tempo a perceber para que página tinha de ir.$q$),
    (v_s4, $q$If you onboarded a new analyst, what is the one thing about BEHOLD they must know first?$q$, $q$Mostrar o auto-track no menu dos três pontos antes de qualquer coisa.$q$)
)
INSERT INTO interview_answers (session_id, question_id, answer_text)
SELECT ia.session_id, tq.id, ia.answer_text
  FROM ia
  JOIN template_questions tq
    ON tq.template_id = v_template
   AND tq.question_text = ia.question_text;

-- ── SUS answers ──
-- Tomás: 5,2,4,1,4,2,4,1,4,2  → SUS 82.5 (Good)
-- Beatriz: 4,2,4,2,4,2,4,2,5,2 → SUS 77.5 (Good)
INSERT INTO sus_answers (session_id, question_number, score) VALUES
  (v_s3,  1, 5), (v_s3, 2, 2), (v_s3,  3, 4), (v_s3,  4, 1), (v_s3,  5, 4),
  (v_s3,  6, 2), (v_s3, 7, 4), (v_s3,  8, 1), (v_s3,  9, 4), (v_s3, 10, 2),
  (v_s4,  1, 4), (v_s4, 2, 2), (v_s4,  3, 4), (v_s4,  4, 2), (v_s4,  5, 4),
  (v_s4,  6, 2), (v_s4, 7, 4), (v_s4,  8, 2), (v_s4,  9, 5), (v_s4, 10, 2);

END
$seed$;
