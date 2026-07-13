-- ============================================================
-- 026 – Seed: BEHOLD Tobii Pro Glasses 3 post-hoc analysis template
-- ============================================================
-- Inserts one full template (groups, tasks, task questions,
-- error types, interview questions). Idempotent via ON CONFLICT.
-- The template is attributed to hf_correya@hotmail.com, falling back
-- to the oldest auth user if that email is not present.

DO $seed$
DECLARE
  v_user uuid := COALESCE(
    (SELECT id FROM auth.users WHERE email = 'hf_correya@hotmail.com' LIMIT 1),
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
  );
BEGIN

-- Clean slate: remove any prior version of this template (under the
-- original seed id or the current id). FK ON DELETE CASCADE clears all
-- groups, tasks, task questions, error types and interview questions,
-- so the inserts below always land under the current template id.
-- (Safe for a fresh seed; will error only if real sessions reference
--  these templates — none exist for this seed.)
DELETE FROM templates
 WHERE id IN (
   'aae00000-0000-0000-0000-000000000001',
   'a1000000-0000-0000-0000-000000000004'
 );

-- ── Template ──
INSERT INTO templates (id, name, description, user_id, is_public) VALUES (
  'a1000000-0000-0000-0000-000000000004',
  'BEHOLD — Tobii Pro Glasses 3 Post-hoc Analysis Usability Test',
  $d$Evaluate the post-hoc analysis journey for Tobii Pro Glasses 3 studies: from Study Setup uploading or selecting a cloud study ZIP, browsing Recordings and Participants, drawing/keyframing/auto-tracking AOIs and seeing them on the scan-path overlay, defining and scoping TOIs, comparing participants, reviewing Heatmap / Scan-path / Bee-swarm visualizations, exploring the Metrics Explorer, and producing an Export. Goal: confirm an analyst can go from a fresh study to exported, scoped results unaided.$d$,
  v_user,
  false
) ON CONFLICT (id) DO NOTHING;

-- ── Task groups ──
INSERT INTO task_groups (id, template_id, name, sort_order) VALUES
  ('aae10000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000004','Get a study into the dashboard',0),
  ('aae10000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000004','Browse the data',1),
  ('aae10000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','Areas of Interest (AOI)',2),
  ('aae10000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000004','Times of Interest (TOI)',3),
  ('aae10000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000004','Visualizations',4),
  ('aae10000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000004','Compare participants',5),
  ('aae10000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000004','Metrics Explorer',6),
  ('aae10000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000004','Export',7)
ON CONFLICT (id) DO NOTHING;

