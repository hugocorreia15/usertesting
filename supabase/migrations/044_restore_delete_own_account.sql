-- ============================================================
-- 044 – Restore delete_own_account (profile deletion broken)
-- ============================================================
-- Found by the org verification suite: the app's profile page calls
-- rpc('delete_own_account') (src/hooks/use-auth.tsx) but the function
-- from migration 004 does not exist in the live database — PostgREST
-- returns PGRST202 and account deletion fails. Recreated with the
-- current conventions (pinned search_path, explicit grants).

CREATE OR REPLACE FUNCTION delete_own_account()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM auth.users WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION delete_own_account() FROM public;
GRANT EXECUTE ON FUNCTION delete_own_account() TO authenticated;
