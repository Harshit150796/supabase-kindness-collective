-- Removes the account made by the end-to-end sign-up test after the sign-up lock went live
-- (a Resend test address, not a real person).
delete from public.email_subscribers where email = 'delivered+locktest19963@resend.dev';
delete from public.otp_codes where email = 'delivered+locktest19963@resend.dev';
delete from auth.users where id = '65f1f752-8a9a-458c-8e41-2f9915d20267' and email = 'delivered+locktest19963@resend.dev';