-- ── Tasks ──
INSERT INTO template_tasks (id, template_id, group_id, sort_order, name, description, optimal_time_seconds, optimal_actions) VALUES
  ('aae20000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000004','aae10000-0000-0000-0000-000000000001',0,'Upload or select a cloud study',$d$On Study Setup, open the Cloud Studies tab. Either upload a study ZIP and wait for ingestion to finish, or open an already-ingested cloud study. With the new source filter, set it to Tobii and confirm the study appears; confirm the Current Study alert shows it with a Cloud badge.$d$,60,4),
  ('aae20000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000004','aae10000-0000-0000-0000-000000000001',1,'Open the study dashboard and the Study Summary',$d$Use Go to Dashboard, then open Dashboard -> Study Summary and confirm participant / recording / media counts match expectations.$d$,30,3),
  ('aae20000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','aae10000-0000-0000-0000-000000000002',2,'Browse recordings and participants',$d$From the Analysis sidebar group open Recordings, inspect one recording's duration and validity rate, then open Participants and locate the same participant.$d$,50,4),
  ('aae20000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000004','aae10000-0000-0000-0000-000000000002',3,'Open a single participant''s detail',$d$Open the detail view for participant A4: review their session count, duration, validity and consistency, and note which recording(s) belong to them.$d$,40,3),
  ('aae20000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000004','aae10000-0000-0000-0000-000000000003',4,'Create an AOI and auto-track it',$d$Open Analysis -> AOI Editor for a recording. Draw an AOI over an object, keyframe it on at least two frames, then run AOI auto-track so it follows the object across the clip. Save the AOI and give it a tag/label.$d$,90,6),
  ('aae20000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000004','aae10000-0000-0000-0000-000000000003',5,'See the AOI on the scan-path overlay',$d$Open the Scan-path overlay for the same recording, enable the AOI layer so the AOI box/keyframes are drawn over the stimulus, and scrub the timeline to watch the scan path enter and leave the AOI.$d$,60,4),
  ('aae20000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000004','aae10000-0000-0000-0000-000000000003',6,'Multi-recording AOI overlay',$d$Open the Multi-recording overlay, pick two recordings, and apply a per-recording AOI filter so each tile shows only its own AOI(s). Confirm the filter on one tile does not change the other.$d$,60,4),
  ('aae20000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000004','aae10000-0000-0000-0000-000000000003',7,'Scope a visualization/metric to an AOI',$d$Using the global scope selector, switch the analysis from All data to a specific AOI and confirm fixation counts / charts update to that AOI only.$d$,45,3),
  ('aae20000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-000000000004','aae10000-0000-0000-0000-000000000004',8,'Create / annotate a TOI',$d$Open the TOI annotation panel for a recording, mark a start and an end on the timeline to define a Time of Interest (e.g. "task segment"), label it, and save it.$d$,75,5),
  ('aae20000-0000-0000-0000-000000000010','a1000000-0000-0000-0000-000000000004','aae10000-0000-0000-0000-000000000004',9,'Scope analysis to a TOI',$d$Using the global scope selector, switch from All data to the TOI you created, and confirm the fixation/saccade panels recompute for that window only.$d$,50,3),
  ('aae20000-0000-0000-0000-000000000011','a1000000-0000-0000-0000-000000000004','aae10000-0000-0000-0000-000000000004',10,'Compare whole-recording vs TOI in the Comparison chart',$d$Open the Comparison chart, set its scope to compare All data against a specific TOI (and, if offered, a specific AOI), and read how the metrics differ.$d$,60,4),
  ('aae20000-0000-0000-0000-000000000012','a1000000-0000-0000-0000-000000000004','aae10000-0000-0000-0000-000000000004',11,'Auto-track an AOI within a TOI window',$d$In the AutoTrack modal, switch the window source from manual start/end to a TOI and run auto-track only within that TOI segment.$d$,60,4),
  ('aae20000-0000-0000-0000-000000000013','a1000000-0000-0000-0000-000000000004','aae10000-0000-0000-0000-000000000005',12,'Compare heatmap, scan-path and bee-swarm',$d$Open the Heatmap / Density mode, switch to Scan-path, then Bee-swarm, and scope each to the AOI from C1 and/or the TOI from D1.$d$,75,5),
  ('aae20000-0000-0000-0000-000000000014','a1000000-0000-0000-0000-000000000004','aae10000-0000-0000-0000-000000000006',13,'Compare two participants (C10 vs A4)',$d$Open the participant comparison view, select participants C10 and A4, and review the Comparison Overview (Best Data Quality / Most Consistent / Most Active) and the Detailed Metrics Comparison (Sessions, Duration, Validity, Consistency, Samples, Efficiency).$d$,75,5),
  ('aae20000-0000-0000-0000-000000000015','a1000000-0000-0000-0000-000000000004','aae10000-0000-0000-0000-000000000006',14,'Add a third participant / change selection',$d$Change the comparison selection (swap A4 for another participant, or add a third) and confirm the overview "winners" and detailed rows update.$d$,40,3),
  ('aae20000-0000-0000-0000-000000000016','a1000000-0000-0000-0000-000000000004','aae10000-0000-0000-0000-000000000007',15,'Fixation metric by participant, scoped to an AOI',$d$Open Explorer -> Metrics Explorer. Pick average fixation duration (ms), add an AOI tag group condition, set aggregation to participant, leave X as None (strip plot), and read the result.$d$,75,5),
  ('aae20000-0000-0000-0000-000000000017','a1000000-0000-0000-0000-000000000004','aae10000-0000-0000-0000-000000000007',16,'Saccade direction (math convention)',$d$Choose a saccade direction metric and read how direction is expressed; note the angle convention used.$d$,50,3),
  ('aae20000-0000-0000-0000-000000000018','a1000000-0000-0000-0000-000000000004','aae10000-0000-0000-0000-000000000007',17,'Pupil diameter (mm)',$d$Select the pupil metric and confirm it is reported in millimetres; aggregate by recording.$d$,45,3),
  ('aae20000-0000-0000-0000-000000000019','a1000000-0000-0000-0000-000000000004','aae10000-0000-0000-0000-000000000007',18,'AOI metrics + participant variable',$d$Pick an AOI metric (e.g. AOI time-to-first-fixation or AOI revisit count), split by a participant variable (uploaded TSV / set in the UI), and switch aggregation between participant and recording.$d$,75,5),
  ('aae20000-0000-0000-0000-000000000020','a1000000-0000-0000-0000-000000000004','aae10000-0000-0000-0000-000000000007',19,'Zone dwell over time (X axis)',$d$Choose zone dwell (ms), set an X axis (e.g. a binned variable) so it renders as a series rather than a strip, and read the trend.$d$,50,3),
  ('aae20000-0000-0000-0000-000000000021','a1000000-0000-0000-0000-000000000004','aae10000-0000-0000-0000-000000000008',20,'Produce an export',$d$From Export -> Raw Data and Reports (or Visualizations), generate and download an export for the current study/recording, scoped (if offered) to the AOI or TOI.$d$,45,3)
ON CONFLICT (id) DO NOTHING;

-- ── Task questions ──
-- options is JSONB (single_choice). rating uses 1..5.
INSERT INTO task_questions (id, task_id, sort_order, question_text, question_type, options, rating_min, rating_max) VALUES
  -- A1
  ('aae30000-0000-0000-0000-000000000001','aae20000-0000-0000-0000-000000000001',0,$q$Was it clear which tab to use for a cloud (ZIP) study vs. a filesystem study?$q$,'single_choice','["Yes, immediately","Yes, after a brief look","Only after struggling","No, couldn''t"]'::jsonb,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000002','aae20000-0000-0000-0000-000000000001',1,$q$Did the Tobii / Webcam source filter help you find the right study?$q$,'single_choice','["Yes, a lot","Somewhat","Not really","Got in the way"]'::jsonb,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000003','aae20000-0000-0000-0000-000000000001',2,$q$Describe how you knew ingestion had completed and the study was ready.$q$,'open',NULL,NULL,NULL),
  -- A2
  ('aae30000-0000-0000-0000-000000000004','aae20000-0000-0000-0000-000000000002',0,$q$Rate how well the Study Summary oriented you to the dataset.$q$,'rating',NULL,1,5),
  ('aae30000-0000-0000-0000-000000000005','aae20000-0000-0000-0000-000000000002',1,$q$Take a screenshot of the Study Summary.$q$,'photo',NULL,NULL,NULL),
  -- B1
  ('aae30000-0000-0000-0000-000000000006','aae20000-0000-0000-0000-000000000003',0,$q$Could you tell whether a recording had good data quality (validity)?$q$,'single_choice','["Yes, confidently","Yes, but unsure","No"]'::jsonb,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000007','aae20000-0000-0000-0000-000000000003',1,$q$What did you expect to see on the Participants page that was or wasn't there?$q$,'open',NULL,NULL,NULL),
  -- B2
  ('aae30000-0000-0000-0000-000000000008','aae20000-0000-0000-0000-000000000004',0,$q$Was the per-participant breakdown (sessions, validity, consistency) easy to read?$q$,'rating',NULL,1,5),
  ('aae30000-0000-0000-0000-000000000009','aae20000-0000-0000-0000-000000000004',1,$q$Anything you expected on the participant detail that was missing?$q$,'open',NULL,NULL,NULL),
  -- C1
  ('aae30000-0000-0000-0000-000000000010','aae20000-0000-0000-0000-000000000005',0,$q$How confident were you that the AOI tracked the right object?$q$,'rating',NULL,1,5),
  ('aae30000-0000-0000-0000-000000000011','aae20000-0000-0000-0000-000000000005',1,$q$Was drawing and keyframing the AOI intuitive?$q$,'single_choice','["Yes, immediately","Yes, after a brief look","Only after struggling","No, couldn''t"]'::jsonb,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000012','aae20000-0000-0000-0000-000000000005',2,$q$Record the auto-track running and your reaction.$q$,'video',NULL,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000013','aae20000-0000-0000-0000-000000000005',3,$q$Describe anything that made AOI placement harder than expected.$q$,'open',NULL,NULL,NULL),
  -- C2
  ('aae30000-0000-0000-0000-000000000014','aae20000-0000-0000-0000-000000000006',0,$q$Was it obvious how to turn the AOI layer on over the scan path?$q$,'single_choice','["Yes, immediately","Yes, after a brief look","Only after struggling","No, couldn''t"]'::jsonb,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000015','aae20000-0000-0000-0000-000000000006',1,$q$Could you tell, visually, when gaze entered the AOI?$q$,'single_choice','["Yes, confidently","Yes, but unsure","No"]'::jsonb,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000016','aae20000-0000-0000-0000-000000000006',2,$q$Take a photo of the scan path with the AOI overlay visible.$q$,'photo',NULL,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000017','aae20000-0000-0000-0000-000000000006',3,$q$What would make the AOI-on-scan-path view clearer?$q$,'open',NULL,NULL,NULL),
  -- C3
  ('aae30000-0000-0000-0000-000000000018','aae20000-0000-0000-0000-000000000007',0,$q$Did you understand that the AOI filter is independent per recording?$q$,'single_choice','["Yes, immediately","Yes, after a brief look","Only after struggling","No, couldn''t"]'::jsonb,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000019','aae20000-0000-0000-0000-000000000007',1,$q$Rate how useful the side-by-side AOI comparison was.$q$,'rating',NULL,1,5),
  ('aae30000-0000-0000-0000-000000000020','aae20000-0000-0000-0000-000000000007',2,$q$Describe any confusion about which AOIs belong to which recording.$q$,'open',NULL,NULL,NULL),
  -- C4
  ('aae30000-0000-0000-0000-000000000021','aae20000-0000-0000-0000-000000000008',0,$q$Was the AOI scope selector discoverable?$q$,'single_choice','["Yes, immediately","Yes, after a brief look","Only after struggling","No, couldn''t"]'::jsonb,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000022','aae20000-0000-0000-0000-000000000008',1,$q$Did the numbers visibly change to reflect the AOI scope?$q$,'single_choice','["Exactly as expected","Mostly","Partially","Not at all"]'::jsonb,NULL,NULL),
  -- D1
  ('aae30000-0000-0000-0000-000000000023','aae20000-0000-0000-0000-000000000009',0,$q$Was defining a TOI start/end on the timeline intuitive?$q$,'single_choice','["Yes, immediately","Yes, after a brief look","Only after struggling","No, couldn''t"]'::jsonb,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000024','aae20000-0000-0000-0000-000000000009',1,$q$Rate how confident you were the TOI captured the segment you intended.$q$,'rating',NULL,1,5),
  ('aae30000-0000-0000-0000-000000000025','aae20000-0000-0000-0000-000000000009',2,$q$Record yourself creating the TOI and narrating what you expect.$q$,'video',NULL,NULL,NULL),
  -- D2
  ('aae30000-0000-0000-0000-000000000026','aae20000-0000-0000-0000-000000000010',0,$q$Was choosing a TOI as the analysis scope clear (vs. AOI vs. all)?$q$,'single_choice','["Yes, immediately","Yes, after a brief look","Only after struggling","No, couldn''t"]'::jsonb,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000027','aae20000-0000-0000-0000-000000000010',1,$q$Did the metrics clearly reflect only the TOI window?$q$,'single_choice','["Exactly as expected","Mostly","Partially","Not at all"]'::jsonb,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000028','aae20000-0000-0000-0000-000000000010',2,$q$What did you expect a TOI scope to change that it did/didn't?$q$,'open',NULL,NULL,NULL),
  -- D3
  ('aae30000-0000-0000-0000-000000000029','aae20000-0000-0000-0000-000000000011',0,$q$Was the Comparison chart's scope control (all / TOI / AOI) understandable?$q$,'single_choice','["Yes, immediately","Yes, after a brief look","Only after struggling","No, couldn''t"]'::jsonb,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000030','aae20000-0000-0000-0000-000000000011',1,$q$Rate how well the chart communicated the all-vs-TOI difference.$q$,'rating',NULL,1,5),
  ('aae30000-0000-0000-0000-000000000031','aae20000-0000-0000-0000-000000000011',2,$q$Take a photo of the all-vs-TOI comparison.$q$,'photo',NULL,NULL,NULL),
  -- D4
  ('aae30000-0000-0000-0000-000000000032','aae20000-0000-0000-0000-000000000012',0,$q$Was it clear you could drive auto-track by a TOI instead of manual start/end?$q$,'single_choice','["Yes, immediately","Yes, after a brief look","Only after struggling","No, couldn''t"]'::jsonb,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000033','aae20000-0000-0000-0000-000000000012',1,$q$Did limiting auto-track to the TOI behave as you expected?$q$,'open',NULL,NULL,NULL),
  -- E1
  ('aae30000-0000-0000-0000-000000000034','aae20000-0000-0000-0000-000000000013',0,$q$Which visualization best answered 'where did people look first?'$q$,'single_choice','["Heatmap / Density","Scan-path","Bee-swarm","None of them"]'::jsonb,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000035','aae20000-0000-0000-0000-000000000013',1,$q$Were the controls for switching visualization modes easy to find?$q$,'single_choice','["Yes, immediately","Yes, after a brief look","Only after struggling","No, couldn''t"]'::jsonb,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000036','aae20000-0000-0000-0000-000000000013',2,$q$Take a photo of the scan-path with the AOI scope applied.$q$,'photo',NULL,NULL,NULL),
  -- F1
  ('aae30000-0000-0000-0000-000000000037','aae20000-0000-0000-0000-000000000014',0,$q$Was selecting exactly two participants (C10 and A4) to compare straightforward?$q$,'single_choice','["Yes, immediately","Yes, after a brief look","Only after struggling","No, couldn''t"]'::jsonb,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000038','aae20000-0000-0000-0000-000000000014',1,$q$From the Comparison Overview, which participant looked stronger and on what?$q$,'open',NULL,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000039','aae20000-0000-0000-0000-000000000014',2,$q$Rate how clearly the Detailed Metrics Comparison let you contrast C10 vs A4.$q$,'rating',NULL,1,5),
  ('aae30000-0000-0000-0000-000000000040','aae20000-0000-0000-0000-000000000014',3,$q$Which metric (Validity, Consistency, Efficiency, ...) did you trust most for judging quality?$q$,'single_choice','["Validity","Consistency","Efficiency","Samples","Duration"]'::jsonb,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000041','aae20000-0000-0000-0000-000000000014',4,$q$Take a photo of the Comparison Overview for C10 vs A4.$q$,'photo',NULL,NULL,NULL),
  -- F2
  ('aae30000-0000-0000-0000-000000000042','aae20000-0000-0000-0000-000000000015',0,$q$Was changing who is being compared obvious and low-friction?$q$,'single_choice','["Yes, immediately","Yes, after a brief look","Only after struggling","No, couldn''t"]'::jsonb,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000043','aae20000-0000-0000-0000-000000000015',1,$q$Did the 'Best Data Quality / Most Consistent / Most Active' badges update sensibly?$q$,'single_choice','["Exactly as expected","Mostly","Partially","Not at all"]'::jsonb,NULL,NULL),
  -- G1
  ('aae30000-0000-0000-0000-000000000044','aae20000-0000-0000-0000-000000000016',0,$q$Was it clear how to choose a metric and add a condition?$q$,'single_choice','["Yes, immediately","Yes, after a brief look","Only after struggling","No, couldn''t"]'::jsonb,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000045','aae20000-0000-0000-0000-000000000016',1,$q$Rate how understandable the strip plot was.$q$,'rating',NULL,1,5),
  -- G2
  ('aae30000-0000-0000-0000-000000000046','aae20000-0000-0000-0000-000000000017',0,$q$Did you understand the saccade-direction convention without external help?$q$,'single_choice','["Yes, immediately","Yes, after a brief look","Only after struggling","No, couldn''t"]'::jsonb,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000047','aae20000-0000-0000-0000-000000000017',1,$q$What would make the direction metric easier to interpret?$q$,'open',NULL,NULL,NULL),
  -- G3
  ('aae30000-0000-0000-0000-000000000048','aae20000-0000-0000-0000-000000000018',0,$q$Was the pupil metric's unit (mm) obvious?$q$,'single_choice','["Yes, immediately","Yes, after a brief look","Only after struggling","No, couldn''t"]'::jsonb,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000049','aae20000-0000-0000-0000-000000000018',1,$q$Rate confidence that you read the pupil result correctly.$q$,'rating',NULL,1,5),
  -- G4
  ('aae30000-0000-0000-0000-000000000050','aae20000-0000-0000-0000-000000000019',0,$q$Was splitting by a participant variable discoverable?$q$,'single_choice','["Yes, immediately","Yes, after a brief look","Only after struggling","No, couldn''t"]'::jsonb,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000051','aae20000-0000-0000-0000-000000000019',1,$q$Did changing aggregation (participant vs recording) change the result the way you expected?$q$,'single_choice','["Exactly as expected","Mostly","Partially","Not at all"]'::jsonb,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000052','aae20000-0000-0000-0000-000000000019',2,$q$Which AOI metric did you most want that you couldn't find?$q$,'open',NULL,NULL,NULL),
  -- G5
  ('aae30000-0000-0000-0000-000000000053','aae20000-0000-0000-0000-000000000020',0,$q$Was the difference between strip (X = None) and a series (X set) clear?$q$,'single_choice','["Yes, immediately","Yes, after a brief look","Only after struggling","No, couldn''t"]'::jsonb,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000054','aae20000-0000-0000-0000-000000000020',1,$q$Narrate what the zone-dwell trend tells you.$q$,'audio',NULL,NULL,NULL),
  -- H1
  ('aae30000-0000-0000-0000-000000000055','aae20000-0000-0000-0000-000000000021',0,$q$Was it clear what would be included in the export (and at what scope)?$q$,'single_choice','["Yes, immediately","Yes, after a brief look","Only after struggling","No, couldn''t"]'::jsonb,NULL,NULL),
  ('aae30000-0000-0000-0000-000000000056','aae20000-0000-0000-0000-000000000021',1,$q$Rate how easy producing the export was.$q$,'rating',NULL,1,5),
  ('aae30000-0000-0000-0000-000000000057','aae20000-0000-0000-0000-000000000021',2,$q$Narrate the export step out loud.$q$,'audio',NULL,NULL,NULL)
ON CONFLICT (id) DO NOTHING;

-- ── Error types ──
INSERT INTO template_error_types (id, template_id, code, label) VALUES
  ('aae40000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000004','E1','Navigation error (lost in sidebar groups)'),
  ('aae40000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000004','E2','Wrong study selected or wrong tab/source filter (filesystem vs. cloud, Tobii vs. webcam)'),
  ('aae40000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','E3','Upload / ingestion not understood or failed'),
  ('aae40000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000004','E4','Could not interpret recording validity / data quality'),
  ('aae40000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000004','E5','Participant <-> recording mapping confusion'),
  ('aae40000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000004','E6','AOI mis-placed or wrong object selected'),
  ('aae40000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000004','E7','AOI keyframing not understood'),
  ('aae40000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000004','E8','AOI auto-track failed or drifted'),
  ('aae40000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-000000000004','E9','AOI layer not enabled / not visible on the scan-path overlay'),
  ('aae40000-0000-0000-0000-000000000010','a1000000-0000-0000-0000-000000000004','E10','Multi-recording AOI filter applied to the wrong tile / thought it was global'),
  ('aae40000-0000-0000-0000-000000000011','a1000000-0000-0000-0000-000000000004','E11','TOI start/end set incorrectly or not saved'),
  ('aae40000-0000-0000-0000-000000000012','a1000000-0000-0000-0000-000000000004','E12','TOI vs AOI vs All scope confusion (global scope selector)'),
  ('aae40000-0000-0000-0000-000000000013','a1000000-0000-0000-0000-000000000004','E13','AutoTrack TOI-window option not discovered'),
  ('aae40000-0000-0000-0000-000000000014','a1000000-0000-0000-0000-000000000004','E14','Wrong visualization mode chosen for the question'),
  ('aae40000-0000-0000-0000-000000000015','a1000000-0000-0000-0000-000000000004','E15','Could not select exactly the two participants to compare (C10 / A4)'),
  ('aae40000-0000-0000-0000-000000000016','a1000000-0000-0000-0000-000000000004','E16','Misread the Comparison Overview / Detailed Metrics Comparison'),
  ('aae40000-0000-0000-0000-000000000017','a1000000-0000-0000-0000-000000000004','E17','Metric / condition / aggregation selection error in Metrics Explorer'),
  ('aae40000-0000-0000-0000-000000000018','a1000000-0000-0000-0000-000000000004','E18','Misread the metric result (strip plot vs series, units e.g. mm)'),
  ('aae40000-0000-0000-0000-000000000019','a1000000-0000-0000-0000-000000000004','E19','Export failed or produced the wrong scope/contents')
ON CONFLICT (id) DO NOTHING;

-- ── Interview questions ──
INSERT INTO template_questions (id, template_id, sort_order, question_text) VALUES
  ('aae50000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000004',0,$q$Describe the full path you took from a raw study ZIP to an exported, scoped result.$q$),
  ('aae50000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000004',1,$q$How clear was the cloud-study upload and ingestion flow, and did the Tobii/Webcam source filter help?$q$),
  ('aae50000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004',2,$q$Did the Recordings and Participants pages give you the data-quality signals you needed?$q$),
  ('aae50000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000004',3,$q$Walk me through creating and auto-tracking the AOI - what was easy, what fought you?$q$),
  ('aae50000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000004',4,$q$Once tracked, was seeing the AOI on the scan-path overlay (and per-recording in the multi-recording view) clear?$q$),
  ('aae50000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000004',5,$q$How did you experience Times of Interest - defining one, then scoping analysis and the Comparison chart to it?$q$),
  ('aae50000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000004',6,$q$Was the single global scope selector (All / AOI / TOI) a clear mental model, or confusing?$q$),
  ('aae50000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000004',7,$q$Comparing C10 vs A4: did the Comparison Overview and Detailed Metrics Comparison let you reach a conclusion confidently?$q$),
  ('aae50000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-000000000004',8,$q$In the Metrics Explorer, was choosing a metric, a condition, an aggregation level, and an X axis intuitive across the different metric types (fixation, saccade direction, pupil mm, AOI, zone dwell)?$q$),
  ('aae50000-0000-0000-0000-000000000010','a1000000-0000-0000-0000-000000000004',9,$q$Did the exported output match what you expected to receive, at the scope you set?$q$),
  ('aae50000-0000-0000-0000-000000000011','a1000000-0000-0000-0000-000000000004',10,$q$Where did you slow down, backtrack, or feel unsure you'd done the right thing?$q$),
  ('aae50000-0000-0000-0000-000000000012','a1000000-0000-0000-0000-000000000004',11,$q$If you onboarded a new analyst, what is the one thing about BEHOLD they must know first?$q$)
ON CONFLICT (id) DO NOTHING;

-- ── Participant fields ──
-- Source: participant_report_labels.md § "Recommended custom labels
-- (a) Captured custom attributes". Defaults (Name..Notes) are the
-- product's fixed participant form; computed labels (b) are derived
-- metrics, not collected fields — so only the study-defined custom
-- attributes are seeded here. Requires migration 025.
INSERT INTO template_participant_fields (id, template_id, label, field_type, options, sort_order) VALUES
  ('aae60000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000004','Handedness','select','["Left","Right","Ambidextrous"]'::jsonb,0),
  ('aae60000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000004','Vision correction','select','["None","Glasses","Contacts"]'::jsonb,1),
  ('aae60000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','First language','text',NULL,2),
  ('aae60000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000004','Condition / Group','text',NULL,3),
  ('aae60000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000004','Device','select','["Tobii","Webcam","Screen"]'::jsonb,4),
  ('aae60000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000004','Location','select','["Lab","Remote","Field"]'::jsonb,5),
  ('aae60000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000004','Consent ref','text',NULL,6)
ON CONFLICT (id) DO NOTHING;

END
$seed$;
