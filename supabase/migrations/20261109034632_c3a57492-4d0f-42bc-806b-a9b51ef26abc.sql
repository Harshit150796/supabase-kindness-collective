-- Homepage lineup (founder request, Nov 9, 2026): in Admin → Homepage the team chooses which open
-- campaigns lead "Fundraisers open now" on the homepage, in what order, and which are hidden from it.
-- Placed campaigns come first in the homepage's Trending view; every other open campaign follows in the
-- site's ranked order; hidden ones never show on the homepage (they stay on /stories and their own page).

create table if not exists public.homepage_placements (
  fundraiser_id uuid primary key references public.fundraisers(id) on delete cascade,
  position integer check (position is null or position between 1 and 500),
  hidden boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  -- A row either places a campaign or hides it, never both.
  constraint homepage_placements_one_choice check ((position is not null) <> hidden)
);
create unique index if not exists homepage_placements_position_key on public.homepage_placements (position) where position is not null;

-- Visitors read which campaigns are placed or hidden (not who changed it); only admin_set_homepage_lineup writes.
revoke all on public.homepage_placements from public, anon, authenticated;
grant select (fundraiser_id, position, hidden) on public.homepage_placements to anon, authenticated;
grant all on public.homepage_placements to service_role;
alter table public.homepage_placements enable row level security;
drop policy if exists "Anyone reads the homepage lineup" on public.homepage_placements;
create policy "Anyone reads the homepage lineup" on public.homepage_placements for select to anon, authenticated using (true);

-- Saves the whole lineup at once: _order is the placed campaigns in position order (1, 2, 3…), _hidden the
-- campaigns kept off the homepage. Staff only (admin or staff with a verified team session); audited.
create or replace function public.admin_set_homepage_lineup(_order uuid[], _hidden uuid[])
returns void language plpgsql security definer set search_path to 'public' as $$
declare b jsonb; a jsonb;
begin
  if not public.is_admin_staff(auth.uid()) then raise exception 'Staff access required'; end if;
  _order := coalesce(_order, '{}'::uuid[]);
  _hidden := coalesce(_hidden, '{}'::uuid[]);
  if cardinality(_order) > 100 then raise exception 'Place up to 100 campaigns'; end if;
  if cardinality(_hidden) > 500 then raise exception 'Hide up to 500 campaigns'; end if;
  if exists (select 1 from unnest(_order) x where x is null) or exists (select 1 from unnest(_hidden) x where x is null) then raise exception 'Fundraiser not found'; end if;
  if (select count(*) from unnest(_order) x) <> (select count(distinct x) from unnest(_order) x) then raise exception 'A campaign is placed twice'; end if;
  if exists (select 1 from unnest(_order) x where x = any(_hidden)) then raise exception 'A campaign can''t be placed and hidden'; end if;
  if exists (select 1 from unnest(_order || _hidden) x where not exists (select 1 from public.fundraisers f where f.id = x)) then raise exception 'Fundraiser not found'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('fundraiser_id', p.fundraiser_id, 'position', p.position, 'hidden', p.hidden) order by p.position nulls last, p.fundraiser_id), '[]'::jsonb) into b from public.homepage_placements p;
  delete from public.homepage_placements where true;
  insert into public.homepage_placements (fundraiser_id, position, hidden, updated_by)
    select t.x, t.o::int, false, auth.uid() from unnest(_order) with ordinality as t(x, o);
  insert into public.homepage_placements (fundraiser_id, position, hidden, updated_by)
    select distinct x, null::int, true, auth.uid() from unnest(_hidden) x;
  select coalesce(jsonb_agg(jsonb_build_object('fundraiser_id', p.fundraiser_id, 'position', p.position, 'hidden', p.hidden) order by p.position nulls last, p.fundraiser_id), '[]'::jsonb) into a from public.homepage_placements p;
  perform public.log_admin_action('homepage.lineup', 'homepage_placements', 'lineup', b, a);
end $$;
revoke all on function public.admin_set_homepage_lineup(uuid[], uuid[]) from public, anon;
grant execute on function public.admin_set_homepage_lineup(uuid[], uuid[]) to authenticated;
