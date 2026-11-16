-- Organizer emails and email settings (founder request, Nov 15, 2026).
--  1. email_automations: an on/off switch for each optional automatic email, managed in Admin > Emails.
--     Only the server reads and writes it (admin-contact checks the team role first).
--  2. claim_account_email learns the organizer emails: a gift came in, two days with no gift, first week,
--     halfway, goal reached, gone quiet. Each is sent once per gift or fundraiser, and only while switched on.
--  3. email_topic files the new subjects under the right topic in Admin > Emails.
--  4. The four visitor follow-ups that changed get their approved wording.

CREATE TABLE IF NOT EXISTS public.email_automations (
  key text PRIMARY KEY,
  enabled boolean NOT NULL DEFAULT true,
  -- Nothing that happened before this moment triggers an email (no catching up on old gifts).
  enabled_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
REVOKE ALL ON public.email_automations FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.email_automations TO service_role;
-- No policies on purpose: only the server (service role) reads and writes this table.
ALTER TABLE public.email_automations ENABLE ROW LEVEL SECURITY;

INSERT INTO public.email_automations (key) VALUES
  ('organizer_gift'), ('organizer_nudge'), ('organizer_week'), ('organizer_halfway'), ('organizer_goal'), ('organizer_quiet')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.claim_account_email(_kind text, _source uuid, _by text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ok boolean := false; wm timestamptz; n int;
BEGIN
  IF _kind = 'donation_confirmation' THEN
    SELECT donation_watermark INTO wm FROM account_email_state WHERE id = 1;
    SELECT EXISTS (SELECT 1 FROM donations d WHERE d.id = _source AND d.status IN ('completed','succeeded') AND d.created_at >= wm) INTO ok;
  ELSIF _kind = 'fundraiser_live' THEN
    SELECT EXISTS (SELECT 1 FROM fundraisers f WHERE f.id = _source AND f.status = 'active') INTO ok;
  ELSIF _kind = 'fundraiser_checklist' THEN
    SELECT EXISTS (SELECT 1 FROM fundraisers f WHERE f.id = _source AND f.status = 'active' AND NOT COALESCE(f.is_example, false)) INTO ok;
  ELSIF _kind = 'organizer_gift' THEN
    SELECT EXISTS (SELECT 1 FROM donations d JOIN fundraisers f ON f.id = d.fundraiser_id
                    JOIN email_automations a ON a.key = _kind AND a.enabled AND d.created_at >= a.enabled_at
                   WHERE d.id = _source AND d.status IN ('completed','succeeded') AND NOT COALESCE(f.is_example, false)) INTO ok;
  ELSIF _kind IN ('organizer_nudge', 'organizer_week', 'organizer_halfway', 'organizer_quiet') THEN
    SELECT EXISTS (SELECT 1 FROM fundraisers f JOIN email_automations a ON a.key = _kind AND a.enabled
                   WHERE f.id = _source AND f.status = 'active' AND NOT COALESCE(f.is_example, false)) INTO ok;
  ELSIF _kind = 'organizer_goal' THEN
    SELECT EXISTS (SELECT 1 FROM fundraisers f JOIN email_automations a ON a.key = _kind AND a.enabled
                   WHERE f.id = _source AND f.status IN ('active', 'completed') AND NOT COALESCE(f.is_example, false)) INTO ok;
  ELSE
    RAISE EXCEPTION 'unknown kind';
  END IF;
  IF NOT ok THEN RETURN false; END IF;
  INSERT INTO account_emails(kind, source_id, claimed_by) VALUES (_kind, _source, _by) ON CONFLICT (kind, source_id) DO NOTHING;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n = 1 THEN RETURN true; END IF;
  -- Retry only rows whose earlier send failed (never a sent, sending or skipped row).
  UPDATE account_emails SET status = 'sending', attempts = attempts + 1, claimed_by = _by, claimed_at = now()
   WHERE kind = _kind AND source_id = _source AND status = 'failed' AND attempts < 5;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n = 1;
END $$;
REVOKE ALL ON FUNCTION public.claim_account_email(text, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_account_email(text, uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.email_topic(_subject text, _category text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN _category = 'outreach' THEN 'outreach'
    WHEN _category = 'team' THEN 'team'
    WHEN s ~* '(needs review|account activity|replied to the couponDonation team|^new message:|paused|call list|partner inquiry)' THEN 'alerts'
    WHEN s ~* '(verification code|reset your|password|confirm you want to stop|sign in|welcome to coupondonation)' THEN 'account'
    WHEN s ~* '(you.re live|isn.t live right now|one text can start it|gifts? just came in|new gifts came in|your first week|you.re halfway|you reached your goal|a short update brings)' THEN 'fundraiser'
    WHEN s ~* '(a donation arrived for your fundraiser|quick note about your fundraiser|did you use|coupon is ready|card is ready|cards are ready|card work\?)' THEN 'family'
    WHEN s ~* '(donation is confirmed|your gift|your donation|monthly gift|receipt|thank you for|we received your gift)' THEN 'donor'
    WHEN s ~* '(your fundraiser is live|update about your fundraiser|invited to help|invited to co-organize|still want to help run|fundraiser invitation|posted an update)' THEN 'fundraiser'
    WHEN s ~* '(message is waiting|message from the coupondonation team|new message about|we received your message|we got your message)' THEN 'messages'
    ELSE 'other' END
  FROM (SELECT coalesce(_subject, '') AS s) x
$$;

-- Visitor follow-ups: approved wording (Nov 15, 2026). "Story reader" and "Possible partner" stay as they are.
UPDATE public.followup_personas SET subject = 'How your gift reaches a family', body =
'Hi {first_name},

On CouponDonation, a gift from $10 reaches a family as a store gift card for food, groceries, travel or health needs. Never cash. All of it: we take no fee. We email you when the card is received, and again when it''s used.

Give here: https://coupondonation.com/donate

Questions? Just reply.

— The CouponDonation team', version = version + 1, updated_at = now() WHERE persona_key = 'ready_to_give';

UPDATE public.followup_personas SET subject = 'Start your fundraiser in a few minutes', body =
'Hi {first_name},

Starting a fundraiser on CouponDonation is free. You tell us what you need (food, groceries, travel or health) and which stores you use, then add a photo and a short story. It goes live right away, and we send you a message you can share by text.

Start here: https://coupondonation.com/apply

Stuck on a step? Reply and we''ll help.

— The CouponDonation team', version = version + 1, updated_at = now() WHERE persona_key = 'planning_fundraiser';

UPDATE public.followup_personas SET subject = 'How a gift becomes help, in three steps', body =
'Hi {first_name},

1. You give from $10 to a family''s fundraiser.
2. We turn it into a gift card for the store they asked for: food, groceries, travel or health.
3. They use it, and we tell you when.

No cash changes hands, and we take no fee from your gift.

See each step: https://coupondonation.com/how-it-works

— The CouponDonation team', version = version + 1, updated_at = now() WHERE persona_key = 'learning';

UPDATE public.followup_personas SET subject = 'Where your gifts went', body =
'Hi {first_name},

Thank you for giving. Your impact page shows each gift: the card it became, when it was received and when it was used.

See your gifts: https://coupondonation.com/my-impact

— The CouponDonation team', version = version + 1, updated_at = now() WHERE persona_key = 'returning_donor';

-- The approved wording goes out exactly as written; the team can turn AI rewording back on in Admin > Follow-ups.
UPDATE public.admin_settings SET followup_ai_writing = false WHERE id = 1;
