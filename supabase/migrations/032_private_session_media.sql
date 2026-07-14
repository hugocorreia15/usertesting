-- ============================================================
-- 032 – Make session media private (signed URLs) + fix upload RLS
-- ============================================================
-- The session-media bucket was public: every participant photo, video,
-- and audio answer was permanently accessible to anyone holding the URL.
-- This migration
--   1. flips the bucket private (clients now render via short-lived
--      signed URLs),
--   2. converts stored public URLs in task_question_answers.media_url
--      into bucket-relative paths (the app now stores paths),
--   3. replaces the public SELECT policy with scoped ones so signed
--      URLs can be created by the evaluator (own folder) and by anon
--      participants (folders of evaluators with join-code sessions —
--      the path's unguessable UUIDs are the capability, and signed
--      links expire instead of living forever),
--   4. re-bases the anon INSERT policy on join-code sessions instead of
--      is_active invitations: personal links deactivate on join (031),
--      which silently broke participant media uploads mid-session.

-- ── 1. Private bucket ──
UPDATE storage.buckets SET public = false WHERE id = 'session-media';

-- ── 2. Stored URLs → paths ──
UPDATE task_question_answers
   SET media_url = regexp_replace(media_url, '^.*/object/public/session-media/', '')
 WHERE media_url LIKE '%/object/public/session-media/%';

-- ── 3. SELECT policies (needed to create signed URLs) ──
DROP POLICY IF EXISTS "Anyone can view session media" ON storage.objects;

CREATE POLICY "Evaluators can read own session media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'session-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Anon can read media for join-code sessions"
  ON storage.objects FOR SELECT
  TO anon
  USING (
    bucket_id = 'session-media'
    AND (storage.foldername(name))[1] IN (
      SELECT ts.user_id::text FROM test_sessions ts
      WHERE ts.join_code IS NOT NULL
    )
  );

-- ── 4. Anon INSERT re-based on join-code sessions ──
DROP POLICY IF EXISTS "Anon can upload session media via invitation" ON storage.objects;

CREATE POLICY "Anon can upload media for join-code sessions"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (
    bucket_id = 'session-media'
    AND (storage.foldername(name))[1] IN (
      SELECT ts.user_id::text FROM test_sessions ts
      WHERE ts.join_code IS NOT NULL
    )
  );
