-- Homepage lineup pins and Shuffle (founder request, Nov 9, 2026): in Admin → Homepage, Shuffle puts the open
-- campaigns in a random order, and a pinned campaign keeps its position through every shuffle. Pins only
-- matter to Shuffle; the homepage reads positions exactly as before.

alter table public.homepage_placements add column if not exists pinned boolean not null default false;
alter table public.homepage_placements drop constraint if exists homepage_placements_pin_placed;
-- Only a placed campaign can be pinned.
alter table public.homepage_placements add constraint homepage_placements_pin_placed check (not pinned or position is not null);
-- The admin page reads pins; visitors keep reading only fundraiser_id, position and hidden.
grant select (pinned) on public.homepage_placements to authenticated;

-- Replaces the two-argument version: the same checks and audit, plus _pinned (placed campaigns Shuffle keeps in place).
drop function if exists public.admin_set_homepage_lineup(uuid[], uuid[]);
create or replace function public.admin_set_homepage_lineup(_order uuid[], _hidden uuid[], _pinned uuid[] default '{}'::uuid[])
returns void language plpgsql security definer set search_path to 'public' as $$
declare b jsonb; a jsonb;
begin
  if not public.is_admin_staff(auth.uid()) then raise exception 'Staff access required'; end if;
  _order := coalesce(_order, '{}'::uuid[]);
  _hidden := coalesce(_hidden, '{}'::uuid[]);
  _pinned := coalesce(_pinned, '{}'::uuid[]);
  if cardinality(_order) > 100 then raise exception 'Place up to 100 campaigns'; end if;
  if cardinality(_hidden) > 500 then raise exception 'Hide up to 500 campaigns'; end if;
  if exists (select 1 from unnest(_order) x where x is null) or exists (select 1 from unnest(_hidden) x where x is null) then raise exception 'Fundraiser not found'; end if;
  if (select count(*) from unnest(_order) x) <> (select count(distinct x) from unnest(_order) x) then raise exception 'A campaign is placed twice'; end if;
  if exists (select 1 from unnest(_order) x where x = any(_hidden)) then raise exception 'A campaign can''t be placed and hidden'; end if;
  if exists (select 1 from unnest(_pinned) x where x is null or not (x = any(_order))) then raise exception 'Only placed campaigns can be pinned'; end if;
  if exists (select 1 from unnest(_order || _hidden) x where not exists (select 1 from public.fundraisers f where f.id = x)) then raise exception 'Fundraiser not found'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('fundraiser_id', p.fundraiser_id, 'position', p.position, 'hidden', p.hidden, 'pinned', p.pinned) order by p.position nulls last, p.fundraiser_id), '[]'::jsonb) into b from public.homepage_placements p;
  delete from public.homepage_placements where true;
  insert into public.homepage_placements (fundraiser_id, position, hidden, pinned, updated_by)
    select t.x, t.o::int, false, t.x = any(_pinned), auth.uid() from unnest(_order) with ordinality as t(x, o);
  insert into public.homepage_placements (fundraiser_id, position, hidden, pinned, updated_by)
    select distinct x, null::int, true, false, auth.uid() from unnest(_hidden) x;
  select coalesce(jsonb_agg(jsonb_build_object('fundraiser_id', p.fundraiser_id, 'position', p.position, 'hidden', p.hidden, 'pinned', p.pinned) order by p.position nulls last, p.fundraiser_id), '[]'::jsonb) into a from public.homepage_placements p;
  perform public.log_admin_action('homepage.lineup', 'homepage_placements', 'lineup', b, a);
end $$;
revoke all on function public.admin_set_homepage_lineup(uuid[], uuid[], uuid[]) from public, anon;
grant execute on function public.admin_set_homepage_lineup(uuid[], uuid[], uuid[]) to authenticated;
