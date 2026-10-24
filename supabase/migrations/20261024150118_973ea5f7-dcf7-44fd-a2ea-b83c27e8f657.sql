create table if not exists public.card_donations (
  id uuid primary key default gen_random_uuid(),
  donor_user_id uuid references auth.users(id) on delete set null,
  donor_name text,
  donor_email text,
  is_anonymous boolean not null default false,
  fundraiser_id uuid references public.fundraisers(id) on delete set null,
  store_name text not null check (length(store_name) between 1 and 60),
  card_type text not null check (card_type in ('gift_card', 'store_coupon', 'promo_code')),
  value numeric(10,2) check (value is null or (value > 0 and value <= 2000)),
  discount_text text check (discount_text is null or length(discount_text) <= 140),
  expires_on date,
  terms text check (terms is null or length(terms) <= 2000),
  note text check (note is null or length(note) <= 500),
  photo_path text,
  code_hint text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'withdrawn')),
  decline_reason text check (decline_reason is null or length(decline_reason) <= 300),
  accepted_value numeric(10,2),
  coupon_id uuid references public.coupons(id) on delete set null,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists card_donations_status_idx on public.card_donations (status, created_at desc);
create index if not exists card_donations_donor_idx on public.card_donations (donor_user_id, created_at desc);
alter table public.card_donations enable row level security;
create policy "Donors see their own donated cards" on public.card_donations
  for select to authenticated using (donor_user_id = auth.uid());
create policy "Team sees donated cards" on public.card_donations
  for select to authenticated using (public.is_admin_any(auth.uid()));
revoke all on public.card_donations from anon, authenticated;
grant select on public.card_donations to authenticated;
grant all on public.card_donations to service_role;

create table if not exists public.card_donation_secrets (
  card_donation_id uuid primary key references public.card_donations(id) on delete cascade,
  code text,
  pin text,
  redemption_url text
);
alter table public.card_donation_secrets enable row level security;
revoke all on public.card_donation_secrets from anon, authenticated;
grant all on public.card_donation_secrets to service_role;

create or replace function public.submit_card_donation(
  _store text, _type text, _value numeric, _discount text, _code text, _pin text, _url text,
  _expires date, _terms text, _note text, _photo_path text, _fundraiser uuid, _anon boolean)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare _uid uuid := auth.uid(); u record; f record; _id uuid; _c text := nullif(btrim(_code), ''); _u text := nullif(btrim(_url), '');
begin
  if _uid is null then raise exception 'Please sign in first'; end if;
  select email, email_confirmed_at, raw_user_meta_data into u from auth.users where id = _uid;
  if u.email_confirmed_at is null then raise exception 'Please confirm your email address first'; end if;
  if (select count(*) from card_donations where donor_user_id = _uid and created_at > now() - interval '1 day') >= 5 then
    raise exception 'You can donate up to 5 cards a day. Please try again tomorrow.';
  end if;
  if nullif(btrim(_store), '') is null or length(btrim(_store)) > 60 then raise exception 'Choose the store'; end if;
  if _type not in ('gift_card', 'store_coupon', 'promo_code') then raise exception 'Choose what kind of card it is'; end if;
  if _c is null and _u is null then raise exception 'Enter the code or the redemption link'; end if;
  if length(coalesce(_c, '')) > 200 or length(coalesce(_pin, '')) > 40 or length(coalesce(_u, '')) > 500 then raise exception 'That code looks too long'; end if;
  if _u is not null and _u !~* '^https://' then raise exception 'The redemption link must start with https://'; end if;
  if _type = 'gift_card' and (_value is null or _value <= 0) then raise exception 'Enter the balance on the card'; end if;
  if _value is not null and (_value <= 0 or _value > 2000) then raise exception 'Enter a balance between $1 and $2,000'; end if;
  if _expires is not null and _expires < current_date then raise exception 'This card has expired'; end if;
  if _photo_path is not null and _photo_path not like _uid::text || '/%' then raise exception 'Upload the photo again'; end if;
  if _fundraiser is not null then
    select id, user_id, status, is_example, archived_at into f from fundraisers where id = _fundraiser;
    if not found or f.status <> 'active' or f.is_example or f.archived_at is not null then raise exception 'That fundraiser isn''t open for gifts'; end if;
    if f.user_id = _uid then raise exception 'You can''t donate a card to your own fundraiser'; end if;
  end if;
  insert into card_donations (donor_user_id, donor_name, donor_email, is_anonymous, fundraiser_id, store_name, card_type, value,
    discount_text, expires_on, terms, note, photo_path, code_hint)
  values (_uid, coalesce(nullif(btrim(u.raw_user_meta_data->>'full_name'), ''), split_part(u.email, '@', 1)), lower(u.email), coalesce(_anon, false),
    _fundraiser, btrim(_store), _type, round(_value, 2), nullif(btrim(_discount), ''), _expires, nullif(btrim(_terms), ''), nullif(btrim(_note), ''),
    _photo_path, case when _c is not null then '•••• ' || right(regexp_replace(_c, '\s', '', 'g'), 4) else 'Link' end)
  returning id into _id;
  insert into card_donation_secrets (card_donation_id, code, pin, redemption_url) values (_id, _c, nullif(btrim(_pin), ''), _u);
  return _id;
