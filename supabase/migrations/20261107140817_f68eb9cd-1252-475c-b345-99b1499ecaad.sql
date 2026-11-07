-- Guest card donations (founder request, Nov 7, 2026): anyone can donate a card without an account, and
-- can stay anonymous. Guests submit through the public-submit edge function (limits per network, per
-- email and for the whole site); signed-in donors keep using submit_card_donation.

-- The version of the Terms the donor agreed to (guests have no account to record it on).
alter table public.card_donations add column if not exists terms_version text
  check (terms_version is null or length(terms_version) <= 20);

-- One set of checks and one insert for both paths. Service role only: submit_card_donation (signed in)
-- and public-submit (guests, _uid null) call it.
create or replace function public._card_donation_insert(
  _uid uuid, _name text, _email text, _anon boolean, _terms_version text,
  _store text, _type text, _value numeric, _discount text, _code text, _pin text, _url text,
  _expires date, _terms text, _note text, _photo_path text, _fundraiser uuid)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare f record; _id uuid; _c text := nullif(btrim(_code), ''); _u text := nullif(btrim(_url), '');
  _e text := lower(nullif(btrim(_email), ''));
begin
  if nullif(btrim(_store), '') is null or length(btrim(_store)) > 60 then raise exception 'Choose the store'; end if;
  if _type not in ('gift_card', 'store_coupon', 'promo_code') then raise exception 'Choose what kind of card it is'; end if;
  if _c is null and _u is null then raise exception 'Enter the code or the redemption link'; end if;
  if length(coalesce(_c, '')) > 200 or length(coalesce(_pin, '')) > 40 or length(coalesce(_u, '')) > 500 then raise exception 'That code looks too long'; end if;
  if _u is not null and _u !~* '^https://' then raise exception 'The redemption link must start with https://'; end if;
  if _type = 'gift_card' and (_value is null or _value <= 0) then raise exception 'Enter the balance on the card'; end if;
  if _value is not null and (_value <= 0 or _value > 2000) then raise exception 'Enter a balance between $1 and $2,000'; end if;
  if _expires is not null and _expires < current_date then raise exception 'This card has expired'; end if;
  if _e is not null and _e !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Enter a valid email address, or leave it blank'; end if;
  if length(coalesce(btrim(_name), '')) > 120 then raise exception 'That name is too long'; end if;
  -- A signed-in donor's screenshot sits in their own folder; a guest's in guest/, uploaded through a link public-submit made.
  if _photo_path is not null and _photo_path not like coalesce(_uid::text, 'guest') || '/%' then raise exception 'Upload the photo again'; end if;
  if _fundraiser is not null then
    select id, user_id, status, is_example, archived_at into f from fundraisers where id = _fundraiser;
    if not found or f.status <> 'active' or f.is_example or f.archived_at is not null then raise exception 'That fundraiser isn''t open for gifts'; end if;
    if _uid is not null and f.user_id = _uid then raise exception 'You can''t donate a card to your own fundraiser'; end if;
  end if;
  insert into card_donations (donor_user_id, donor_name, donor_email, is_anonymous, terms_version, fundraiser_id, store_name, card_type, value,
    discount_text, expires_on, terms, note, photo_path, code_hint)
  values (_uid, nullif(btrim(_name), ''), _e, coalesce(_anon, false) or (_uid is null and nullif(btrim(_name), '') is null),
    nullif(btrim(_terms_version), ''), _fundraiser, btrim(_store), _type, round(_value, 2), nullif(btrim(_discount), ''), _expires,
    nullif(btrim(_terms), ''), nullif(btrim(_note), ''), _photo_path,
    case when _c is not null then '•••• ' || right(regexp_replace(_c, '\s', '', 'g'), 4) else 'Link' end)
  returning id into _id;
  insert into card_donation_secrets (card_donation_id, code, pin, redemption_url) values (_id, _c, nullif(btrim(_pin), ''), _u);
  return _id;
end $$;
revoke all on function public._card_donation_insert(uuid,text,text,boolean,text,text,text,numeric,text,text,text,text,date,text,text,text,uuid) from public, anon, authenticated;
grant execute on function public._card_donation_insert(uuid,text,text,boolean,text,text,text,numeric,text,text,text,text,date,text,text,text,uuid) to service_role;

-- Signed-in donors: same checks as before (confirmed email, 5 cards a day), then the shared insert.
-- Its grants (authenticated only) are unchanged.
create or replace function public.submit_card_donation(
  _store text, _type text, _value numeric, _discount text, _code text, _pin text, _url text,
  _expires date, _terms text, _note text, _photo_path text, _fundraiser uuid, _anon boolean)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare _uid uuid := auth.uid(); u record;
begin
  if _uid is null then raise exception 'Please sign in first'; end if;
  select email, email_confirmed_at, raw_user_meta_data into u from auth.users where id = _uid;
  if u.email_confirmed_at is null then raise exception 'Please confirm your email address first'; end if;
  if (select count(*) from card_donations where donor_user_id = _uid and created_at > now() - interval '1 day') >= 5 then
    raise exception 'You can donate up to 5 cards a day. Please try again tomorrow.';
  end if;
  return public._card_donation_insert(_uid, coalesce(nullif(btrim(u.raw_user_meta_data->>'full_name'), ''), split_part(u.email, '@', 1)),
    u.email, _anon, null, _store, _type, _value, _discount, _code, _pin, _url, _expires, _terms, _note, _photo_path, _fundraiser);
end $$;