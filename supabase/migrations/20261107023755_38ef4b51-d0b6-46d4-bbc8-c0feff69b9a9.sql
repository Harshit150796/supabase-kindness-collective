-- Security review, Nov 7, 2026 (founder request).

-- 1) Functions meant for server code only. Earlier migrations closed them to PUBLIC and anon, but
--    Supabase also grants EXECUTE on every new public function to authenticated by default, so any
--    signed-in account could call them directly: public_fundraiser_coupons returned whole coupon rows
--    (gift card codes and PINs), admin_person any person's email and name, public_outside_gifts the
--    donor keys behind outside gifts, and _set_coupon_source_credit trusted a staff id the caller
--    passed in. The service role (edge functions, scheduled jobs) keeps them; security-definer
--    functions that call them internally are unaffected.
do $$
declare f regprocedure;
begin
  for f in select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
           where n.nspname = 'public' and p.proname in (
             'public_fundraiser_coupons', 'public_outside_gifts', 'admin_person', '_set_coupon_source_credit',
             'email_log_upsert', 'email_status', 'queue_outside_gift_events', 'purge_removed_conversations',
             'coupon_fundraiser', 'fundraiser_card', 'profile_row', 'is_blocked_pair', 'team_mfa_required') loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;

-- 2) has_completed_donation answers only about the signed-in person (the comment box asks "may I
--    post?") or for server code. Before, anyone could ask whether any account had given to any
--    fundraiser, anonymous gifts included.
create or replace function public.has_completed_donation(_fid uuid, _uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select _uid is not null
     and (_uid = auth.uid() or coalesce(auth.jwt() ->> 'role', '') = 'service_role')
     and exists (select 1 from public.donations
                 where fundraiser_id = _fid and donor_id = _uid and status in ('completed', 'succeeded'))
$$;
revoke all on function public.has_completed_donation(uuid, uuid) from public, anon;
grant execute on function public.has_completed_donation(uuid, uuid) to authenticated, service_role;

-- 3) Gold Coins change only through _gc_apply (October audit). The site only reads cards and
--    create-account makes them with the service role, so browsers get no write access at all, and the
--    first migration's catch-all rule goes if it is still there.
drop policy if exists "System can manage loyalty cards" on public.loyalty_cards;
revoke insert, update, delete on public.loyalty_cards from anon, authenticated;

-- 4) A password reset signs the account out everywhere, so a session someone else may hold ends
--    with it. Only verify-password-reset calls this, with the service role.
create or replace function public.svc_end_user_sessions(_uid uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  delete from auth.sessions where user_id = _uid;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.svc_end_user_sessions(uuid) from public, anon, authenticated;
grant execute on function public.svc_end_user_sessions(uuid) to service_role;