end $$;
revoke all on function public.submit_card_donation(text,text,numeric,text,text,text,text,date,text,text,text,uuid,boolean) from public, anon;
grant execute on function public.submit_card_donation(text,text,numeric,text,text,text,text,date,text,text,text,uuid,boolean) to authenticated;

create or replace function public.withdraw_card_donation(_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  update card_donations set status = 'withdrawn' where id = _id and donor_user_id = auth.uid() and status = 'pending';
  if not found then raise exception 'This card can no longer be withdrawn'; end if;
  delete from card_donation_secrets where card_donation_id = _id;
end $$;
revoke all on function public.withdraw_card_donation(uuid) from public, anon;
grant execute on function public.withdraw_card_donation(uuid) to authenticated;

create or replace function public.admin_card_donation_secret(_id uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare s record;
begin
  if not public.is_admin_staff(auth.uid()) then raise exception 'Staff access required'; end if;
  select * into s from card_donation_secrets where card_donation_id = _id;
  if not found then raise exception 'No code on file'; end if;
  insert into admin_audit_log(actor_id, action, table_name, record_id) values (auth.uid(), 'card_donation.reveal', 'card_donations', _id::text);
  return jsonb_build_object('code', s.code, 'pin', s.pin, 'redemption_url', s.redemption_url);
end $$;
revoke all on function public.admin_card_donation_secret(uuid) from public, anon;
grant execute on function public.admin_card_donation_secret(uuid) to authenticated;

create or replace function public.admin_review_card_donation(_id uuid, _accept boolean, _value numeric, _reason text, _fundraiser uuid, _to_pool boolean)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare r record; s record; _target uuid; _v numeric; _cid uuid; _res jsonb;
begin
  if not public.is_admin_staff(auth.uid()) then raise exception 'Staff access required'; end if;
  select * into r from card_donations where id = _id for update;
  if not found or r.status <> 'pending' then raise exception 'This card has already been reviewed'; end if;
  if not _accept then
    if nullif(btrim(_reason), '') is null then raise exception 'Give the donor a reason'; end if;
    update card_donations set status = 'declined', decline_reason = btrim(_reason), reviewed_by = auth.uid(), reviewed_at = now() where id = _id;
    delete from card_donation_secrets where card_donation_id = _id;
    insert into admin_audit_log(actor_id, action, table_name, record_id, after)
    values (auth.uid(), 'card_donation.decline', 'card_donations', _id::text, jsonb_build_object('reason', btrim(_reason)));
    return jsonb_build_object('status', 'declined');
  end if;
  select * into s from card_donation_secrets where card_donation_id = _id;
  if not found then raise exception 'No code on file'; end if;
  _v := round(coalesce(_value, r.value), 2);
  if _v is null or _v <= 0 or _v > 2000 then raise exception 'Enter the value the team confirmed'; end if;
  _target := case when coalesce(_to_pool, false) then null else coalesce(_fundraiser, r.fundraiser_id) end;
  if _target is not null then
    _res := public.admin_add_outside_coupon(auth.uid(), _target, r.store_name, _v, null, s.code, s.pin, s.redemption_url, r.expires_on,
      r.terms, 'Donated card', r.donor_name, r.donor_email, r.donor_user_id, r.is_anonymous);
    _cid := (_res->>'coupon_id')::uuid;
  else
    insert into coupons (title, store_name, issued_brand, value, expected_value, code, code_pin, redemption_url, value_expires_on,
      recipient_instructions, credential_type, status)
    values ('$' || _v || ' ' || r.store_name || ' coupon (donated)', r.store_name, r.store_name, _v, _v, s.code, s.pin, s.redemption_url,
      r.expires_on, r.terms, case when s.code is null then 'prepaid_link' else 'code' end, 'in_stock')
    returning id into _cid;
  end if;
  update card_donations set status = 'accepted', accepted_value = _v, coupon_id = _cid, fundraiser_id = _target,
    reviewed_by = auth.uid(), reviewed_at = now() where id = _id;
  delete from card_donation_secrets where card_donation_id = _id;
  insert into admin_audit_log(actor_id, action, table_name, record_id, after)
  values (auth.uid(), 'card_donation.accept', 'card_donations', _id::text,
    jsonb_build_object('coupon_id', _cid, 'value', _v, 'fundraiser_id', _target, 'to_pool', _target is null));
  return jsonb_build_object('status', 'accepted', 'coupon_id', _cid, 'fundraiser_id', _target);
end $$;
revoke all on function public.admin_review_card_donation(uuid,boolean,numeric,text,uuid,boolean) from public, anon;
grant execute on function public.admin_review_card_donation(uuid,boolean,numeric,text,uuid,boolean) to authenticated;

create policy "Donors upload card photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'card-donations' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "Donors and team read card photos" on storage.objects for select to authenticated
  using (bucket_id = 'card-donations' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin_any(auth.uid())));

alter table public.legal_acceptances drop constraint if exists legal_acceptances_context_check;
alter table public.legal_acceptances add constraint legal_acceptances_context_check
  check (context in ('sign-up', 'sign-in', 'google', 'apply-account', 'fundraiser-submit', 'card-donation'));