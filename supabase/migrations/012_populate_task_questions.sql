-- ============================================================
-- 012 – Populate task questions for all templates
-- ============================================================

-- ── Mobile Banking App ──

-- Check account balance
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b2000000-0000-0000-0000-000000000001', 0, 'How easy was it to find your account balance?', 'rating', 1, 5);
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b2000000-0000-0000-0000-000000000001', 1, 'Where did you expect the balance to be displayed?', 'open');

-- Transfer money
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b2000000-0000-0000-0000-000000000002', 0, 'How confident did you feel during the transfer process?', 'rating', 1, 5);
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b2000000-0000-0000-0000-000000000002', 1, 'Was the confirmation step clear?', 'single_choice', '["Yes, very clear","Somewhat clear","Not clear at all"]');

-- Pay a bill
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b2000000-0000-0000-0000-000000000003', 0, 'Which payment method did you try to use?', 'single_choice', '["Credit card","Debit card","Bank transfer","Other"]');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b2000000-0000-0000-0000-000000000003', 1, 'Did you encounter any confusion during the payment flow?', 'open');

-- View transaction history
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b2000000-0000-0000-0000-000000000004', 0, 'Were you able to find the specific transaction you were looking for?', 'single_choice', '["Yes, easily","Yes, with some effort","No"]');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b2000000-0000-0000-0000-000000000004', 1, 'Which filters would you like to have available?', 'multiple_choice', '["Date range","Amount","Category","Recipient","Search by keyword"]');

-- Update personal info
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b2000000-0000-0000-0000-000000000005', 0, 'How easy was it to locate the personal info settings?', 'rating', 1, 5);
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b2000000-0000-0000-0000-000000000005', 1, 'Was the save/confirmation feedback adequate?', 'single_choice', '["Yes","No","Did not notice any"]');

-- Set up a recurring payment
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b2000000-0000-0000-0000-000000000006', 0, 'How intuitive was setting up the recurring payment?', 'rating', 1, 5);
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b2000000-0000-0000-0000-000000000006', 1, 'What frequency options did you expect to see?', 'multiple_choice', '["Daily","Weekly","Bi-weekly","Monthly","Quarterly","Yearly"]');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b2000000-0000-0000-0000-000000000006', 2, 'Any additional comments about this task?', 'open');


-- ── Bosch Seamless Panel Usability Test ──

-- S1: Wake Up the Panel
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b3000000-0000-0000-0000-000000000001', 0, 'How did you try to wake up the panel?', 'open');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b3000000-0000-0000-0000-000000000001', 1, 'Was the wake-up interaction intuitive?', 'rating', 1, 5);

-- S2: Identify Current Time
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b3000000-0000-0000-0000-000000000002', 0, 'Was the current time easy to read on the display?', 'single_choice', '["Very easy","Somewhat easy","Difficult"]');

-- S3: Identify All Buttons
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b3000000-0000-0000-0000-000000000003', 0, 'How many buttons did you identify?', 'open');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b3000000-0000-0000-0000-000000000003', 1, 'Were the button boundaries clear?', 'rating', 1, 5);

-- S4: Button Responsibilities
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b3000000-0000-0000-0000-000000000004', 0, 'Could you guess each button''s function before pressing it?', 'single_choice', '["All of them","Most of them","Some of them","None of them"]');

-- S5: Increase Temp +1°C
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b3000000-0000-0000-0000-000000000005', 0, 'How did you increase the temperature?', 'open');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b3000000-0000-0000-0000-000000000005', 1, 'Was the temperature change feedback visible enough?', 'rating', 1, 5);

-- S6: Return to Previous
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b3000000-0000-0000-0000-000000000006', 0, 'How did you return to the previous screen?', 'open');

-- S7: Turn Off Panel
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b3000000-0000-0000-0000-000000000007', 0, 'Was turning off the panel straightforward?', 'single_choice', '["Yes","No","I was unsure if it turned off"]');

-- C1: Set Temp to 40°C
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b3000000-0000-0000-0000-000000000008', 0, 'How easy was it to set the exact temperature?', 'rating', 1, 5);
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b3000000-0000-0000-0000-000000000008', 1, 'Did you use the buttons or a different method?', 'open');

-- C2: Change Clock to 08:30
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b3000000-0000-0000-0000-000000000009', 0, 'Was the clock setting process intuitive?', 'rating', 1, 5);
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b3000000-0000-0000-0000-000000000009', 1, 'What confused you most during this task?', 'open');

-- C3: Change Language
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b3000000-0000-0000-0000-000000000010', 0, 'How easy was it to find the language setting?', 'rating', 1, 5);
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b3000000-0000-0000-0000-000000000010', 1, 'Where did you expect to find this option?', 'single_choice', '["Main menu","Settings submenu","Long-press a button","Not sure"]');

-- C4: Explore Menu Structure
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b3000000-0000-0000-0000-000000000011', 0, 'How would you describe the menu structure?', 'single_choice', '["Very logical","Somewhat logical","Confusing","Very confusing"]');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b3000000-0000-0000-0000-000000000011', 1, 'Which menu items were hardest to find?', 'open');

-- C5: Set 35°C + Return
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b3000000-0000-0000-0000-000000000012', 0, 'Was returning to the main screen after setting 35°C easy?', 'rating', 1, 5);

-- C6: Check Device Info
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b3000000-0000-0000-0000-000000000013', 0, 'Did you find the device info section easily?', 'single_choice', '["Yes, first try","After some exploration","Could not find it"]');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b3000000-0000-0000-0000-000000000013', 1, 'What information did you expect to find there?', 'open');

-- C7: Error Recovery
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b3000000-0000-0000-0000-000000000014', 0, 'How did you attempt to recover from the error?', 'open');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b3000000-0000-0000-0000-000000000014', 1, 'Was the error message helpful?', 'single_choice', '["Very helpful","Somewhat helpful","Not helpful","There was no error message"]');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b3000000-0000-0000-0000-000000000014', 2, 'Rate the overall error recovery experience', 'rating', 1, 5);
