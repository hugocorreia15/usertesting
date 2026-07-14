-- ============================================================
-- Load-test seed — run in the Supabase SQL editor before testing
-- ============================================================
-- Creates a clearly-namespaced synthetic template ('[LOADTEST] …'),
-- three tasks (one practice), task/interview questions, and two shared
-- invitations:
--   loadtest1  — uncapped, shuffled order  (participant-journey)
--   loadspike1 — max_responses = 25, fixed (join-spike atomicity test)
--
-- Idempotent: re-running wipes previous load-test data first (only
-- rows namespaced [LOADTEST]/LT- — real study data is never touched).
-- Edit the email below if the template should belong to another account.

DO $$
DECLARE
  owner_id uuid;
  tpl_id   uuid;
  t_warm   uuid;
  t_find   uuid;
  t_pay    uuid;
BEGIN
  SELECT id INTO owner_id FROM auth.users WHERE email = 'hf.correya@gmail.com';
  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'Owner account not found — edit the email in loadtests/seed.sql';
  END IF;

  -- ── Reset previous load-test data (namespaced rows only) ──
  DELETE FROM test_sessions
   WHERE template_id IN (SELECT id FROM templates WHERE name LIKE '[LOADTEST]%');
  DELETE FROM participants
   WHERE user_id = owner_id AND name LIKE 'LT-%';
  DELETE FROM templates WHERE name LIKE '[LOADTEST]%';

  -- ── Template + tasks ──
  INSERT INTO templates (user_id, name, description, instruments)
  VALUES (owner_id, '[LOADTEST] Synthetic checkout',
          'Synthetic template created by loadtests/seed.sql — safe to delete.',
          '{sus}')
  RETURNING id INTO tpl_id;

  INSERT INTO template_tasks
    (template_id, sort_order, name, description, complexity,
     optimal_time_seconds, optimal_actions, is_practice)
  VALUES (tpl_id, 0, 'Warm-up: explore the store',
          'Practice task — excluded from metrics.', 'simple', 30, 3, true)
  RETURNING id INTO t_warm;

  INSERT INTO template_tasks
    (template_id, sort_order, name, description, complexity,
     optimal_time_seconds, optimal_actions, is_practice)
  VALUES (tpl_id, 1, 'Find a specific product',
          'Locate the blue backpack via search or categories.', 'simple', 45, 5, false)
  RETURNING id INTO t_find;

  INSERT INTO template_tasks
    (template_id, sort_order, name, description, complexity,
     optimal_time_seconds, optimal_actions, is_practice)
  VALUES (tpl_id, 2, 'Complete the checkout',
          'Add to cart and finish payment with the test card.', 'complex', 120, 12, false)
  RETURNING id INTO t_pay;

  -- ── Per-task questions (one rating, one open) ──
  INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max)
  VALUES (t_find, 0, 'How easy was finding the product?', 'rating', 1, 5),
         (t_pay,  0, 'Describe any friction during checkout.', 'open', NULL, NULL);

  -- ── Interview questions ──
  INSERT INTO template_questions (template_id, sort_order, question_text)
  VALUES (tpl_id, 0, 'What are your overall impressions?'),
         (tpl_id, 1, 'Would you use this product again?');

  -- ── Shared invitations ──
  INSERT INTO session_invitations
    (code, template_id, user_id, evaluator_name, selected_task_ids,
     collected_fields, task_order_strategy, max_responses)
  VALUES
    ('loadtest1',  tpl_id, owner_id, 'LOADTEST', ARRAY[t_warm, t_find, t_pay],
     '{name}', 'shuffled', NULL),
    ('loadspike1', tpl_id, owner_id, 'LOADTEST', ARRAY[t_warm, t_find, t_pay],
     '{name}', 'fixed', 25);

  RAISE NOTICE 'Load-test data seeded: template %, codes loadtest1 / loadspike1', tpl_id;
END $$;
