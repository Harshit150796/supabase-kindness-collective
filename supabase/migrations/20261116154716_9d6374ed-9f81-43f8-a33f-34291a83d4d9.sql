-- Replies in the admin portal (founder request, Nov 16, 2026). Email that people send to the team is copied
-- from Resend's received mail into email_inbox by admin-dispatch, so Admin > Emails > Inbox can show it and
-- the team can answer from there. Only the server reads and writes it (admin-contact checks the team role first).
CREATE TABLE IF NOT EXISTS public.email_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resend_id text NOT NULL UNIQUE,
  from_email text NOT NULL,
  from_name text,
  to_email text,
  subject text,
  body text,
  received_at timestamptz NOT NULL,
  from_user_id uuid,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'done')),
  handled_by uuid,
  handled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_inbox_status_idx ON public.email_inbox (status, received_at DESC);
REVOKE ALL ON public.email_inbox FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.email_inbox TO service_role;
-- No policies on purpose: only the server (service role) reads and writes this table.
ALTER TABLE public.email_inbox ENABLE ROW LEVEL SECURITY;
