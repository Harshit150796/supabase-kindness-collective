-- Security hardening from the October 2026 audit. Nothing here changes what the website does for
-- real people today; it removes ways to write data the site itself never writes.

-- 1) Donations are recorded only by the payment webhooks (service role). Browsers could insert a
--    "completed" donation of any amount for any fundraiser, which then showed in public totals.
drop policy if exists "Donors can insert donations" on public.donations;
revoke insert on public.donations from anon, authenticated;

-- 2) Fundraiser team rows: invites and acceptance happen in the fundraiser-actions function.
--    From the browser a row can only be revoked (organizer) or left (co-organizer). Before this,
--    anyone could move a row to another fundraiser and join its team.
drop policy if exists "Organizer invites" on public.fundraiser_team;
drop policy if exists "Organizer manages co-organizers" on public.fundraiser_team;
drop policy if exists "Co-organizer leaves" on public.fundraiser_team;
create policy "Organizer revokes co-organizers" on public.fundraiser_team for update to authenticated
  using (public.is_fundraiser_organizer(fundraiser_id, auth.uid()) and role = 'co_organizer')
  with check (public.is_fundraiser_organizer(fundraiser_id, auth.uid()) and role = 'co_organizer' and status = 'revoked');
create policy "Co-organizer leaves" on public.fundraiser_team for update to authenticated
  using (user_id = auth.uid() and role = 'co_organizer')
  with check (user_id = auth.uid() and role = 'co_organizer' and status = 'revoked');

create or replace function public.trg_fundraiser_team_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('anon', 'authenticated') and (
       new.fundraiser_id is distinct from old.fundraiser_id or new.user_id is distinct from old.user_id
    or new.role is distinct from old.role or new.invite_email is distinct from old.invite_email
    or new.invite_token_hash is distinct from old.invite_token_hash or new.invited_by is distinct from old.invited_by) then
    raise exception 'Team members can only be removed here' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists trg_fundraiser_team_guard on public.fundraiser_team;
create trigger trg_fundraiser_team_guard before update on public.fundraiser_team
  for each row execute function public.trg_fundraiser_team_guard();

-- 3) Fundraiser owners edit their story, goal, stores and settings. Review status, featured
--    placement, totals, the example flag, archiving and ownership are set only by the team's tools
--    (admin RPCs, the service role and staff accounts).
create or replace function public.trg_fundraiser_owner_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user not in ('anon', 'authenticated') then return new; end if;
  if auth.uid() is not null then
    if public.is_admin_staff(auth.uid()) then return new; end if;
  end if;
  if tg_op = 'INSERT' then
    new.amount_raised := 0;
    new.donors_count := 0;
    new.is_example := false;
    new.example_organizer := null;
    new.featured_order := null;
    new.archived_at := null;
    new.archived_by := null;
    new.rejection_reason := null;
    -- The approval gate (trg_fundraisers_approval_gate, which runs next) may still turn this into pending.
    if new.status is null or new.status not in ('pending', 'active') then new.status := 'pending'; end if;
  else
    new.status := old.status;
    new.amount_raised := old.amount_raised;
    new.donors_count := old.donors_count;
    new.is_example := old.is_example;
    new.example_organizer := old.example_organizer;
    new.featured_order := old.featured_order;
    new.archived_at := old.archived_at;
    new.archived_by := old.archived_by;
    new.rejection_reason := old.rejection_reason;
    new.user_id := old.user_id;
    new.unique_slug := old.unique_slug;
    new.created_at := old.created_at;
  end if;
  return new;
end $$;
drop trigger if exists trg_fundraiser_owner_guard on public.fundraisers;
create trigger trg_fundraiser_owner_guard before insert or update on public.fundraisers
  for each row execute function public.trg_fundraiser_owner_guard();

-- 4) The email on a profile row is used to send mail and to link guest gifts to an account, so
--    people can't change it (or move the row to another account) from the browser.
create or replace function public.trg_profile_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user not in ('anon', 'authenticated') then return new; end if;
  if auth.uid() is not null then
    if public.is_admin_staff(auth.uid()) then return new; end if;
  end if;
  new.email := old.email;
  new.user_id := old.user_id;
  new.created_at := old.created_at;
  return new;
