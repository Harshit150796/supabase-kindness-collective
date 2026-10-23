create table if not exists public.legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_version text not null,
  context text not null check (context in ('sign-up','sign-in','google','apply-account','fundraiser-submit')),
  fundraiser_id uuid references public.fundraisers(id) on delete set null,
  accepted_at timestamptz not null default now(),
  constraint legal_acceptances_once unique nulls not distinct (user_id, terms_version, context, fundraiser_id)
);
alter table public.legal_acceptances enable row level security;
create policy "People record their own acceptance" on public.legal_acceptances
  for insert to authenticated with check (user_id = auth.uid());
create policy "People see their own acceptances" on public.legal_acceptances
  for select to authenticated using (user_id = auth.uid());
create policy "Team sees acceptances" on public.legal_acceptances
  for select to authenticated using (public.is_admin_any(auth.uid()));
create index if not exists legal_acceptances_user_idx on public.legal_acceptances (user_id, accepted_at desc);

create table if not exists public.request_rate_limits (
  id bigint generated always as identity primary key,
  bucket text not null,
  key_hash text not null,
  created_at timestamptz not null default now()
);
alter table public.request_rate_limits enable row level security;
create index if not exists request_rate_limits_lookup_idx on public.request_rate_limits (bucket, key_hash, created_at desc);

alter table public.admin_settings alter column include_trial_stats set default false;
update public.admin_settings set include_trial_stats = false where id = 1;

update public.cms_testimonials set is_published = false where image_url ilike '%images.unsplash.com%';
update public.cms_stories set is_published = false
  where name in ('Children''s Hope Program', 'Rural Family Support', 'Hurricane Helene Relief', 'Children of Heroes');
update public.cms_faq set is_published = false
  where lower(question) in ('how are recipients verified?', 'what categories of coupons are available?',
                           'can i donate to specific regions or causes?', 'how long does recipient verification take?');