-- ============================================================
-- 014 – E-commerce Checkout Flow: task questions with media types
-- ============================================================

-- Find a product
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b1000000-0000-0000-0000-000000000001', 0, 'How easy was it to find the product you were looking for?', 'rating', 1, 5);
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b1000000-0000-0000-0000-000000000001', 1, 'Record your thoughts on the search experience', 'audio');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b1000000-0000-0000-0000-000000000001', 2, 'Take a photo of where you got stuck (if applicable)', 'photo');

-- Add to cart
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b1000000-0000-0000-0000-000000000002', 0, 'Was the "Add to Cart" button easy to find?', 'single_choice', '["Very easy","Somewhat easy","Difficult","Could not find it"]');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b1000000-0000-0000-0000-000000000002', 1, 'Show us how you added the product to the cart', 'video');

-- Apply a discount code
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b1000000-0000-0000-0000-000000000003', 0, 'Describe any issues you had applying the discount code', 'open');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b1000000-0000-0000-0000-000000000003', 1, 'Take a screenshot of the discount applied (or error)', 'photo');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b1000000-0000-0000-0000-000000000003', 2, 'Rate the clarity of the discount feedback', 'rating', 1, 5);

-- Complete checkout
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b1000000-0000-0000-0000-000000000004', 0, 'Which payment method did you use?', 'single_choice', '["Credit card","PayPal","Apple Pay","Google Pay","Other"]');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, options) VALUES
  ('b1000000-0000-0000-0000-000000000004', 1, 'Which steps felt unnecessary?', 'multiple_choice', '["Address entry","Payment details","Review page","Account creation","Email verification"]');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b1000000-0000-0000-0000-000000000004', 2, 'Record a quick summary of the checkout experience', 'audio');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b1000000-0000-0000-0000-000000000004', 3, 'Record a video walkthrough of the final confirmation page', 'video');

-- Track the order
INSERT INTO task_questions (task_id, sort_order, question_text, question_type, rating_min, rating_max) VALUES
  ('b1000000-0000-0000-0000-000000000005', 0, 'How easy was it to find the order tracking page?', 'rating', 1, 5);
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b1000000-0000-0000-0000-000000000005', 1, 'Take a photo of the tracking information displayed', 'photo');
INSERT INTO task_questions (task_id, sort_order, question_text, question_type) VALUES
  ('b1000000-0000-0000-0000-000000000005', 2, 'Any final thoughts on the overall experience?', 'audio');
