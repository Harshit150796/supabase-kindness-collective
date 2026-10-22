alter table public.fundraisers
  add column if not exists help_categories text[] not null default '{}'::text[],
  add column if not exists preferred_brands text[] not null default '{}'::text[],
  add column if not exists similar_stores_ok boolean not null default true,
  add column if not exists city text,
  add column if not exists state_code text;

alter table public.fundraisers drop constraint if exists fundraisers_help_categories_limit;
alter table public.fundraisers add constraint fundraisers_help_categories_limit check (cardinality(help_categories) <= 10);
alter table public.fundraisers drop constraint if exists fundraisers_preferred_brands_limit;
alter table public.fundraisers add constraint fundraisers_preferred_brands_limit check (cardinality(preferred_brands) <= 8 and coalesce(length(array_to_string(preferred_brands, '')), 0) <= 400);
alter table public.fundraisers drop constraint if exists fundraisers_city_length;
alter table public.fundraisers add constraint fundraisers_city_length check (city is null or length(city) between 1 and 80);
alter table public.fundraisers drop constraint if exists fundraisers_state_code_format;
alter table public.fundraisers add constraint fundraisers_state_code_format check (state_code is null or state_code ~ '^[A-Z]{2}$');