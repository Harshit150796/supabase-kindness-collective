grant select, insert on public.legal_acceptances to authenticated;
grant all on public.legal_acceptances to service_role;
grant all on public.request_rate_limits to service_role;
grant usage, select on all sequences in schema public to service_role;