end $$;
drop trigger if exists trg_profile_guard on public.profiles;
create trigger trg_profile_guard before update on public.profiles
  for each row execute function public.trg_profile_guard();

-- 5) Verification review fields are set by the team only; a person's own submission is pending.
create or replace function public.trg_verification_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user not in ('anon', 'authenticated') then return new; end if;
  if auth.uid() is not null then
    if public.is_admin_staff(auth.uid()) then return new; end if;
  end if;
  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.verified_at := null; new.verified_by := null;
    new.reviewed_at := null; new.reviewed_by := null;
    new.admin_notes := null;
  else
    new.status := old.status;
    new.verified_at := old.verified_at; new.verified_by := old.verified_by;
    new.reviewed_at := old.reviewed_at; new.reviewed_by := old.reviewed_by;
    new.admin_notes := old.admin_notes;
    new.user_id := old.user_id;
  end if;
  return new;
end $$;
drop trigger if exists trg_verification_guard on public.recipient_verifications;
create trigger trg_verification_guard before insert or update on public.recipient_verifications
  for each row execute function public.trg_verification_guard();

-- Applications are created by the team; the browser never inserts them.
drop policy if exists "Users submit own application" on public.recipient_applications;

-- 6) Gold Coins live in loyalty_cards.points_balance and change only through _gc_apply. The site
--    creates a card at sign-up but never edits one.
drop policy if exists "Users can update their own loyalty card" on public.loyalty_cards;
create or replace function public.trg_loyalty_card_guard() returns trigger
language plpgsql set search_path = public as $$
begin
  if current_user in ('anon', 'authenticated') then
    new.points_balance := 0;
    new.total_savings := 0;
    new.coupons_redeemed := 0;
  end if;
  return new;
end $$;
drop trigger if exists trg_loyalty_card_guard on public.loyalty_cards;
create trigger trg_loyalty_card_guard before insert on public.loyalty_cards
  for each row execute function public.trg_loyalty_card_guard();

-- Updates are posted through fundraiser-actions, which screens them for contact details and payment
-- handles; editing them straight from the browser skipped that check. The site never edits them.
drop policy if exists "Team edits updates" on public.fundraiser_updates;

-- 7) Legacy tables the browser never writes.
drop policy if exists "System can insert redemption history" on public.redemption_history;
drop policy if exists "Recipients can claim coupons" on public.coupon_claims;
-- Newsletter subscribers are added by sign-up (handle_new_user) and the team (admin_write), never
-- by an anonymous insert, which let anyone put any address on the mailing list.
drop policy if exists "Public can self-subscribe" on public.email_subscribers;
revoke insert on public.email_subscribers from anon;

