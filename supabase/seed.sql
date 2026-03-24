-- ============================================
-- SEED DATA FOR USABILITY TESTING APP
-- User: d213cf55-c734-4821-9f57-cec36a62a3b1
-- ============================================

-- ==================
-- TEMPLATE 1: E-commerce Checkout (PRIVATE)
-- ==================
INSERT INTO templates (id, name, description, user_id, is_public) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'E-commerce Checkout Flow', 'Usability test for the checkout process on our online store, covering product search through order confirmation.', 'd213cf55-c734-4821-9f57-cec36a62a3b1', false);

INSERT INTO task_groups (id, template_id, name, sort_order) VALUES
  ('a1100000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'Simple', 0),
  ('a1100000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'Complex', 1);

INSERT INTO template_tasks (id, template_id, group_id, sort_order, name, description, optimal_time_seconds, optimal_actions) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'a1100000-0000-0000-0000-000000000001', 0, 'Find a product', 'Use the search bar to find "wireless headphones" and open the product page.', 20, 3),
  ('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'a1100000-0000-0000-0000-000000000001', 1, 'Add to cart', 'Select size/color options and add the product to your cart.', 15, 4),
  ('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'a1100000-0000-0000-0000-000000000001', 2, 'Apply a discount code', 'Navigate to the cart and apply the code SAVE10.', 25, 5),
  ('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'a1100000-0000-0000-0000-000000000002', 3, 'Complete checkout', 'Fill in shipping details, select payment method, and place the order.', 90, 12),
  ('b1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'a1100000-0000-0000-0000-000000000002', 4, 'Track the order', 'After placing the order, find the order tracking page and verify the status.', 40, 6);

INSERT INTO template_error_types (id, template_id, code, label) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'E1', 'Navigation error'),
  ('c1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'E2', 'Input/form error'),
  ('c1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'E3', 'Misclick/wrong button'),
  ('c1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'E4', 'Comprehension error');

INSERT INTO template_questions (id, template_id, sort_order, question_text) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 0, 'How would you rate your overall experience with the checkout process?'),
  ('d1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 1, 'Was there any point where you felt confused or lost?'),
  ('d1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 2, 'What would you change about the checkout flow?');

-- ==================
-- TEMPLATE 2: Mobile Banking App (PUBLIC)
-- ==================
INSERT INTO templates (id, name, description, user_id, is_public) VALUES
  ('a1000000-0000-0000-0000-000000000002', 'Mobile Banking App', 'Usability evaluation of core banking tasks including transfers, bill payments, and account management.', 'd213cf55-c734-4821-9f57-cec36a62a3b1', true);

INSERT INTO task_groups (id, template_id, name, sort_order) VALUES
  ('a2200000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'Simple', 0),
  ('a2200000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'Complex', 1);

INSERT INTO template_tasks (id, template_id, group_id, sort_order, name, description, optimal_time_seconds, optimal_actions) VALUES
  ('b2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'a2200000-0000-0000-0000-000000000001', 0, 'Check account balance', 'Log in and find your current checking account balance.', 10, 2),
  ('b2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'a2200000-0000-0000-0000-000000000001', 1, 'Transfer money', 'Transfer €50 from checking to savings account.', 30, 6),
  ('b2000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'a2200000-0000-0000-0000-000000000002', 2, 'Pay a bill', 'Navigate to bill pay and schedule a payment of €120 to "Electric Company" for next Friday.', 60, 8),
  ('b2000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'a2200000-0000-0000-0000-000000000002', 3, 'View transaction history', 'Filter transaction history for the last 30 days and find the largest expense.', 35, 5),
  ('b2000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'a2200000-0000-0000-0000-000000000001', 4, 'Update personal info', 'Change your phone number in account settings.', 25, 5),
  ('b2000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000002', 'a2200000-0000-0000-0000-000000000002', 5, 'Set up a recurring payment', 'Create a monthly recurring payment of €30 to "Gym Membership".', 70, 10);

INSERT INTO template_error_types (id, template_id, code, label) VALUES
  ('c2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 'E1', 'Navigation error'),
  ('c2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'E2', 'Data entry error'),
  ('c2000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'E3', 'Wrong menu selected'),
  ('c2000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 'E4', 'Failed confirmation'),
  ('c2000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000002', 'E5', 'Timeout/delay confusion');

INSERT INTO template_questions (id, template_id, sort_order, question_text) VALUES
  ('d2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000002', 0, 'Did the app feel secure during your interactions?'),
  ('d2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 1, 'Which task was the most difficult and why?'),
  ('d2000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 2, 'Would you use this app for daily banking? Why or why not?'),
  ('d2000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002', 3, 'Any features you expected but did not find?');

-- ==================
-- PARTICIPANTS
-- ==================
INSERT INTO participants (id, name, email, age, gender, occupation, tech_proficiency, notes, user_id) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'Alice Martin', 'alice.martin@example.com', 28, 'Female', 'Graphic Designer', 'high', 'Frequent online shopper, comfortable with technology.', 'd213cf55-c734-4821-9f57-cec36a62a3b1'),
  ('e1000000-0000-0000-0000-000000000002', 'Bob Johnson', 'bob.johnson@example.com', 45, 'Male', 'Accountant', 'medium', 'Uses banking apps regularly, moderate tech skills.', 'd213cf55-c734-4821-9f57-cec36a62a3b1'),
  ('e1000000-0000-0000-0000-000000000003', 'Clara Rodriguez', 'clara.r@example.com', 62, 'Female', 'Retired Teacher', 'low', 'Limited experience with mobile apps. Needs larger text.', 'd213cf55-c734-4821-9f57-cec36a62a3b1'),
  ('e1000000-0000-0000-0000-000000000004', 'David Kim', 'david.kim@example.com', 22, 'Male', 'Computer Science Student', 'high', 'Very tech-savvy, early adopter.', 'd213cf55-c734-4821-9f57-cec36a62a3b1'),
  ('e1000000-0000-0000-0000-000000000005', 'Emma Wilson', 'emma.w@example.com', 35, 'Female', 'Marketing Manager', 'medium', 'Uses e-commerce platforms daily for work.', 'd213cf55-c734-4821-9f57-cec36a62a3b1');

-- ==================
-- SESSION 1: Completed — E-commerce + Alice
-- ==================
INSERT INTO test_sessions (id, template_id, participant_id, evaluator_name, status, started_at, completed_at, notes, user_id) VALUES
  ('f1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'Hugo Correia', 'completed', '2026-02-20 10:00:00+00', '2026-02-20 10:35:00+00', 'Participant was focused and completed tasks quickly.', 'd213cf55-c734-4821-9f57-cec36a62a3b1');

INSERT INTO task_results (id, session_id, task_id, completion_status, time_seconds, action_count, error_count, hesitation_count, seq_rating, notes) VALUES
  ('aa100000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'success', 18.3, 3, 0, 0, 7, 'Found product immediately via search.'),
  ('aa100000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'success', 12.7, 4, 0, 1, 6, 'Slight hesitation choosing color.'),
  ('aa100000-0000-0000-0000-000000000003', 'f1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 'success', 32.1, 6, 1, 1, 5, 'Took a moment to find the coupon field.'),
  ('aa100000-0000-0000-0000-000000000004', 'f1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000004', 'success', 85.4, 14, 2, 2, 4, 'Address autocomplete caused confusion. Re-entered zip code.'),
  ('aa100000-0000-0000-0000-000000000005', 'f1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000005', 'partial', 55.0, 8, 1, 3, 3, 'Found order page but could not locate real-time tracking link.');

INSERT INTO error_logs (task_result_id, error_type_id, timestamp_seconds, description) VALUES
  ('aa100000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 15.2, 'Scrolled past the coupon field and went to payment first.'),
  ('aa100000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000002', 42.0, 'Entered zip code in the city field.'),
  ('aa100000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000004', 61.5, 'Did not understand "billing same as shipping" checkbox.'),
  ('aa100000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001', 30.0, 'Clicked "Order History" instead of "Track Order".');

INSERT INTO hesitation_logs (task_result_id, timestamp_seconds, note) VALUES
  ('aa100000-0000-0000-0000-000000000002', 8.5, 'Paused while deciding between two colors.'),
  ('aa100000-0000-0000-0000-000000000003', 20.0, 'Looked around the page for the coupon input.'),
  ('aa100000-0000-0000-0000-000000000004', 38.0, 'Read the shipping options carefully, seemed uncertain.'),
  ('aa100000-0000-0000-0000-000000000004', 70.0, 'Paused before clicking "Place Order".'),
  ('aa100000-0000-0000-0000-000000000005', 12.0, 'Scanned the navigation bar looking for tracking.'),
  ('aa100000-0000-0000-0000-000000000005', 28.0, 'Opened account menu, hesitated between options.'),
  ('aa100000-0000-0000-0000-000000000005', 45.0, 'Tried the FAQ page before returning to orders.');

INSERT INTO interview_answers (session_id, question_id, answer_text) VALUES
  ('f1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'It was mostly smooth, but the checkout form felt a bit long. I''d rate it 7 out of 10.'),
  ('f1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002', 'Yes, when applying the discount code. The field was hidden below the fold and I almost missed it.'),
  ('f1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000003', 'Make the coupon field more prominent, and add a progress bar to the checkout steps.');

-- SUS answers for Session 1 (Alice — mostly positive, SUS ≈ 75)
INSERT INTO sus_answers (session_id, question_number, score) VALUES
  ('f1000000-0000-0000-0000-000000000001', 1, 4),
  ('f1000000-0000-0000-0000-000000000001', 2, 2),
  ('f1000000-0000-0000-0000-000000000001', 3, 4),
  ('f1000000-0000-0000-0000-000000000001', 4, 2),
  ('f1000000-0000-0000-0000-000000000001', 5, 4),
  ('f1000000-0000-0000-0000-000000000001', 6, 2),
  ('f1000000-0000-0000-0000-000000000001', 7, 4),
  ('f1000000-0000-0000-0000-000000000001', 8, 2),
  ('f1000000-0000-0000-0000-000000000001', 9, 3),
  ('f1000000-0000-0000-0000-000000000001', 10, 2);

-- ==================
-- SESSION 2: Completed — Mobile Banking + Bob
-- ==================
INSERT INTO test_sessions (id, template_id, participant_id, evaluator_name, status, started_at, completed_at, notes, user_id) VALUES
  ('f1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000002', 'Hugo Correia', 'completed', '2026-02-21 14:00:00+00', '2026-02-21 14:50:00+00', 'Participant struggled with recurring payments but handled basic tasks well.', 'd213cf55-c734-4821-9f57-cec36a62a3b1');

INSERT INTO task_results (id, session_id, task_id, completion_status, time_seconds, action_count, error_count, hesitation_count, seq_rating, notes) VALUES
  ('aa200000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000001', 'success', 8.5, 2, 0, 0, 7, 'Immediately found balance on home screen.'),
  ('aa200000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000002', 'success', 35.2, 7, 1, 1, 5, 'Initially tried to transfer from savings tab.'),
  ('aa200000-0000-0000-0000-000000000003', 'f1000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000003', 'success', 72.8, 10, 2, 2, 4, 'Date picker was confusing. Entered wrong date first.'),
  ('aa200000-0000-0000-0000-000000000004', 'f1000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000004', 'success', 28.4, 4, 0, 1, 6, 'Found filters quickly but took a moment to interpret the chart.'),
  ('aa200000-0000-0000-0000-000000000005', 'f1000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000005', 'success', 30.1, 6, 1, 0, 5, 'Settings menu was nested one level deep.'),
  ('aa200000-0000-0000-0000-000000000006', 'f1000000-0000-0000-0000-000000000002', 'b2000000-0000-0000-0000-000000000006', 'failure', 95.0, 14, 3, 4, 2, 'Could not find the recurring payment option. Gave up after multiple attempts.');

INSERT INTO error_logs (task_result_id, error_type_id, timestamp_seconds, description) VALUES
  ('aa200000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000003', 12.0, 'Went to savings tab instead of transfers.'),
  ('aa200000-0000-0000-0000-000000000003', 'c2000000-0000-0000-0000-000000000002', 35.0, 'Selected wrong date in the date picker.'),
  ('aa200000-0000-0000-0000-000000000003', 'c2000000-0000-0000-0000-000000000004', 58.0, 'Pressed confirm before verifying amount.'),
  ('aa200000-0000-0000-0000-000000000005', 'c2000000-0000-0000-0000-000000000001', 18.0, 'Looked in "Profile" instead of "Settings".'),
  ('aa200000-0000-0000-0000-000000000006', 'c2000000-0000-0000-0000-000000000001', 20.0, 'Opened bill pay instead of recurring payments.'),
  ('aa200000-0000-0000-0000-000000000006', 'c2000000-0000-0000-0000-000000000003', 50.0, 'Tried the "Scheduled" tab expecting recurring option.'),
  ('aa200000-0000-0000-0000-000000000006', 'c2000000-0000-0000-0000-000000000005', 80.0, 'App showed a loading spinner for 8 seconds, participant thought it froze.');

INSERT INTO hesitation_logs (task_result_id, timestamp_seconds, note) VALUES
  ('aa200000-0000-0000-0000-000000000002', 10.0, 'Looked at multiple tabs before starting transfer.'),
  ('aa200000-0000-0000-0000-000000000003', 25.0, 'Paused at the date picker, unsure how to use it.'),
  ('aa200000-0000-0000-0000-000000000003', 50.0, 'Re-read the amount field before confirming.'),
  ('aa200000-0000-0000-0000-000000000004', 15.0, 'Studied the chart legend before interpreting data.'),
  ('aa200000-0000-0000-0000-000000000006', 10.0, 'Scanned the main menu for a recurring option.'),
  ('aa200000-0000-0000-0000-000000000006', 40.0, 'Opened help section looking for instructions.'),
  ('aa200000-0000-0000-0000-000000000006', 65.0, 'Went back to home screen and tried again.'),
  ('aa200000-0000-0000-0000-000000000006', 85.0, 'Said "I don''t know where to find this" and paused.');

INSERT INTO interview_answers (session_id, question_id, answer_text) VALUES
  ('f1000000-0000-0000-0000-000000000002', 'd2000000-0000-0000-0000-000000000001', 'Yes, the login with fingerprint felt very secure. I liked the confirmation screens.'),
  ('f1000000-0000-0000-0000-000000000002', 'd2000000-0000-0000-0000-000000000002', 'Setting up the recurring payment was impossible. I could not find it anywhere.'),
  ('f1000000-0000-0000-0000-000000000002', 'd2000000-0000-0000-0000-000000000003', 'For checking balance and transfers, yes. But I would not trust it for complex tasks yet.'),
  ('f1000000-0000-0000-0000-000000000002', 'd2000000-0000-0000-0000-000000000004', 'A budgeting tool or spending summary would be nice.');

-- SUS answers for Session 2 (Bob — mixed experience, SUS ≈ 52.5)
INSERT INTO sus_answers (session_id, question_number, score) VALUES
  ('f1000000-0000-0000-0000-000000000002', 1, 3),
  ('f1000000-0000-0000-0000-000000000002', 2, 3),
  ('f1000000-0000-0000-0000-000000000002', 3, 3),
  ('f1000000-0000-0000-0000-000000000002', 4, 3),
  ('f1000000-0000-0000-0000-000000000002', 5, 4),
  ('f1000000-0000-0000-0000-000000000002', 6, 4),
  ('f1000000-0000-0000-0000-000000000002', 7, 3),
  ('f1000000-0000-0000-0000-000000000002', 8, 3),
  ('f1000000-0000-0000-0000-000000000002', 9, 2),
  ('f1000000-0000-0000-0000-000000000002', 10, 4);

-- ==================
-- SESSION 3: Planned — E-commerce + Emma
-- ==================
INSERT INTO test_sessions (id, template_id, participant_id, evaluator_name, status, notes, user_id) VALUES
  ('f1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000005', 'Hugo Correia', 'planned', 'Will use think-aloud protocol.', 'd213cf55-c734-4821-9f57-cec36a62a3b1');

INSERT INTO task_results (id, session_id, task_id) VALUES
  ('aa500000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001'),
  ('aa500000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000002'),
  ('aa500000-0000-0000-0000-000000000003', 'f1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000003'),
  ('aa500000-0000-0000-0000-000000000004', 'f1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000004'),
  ('aa500000-0000-0000-0000-000000000005', 'f1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000005');

INSERT INTO interview_answers (session_id, question_id) VALUES
  ('f1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000001'),
  ('f1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000002'),
  ('f1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000003');

-- ==================
-- TEMPLATE 3: Bosch Seamless Panel Usability Test (PUBLIC)
-- ==================
INSERT INTO templates (id, name, description, user_id, is_public) VALUES
  ('a1000000-0000-0000-0000-000000000003', 'Bosch Seamless Panel Usability Test', 'Observation sheet for usability testing of the Bosch Seamless Touch Panel water heater controller. Covers simple identification/control tasks (S1-S7) and complex multi-step tasks (C1-C7).', 'd213cf55-c734-4821-9f57-cec36a62a3b1', true);

INSERT INTO task_groups (id, template_id, name, sort_order) VALUES
  ('a3300000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'Simple', 0),
  ('a3300000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003', 'Complex', 1);

INSERT INTO template_tasks (id, template_id, group_id, sort_order, name, description, optimal_time_seconds, optimal_actions) VALUES
  ('b3000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'a3300000-0000-0000-0000-000000000001', 0, 'S1: Wake Up the Panel', 'Wake up the panel from standby/sleep mode.', NULL, 1),
  ('b3000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003', 'a3300000-0000-0000-0000-000000000001', 1, 'S2: Identify Current Time', 'Identify the current time displayed on the panel.', NULL, 0),
  ('b3000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'a3300000-0000-0000-0000-000000000001', 2, 'S3: Identify All Buttons', 'Identify all buttons/touch areas on the panel. Exploratory task — no fixed optimal action count.', NULL, NULL),
  ('b3000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000003', 'a3300000-0000-0000-0000-000000000001', 3, 'S4: Button Responsibilities', 'Describe what each button/touch area does.', NULL, 5),
  ('b3000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000003', 'a3300000-0000-0000-0000-000000000001', 4, 'S5: Increase Temp +1°C', 'Increase the temperature by exactly 1°C from the current setting.', NULL, 1),
  ('b3000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000003', 'a3300000-0000-0000-0000-000000000001', 5, 'S6: Return to Previous', 'Return to the previous screen or state.', NULL, 1),
  ('b3000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000003', 'a3300000-0000-0000-0000-000000000001', 6, 'S7: Turn Off Panel', 'Turn off the panel completely.', NULL, 1),
  ('b3000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000003', 'a3300000-0000-0000-0000-000000000002', 7, 'C1: Set Temp to 40°C', 'Set the water temperature to exactly 40°C. Optimal actions = 3 + delta-T (depends on current temp).', NULL, NULL),
  ('b3000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000003', 'a3300000-0000-0000-0000-000000000002', 8, 'C2: Change Clock to 08:30', 'Navigate to clock settings and change the time to 08:30. Approximately 8 optimal actions.', NULL, 8),
  ('b3000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000003', 'a3300000-0000-0000-0000-000000000002', 9, 'C3: Change Language', 'Navigate to settings and change the display language. Approximately 7 optimal actions.', NULL, 7),
  ('b3000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000003', 'a3300000-0000-0000-0000-000000000002', 10, 'C4: Explore Menu Structure', 'Explore and describe the full menu structure. Exploratory task — no fixed optimal action count.', NULL, NULL),
  ('b3000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000003', 'a3300000-0000-0000-0000-000000000002', 11, 'C5: Set 35°C + Return', 'Set temperature to 35°C and return to the home screen. Optimal actions = 5 + delta-T (depends on current temp).', NULL, NULL),
  ('b3000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000003', 'a3300000-0000-0000-0000-000000000002', 12, 'C6: Check Device Info', 'Navigate to device information/about screen.', NULL, 5),
  ('b3000000-0000-0000-0000-000000000014', 'a1000000-0000-0000-0000-000000000003', 'a3300000-0000-0000-0000-000000000002', 13, 'C7: Error Recovery', 'Recover from an error state or unexpected screen.', NULL, 3);

INSERT INTO template_error_types (id, template_id, code, label) VALUES
  ('c3000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 'WB', 'Wrong button'),
  ('c3000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003', 'WD', 'Wrong direction'),
  ('c3000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 'AE', 'Accidental menu entry'),
  ('c3000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000003', 'OV', 'Overshoot (past target value)');

INSERT INTO template_questions (id, template_id, sort_order, question_text) VALUES
  ('d3000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000003', 0, 'What was the most frustrating part of using this panel?'),
  ('d3000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000003', 1, 'Was there anything the panel did that surprised you or that you didn''t expect?'),
  ('d3000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000003', 2, 'If you could change one thing about this interface, what would it be?'),
  ('d3000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000003', 3, 'How would you compare this to a traditional physical-button water heater controller?');
