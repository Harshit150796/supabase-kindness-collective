-- Sign-up lock: from now on an email-and-password account can be opened only by the create-account
-- function, after a verified code. Sign-ups straight through the Supabase sign-up API, magic links
-- for unknown addresses and accounts typed into the dashboard are refused; Google sign-ins are not
-- affected. To add an email user by hand, insert their address into public.allowed_signups first.
-- To switch the lock off: drop trigger if exists trg_signup_lock on auth.users;
create or replace function public.trg_signup_lock() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  if new.email is not null and coalesce(new.raw_app_meta_data->>'provider', 'email') = 'email' then
    delete from public.allowed_signups
     where email = lower(new.email) and created_at > now() - interval '10 minutes';
    if not found then
      raise exception 'Email sign-ups go through coupondonation.com' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.trg_signup_lock() from public, anon, authenticated;
drop trigger if exists trg_signup_lock on auth.users;
create trigger trg_signup_lock before insert on auth.users
  for each row execute function public.trg_signup_lock();
delete from public.allowed_signups where created_at < now() - interval '1 day';