-- 8) Shared-pool coupons: only people whose request the team approved can reserve one, from a
--    confirmed email, at most two a day and five waiting at a time. Every account has the recipient
--    role, so the role alone let any new account reserve and reveal every pool coupon. "Approved"
--    means a staff member approved the verification in Admin > Verifications (admin_write logs it
--    in admin_audit_log; a status set any other way, such as the February 2026 setup bulk approval
--    or a row someone edited before this migration, doesn't count), or a live request while
--    "Require approval before new fundraisers go live" is on. A lock per person makes claims sent
--    in parallel wait their turn, so the daily limit holds.
create or replace function public.claim_available_coupon(_coupon_id uuid) returns void
 language plpgsql security definer set search_path to 'public' as $$
declare _uid uuid := auth.uid();
begin
  if _uid is null or not public.has_role(_uid, 'recipient') then raise exception 'Not allowed'; end if;
  perform pg_advisory_xact_lock(hashtext('pool-claim:' || _uid::text));
  if not exists (select 1 from auth.users u where u.id = _uid and u.email_confirmed_at is not null) then
    raise exception 'Please confirm your email address first';
  end if;
  if not (
       exists (select 1 from public.recipient_verifications v
                where v.user_id = _uid and v.status::text = 'approved'
                  and exists (select 1 from public.admin_audit_log a
                                cross join lateral jsonb_array_elements(case when jsonb_typeof(a.after) = 'array' then a.after else '[]'::jsonb end) e
                               where a.action = 'recipient_verifications.update'
                                 and e->>'id' = v.id::text and e->>'status' = 'approved'))
    or (coalesce((select s.require_fundraiser_approval from public.admin_settings s where s.id = 1), false)
        and exists (select 1 from public.fundraisers f
                      where f.user_id = _uid and f.status in ('active', 'completed') and not f.is_example))
  ) then
    raise exception 'Shared coupons are for people whose request our team has approved';
  end if;
  if (select count(*) from public.coupons c where c.reserved_by = _uid and c.donation_id is null and c.reserved_at > now() - interval '1 day') >= 2 then
    raise exception 'You can claim up to 2 shared coupons a day';
  end if;
  if (select count(*) from public.coupons c where c.reserved_by = _uid and c.donation_id is null and c.status::text = 'reserved') >= 5 then
    raise exception 'Use the coupons you have before claiming more';
  end if;
  update public.coupons set status = 'reserved', reserved_by = _uid, reserved_at = now(), updated_at = now()
   where id = _coupon_id and status = 'available' and reserved_by is null and donation_id is null;
  if not found then raise exception 'That coupon is no longer available'; end if;
end $$;

-- 9) Storage buckets accept only the file types the site uses, set in the storage settings rather
--    than here: fundraiser-covers JPEG, PNG, WebP, GIF, HEIC/HEIF, MP4, QuickTime, WebM and 3GPP up
--    to 100 MB; cms-images and email-assets JPEG, PNG, WebP, GIF and AVIF up to 10 MB;
--    card-donations and coupon-receipts JPEG, PNG and WebP up to 5 MB. Without a type list a public
--    bucket would also host HTML or SVG files on the project's storage address.

-- 10) Browsers never need TRUNCATE, REFERENCES or TRIGGER on any table, and row-level security
--     does not cover TRUNCATE.
do $$
declare t record;
begin
  for t in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind in ('r', 'p') loop
    execute format('revoke truncate, references, trigger on public.%I from anon, authenticated', t.relname);
  end loop;
end $$;
alter default privileges in schema public revoke truncate, references, trigger on tables from anon, authenticated;

-- 11) New accounts join the mailing list once their address is confirmed, not when the account row
--     is created. An account opened through the sign-up API for someone else's address (which stays
--     unconfirmed) used to put that address on the list. Accounts made by create-account and Google
--     sign-ins are confirmed in the same transaction, so they still join right away.
create or replace function public.handle_new_user()
 returns trigger language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_name text := coalesce(nullif(new.raw_user_meta_data->>'full_name',''), nullif(new.raw_user_meta_data->>'name',''), '');
  v_src text := case when new.raw_app_meta_data->>'provider' = 'google' then 'google' else 'website_user' end;
begin
  begin
    insert into public.profiles (user_id, email, full_name)
    values (new.id, new.email, v_name)
    on conflict (user_id) do nothing;
  exception when others then
    raise warning 'handle_new_user profile insert failed for %: %', new.id, sqlerrm;
  end;
  begin
    insert into public.user_roles (user_id, role) values (new.id, 'donor') on conflict (user_id, role) do nothing;
    insert into public.user_roles (user_id, role) values (new.id, 'recipient') on conflict (user_id, role) do nothing;
  exception when others then null;
  end;
  begin
    if new.email is not null and new.email_confirmed_at is not null
       and not exists (select 1 from public.email_suppressions s where s.email = lower(new.email)) then
      insert into public.email_subscribers (email, name, source)
      values (lower(new.email), nullif(v_name,''), v_src)
      on conflict (email) do nothing;
    end if;
  exception when others then null;
  end;
  return new;
end;
$function$;

create or replace function public.handle_user_email_confirmed()
 returns trigger language plpgsql security definer set search_path to 'public'
as $function$
declare
  v_name text := coalesce(nullif(new.raw_user_meta_data->>'full_name',''), nullif(new.raw_user_meta_data->>'name',''), '');
  v_src text := case when new.raw_app_meta_data->>'provider' = 'google' then 'google' else 'website_user' end;
