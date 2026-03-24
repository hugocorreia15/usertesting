-- ============================================================
-- 008 – Anonymization: collected fields + anonymous participants
-- ============================================================

-- 1. Add collected_fields to session_invitations
ALTER TABLE session_invitations
  ADD COLUMN collected_fields TEXT[] NOT NULL DEFAULT '{name,email,age,gender,occupation,tech_proficiency,notes}';

-- 2. Add is_anonymous flag to participants (anonymous participants hidden from list)
ALTER TABLE participants
  ADD COLUMN is_anonymous BOOLEAN NOT NULL DEFAULT false;
