revoke all on public.legal_acceptances from authenticated;
grant select, insert on public.legal_acceptances to authenticated;
revoke all on sequence public.request_rate_limits_id_seq from anon, authenticated;