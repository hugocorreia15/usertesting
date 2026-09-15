-- ============================================================
-- 057 – A repository link on a group
-- ============================================================
-- A template can already carry the URL of the repository holding the system
-- under test. A group cannot, and a group is where a student team lives: one
-- team usually builds one product across several studies, so the link belongs
-- to the team at least as much as to any one study.
--
-- With it, the instructor's class view can reach a team's code from the same
-- row that shows the state of their study, which is the point of that view.
--
-- One nullable column. Writes are already limited to organization owners by
-- the group policies of migration 047, so no policy changes.

ALTER TABLE org_groups
  ADD COLUMN repo_url text;

COMMENT ON COLUMN org_groups.repo_url IS
  'Where the team''s code lives. Free text: any forge, not only GitHub.';