begin
  begin
    if new.email is not null
       and not exists (select 1 from public.email_suppressions s where s.email = lower(new.email)) then
      insert into public.email_subscribers (email, name, source)
      values (lower(new.email), nullif(v_name,''), v_src)
      on conflict (email) do nothing;
    end if;
  exception when others then null;
  end;
  return new;
end;
$function$;
drop trigger if exists on_auth_user_email_confirmed on auth.users;
create trigger on_auth_user_email_confirmed after update of email_confirmed_at on auth.users
  for each row when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function public.handle_user_email_confirmed();

-- 12) Request limits count and record in one locked step, so requests sent in parallel can't all
--     slip under a limit (the edge functions call this through _shared/rate-limit.ts and fall back
--     to the old two-step count if it is missing).
create or replace function public.rate_limit_take(_bucket text, _key_hash text, _max integer, _window_seconds integer)
 returns boolean language plpgsql security definer set search_path to 'public'
as $function$
declare n integer;
begin
  perform pg_advisory_xact_lock(hashtext('rate:' || _bucket || ':' || _key_hash));
  select count(*) into n from public.request_rate_limits
   where bucket = _bucket and key_hash = _key_hash and created_at >= now() - make_interval(secs => _window_seconds);
  if n >= _max then return false; end if;
  insert into public.request_rate_limits (bucket, key_hash) values (_bucket, _key_hash);
  return true;
end;
$function$;
revoke all on function public.rate_limit_take(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.rate_limit_take(text, text, integer, integer) to service_role;

-- 13) Sign-up codes allow five tries each. Each try is counted under a row lock before the code is
--     compared, so guesses sent all at once can't get more than five. A correct code stays usable
--     for 15 minutes so create-account can open the account (verify-otp calls this).
alter table public.otp_codes add column if not exists attempts integer not null default 0;
create or replace function public.otp_check(_emails text[], _code text)
 returns text language plpgsql security definer set search_path to 'public'
as $function$
declare tries integer; hit uuid;
begin
  -- Lock this address's live codes first, so a parallel check waits and then sees this one's count.
  perform 1 from public.otp_codes where email = any(_emails) and verified is not true and expires_at > now() for update;
  if not found then return 'missing'; end if;
  select coalesce(max(attempts), 0) into tries from public.otp_codes
   where email = any(_emails) and verified is not true and expires_at > now();
  if tries >= 5 then return 'locked'; end if;
  update public.otp_codes set attempts = attempts + 1
   where email = any(_emails) and verified is not true and expires_at > now();
  select id into hit from public.otp_codes
   where email = any(_emails) and verified is not true and expires_at > now() and code = _code
   limit 1;
  if hit is null then return 'wrong'; end if;
  update public.otp_codes set verified = true, expires_at = now() + interval '15 minutes' where id = hit;
  delete from public.otp_codes where email = any(_emails) and id <> hit;
  return 'ok';
end;
$function$;
revoke all on function public.otp_check(text[], text) from public, anon, authenticated;
grant execute on function public.otp_check(text[], text) to service_role;

-- 14) Addresses create-account is about to open an account for (only the service role writes it).
--     When the new website is published, a separate sign-up lock migration adds a trigger on
--     auth.users that lets an email account be created only for an address listed here in the last
--     ten minutes, so nobody can open accounts straight through the Supabase sign-up API.
create table if not exists public.allowed_signups (
  email text primary key,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.allowed_signups to service_role;
alter table public.allowed_signups enable row level security;
revoke all on public.allowed_signups from anon, authenticated;

-- The new trigger functions run only as triggers.
revoke all on function public.handle_user_email_confirmed() from public, anon, authenticated;
revoke all on function public.trg_fundraiser_team_guard() from public, anon, authenticated;
revoke all on function public.trg_fundraiser_owner_guard() from public, anon, authenticated;
revoke all on function public.trg_profile_guard() from public, anon, authenticated;
revoke all on function public.trg_verification_guard() from public, anon, authenticated;
revoke all on function public.trg_loyalty_card_guard() from public, anon, authenticated;
