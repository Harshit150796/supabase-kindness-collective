-- Two old public read functions the site no longer calls (get_recent_public_donations and
-- get_public_donation_stats) are closed to browsers; the service role keeps access.
do $$
declare f regprocedure;
begin
  for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
            where n.nspname = 'public' and p.proname in ('get_recent_public_donations', 'get_public_donation_stats') loop
    execute format('revoke execute on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;