-- ============================================================
-- 011 – Media answer types (audio, video, photo)
-- ============================================================

-- 1. Expand question_type check to include media types
ALTER TABLE task_questions DROP CONSTRAINT task_questions_question_type_check;
ALTER TABLE task_questions ADD CONSTRAINT task_questions_question_type_check
  CHECK (question_type IN ('open', 'single_choice', 'multiple_choice', 'rating', 'audio', 'video', 'photo'));

-- 2. Add media_url column to task_question_answers
ALTER TABLE task_question_answers ADD COLUMN media_url TEXT;

-- 3. Create storage bucket for session media
INSERT INTO storage.buckets (id, name, public)
VALUES ('session-media', 'session-media', true)
ON CONFLICT (id) DO NOTHING;

-- Authenticated users can upload media to their own folder
CREATE POLICY "Users can upload session media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'session-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update session media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'session-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete session media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'session-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read access (bucket is public)
CREATE POLICY "Anyone can view session media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'session-media');

-- Anon can upload media for join flow (stored under evaluator's user_id folder)
CREATE POLICY "Anon can upload session media via invitation"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (
    bucket_id = 'session-media'
    AND EXISTS (
      SELECT 1 FROM session_invitations si
      WHERE si.user_id::text = (storage.foldername(name))[1]
        AND si.is_active = true
    )
  );
