create or replace function delete_own_account()
returns void
language sql
security definer
as $$
  delete from auth.users where id = auth.uid();
$$;
