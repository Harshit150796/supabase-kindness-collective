-- When the first emails reach someone who just applied (founder request, Nov 22, 2026). In Gmail tests that day,
-- bursts of email from us changed where they landed, and an applicant already gets the code email and the
-- "Your fundraiser is live" email, so:
--  1. "Your fundraiser is live" waits 10 minutes after the fundraiser goes live (due_account_emails). By then they
--     have seen the "Text it to 5 people now" screen and may have sent us a hello, which helps our mail reach them.
--  2. The welcome skips people who have a fundraiser (due_account_emails and claim_account_email), and for
--     everyone else waits an hour after the account opens, so someone who starts a fundraiser in that hour gets
--     only the live email.
-- Same functions as 20261122090000_welcome_email.sql otherwise.

CREATE OR REPLACE FUNCTION public.claim_account_email(_kind text, _source uuid, _by text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ok boolean := false; wm timestamptz; n int;
BEGIN
  IF _kind = 'donation_confirmation' THEN
    SELECT donation_watermark INTO wm FROM account_email_state WHERE id = 1;
    SELECT EXISTS (SELECT 1 FROM donations d WHERE d.id = _source AND d.status IN ('completed','succeeded') AND d.created_at >= wm) INTO ok;
  ELSIF _kind = 'fundraiser_live' THEN
    SELECT EXISTS (SELECT 1 FROM fundraisers f WHERE f.id = _source AND f.status = 'active') INTO ok;
  ELSIF _kind IN ('fundraiser_checklist', 'fundraiser_share_again') THEN
    SELECT EXISTS (SELECT 1 FROM fundraisers f WHERE f.id = _source AND f.status = 'active' AND NOT COALESCE(f.is_example, false)) INTO ok;
  ELSIF _kind = 'welcome' THEN
    SELECT EXISTS (SELECT 1 FROM auth.users u JOIN email_automations a ON a.key = _kind AND a.enabled AND u.created_at >= a.enabled_at
                   WHERE u.id = _source AND u.email_confirmed_at IS NOT NULL
                     AND NOT EXISTS (SELECT 1 FROM fundraisers f WHERE f.user_id = u.id)) INTO ok;
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

CREATE OR REPLACE FUNCTION public.due_account_emails()
RETURNS TABLE(kind text, source_id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  (SELECT 'donation_confirmation'::text, d.id FROM donations d, account_email_state s
    WHERE s.id = 1 AND d.status IN ('completed','succeeded') AND d.created_at >= s.donation_watermark
      AND NOT EXISTS (SELECT 1 FROM account_emails e WHERE e.kind = 'donation_confirmation' AND e.source_id = d.id AND e.status <> 'failed')
    ORDER BY d.created_at LIMIT 50)
  UNION ALL
  (SELECT 'fundraiser_live'::text, f.id FROM fundraisers f
    WHERE f.status = 'active' AND f.created_at <= now() - interval '10 minutes'
      AND NOT EXISTS (SELECT 1 FROM account_emails e WHERE e.kind = 'fundraiser_live' AND e.source_id = f.id AND e.status <> 'failed')
    ORDER BY f.created_at LIMIT 50)
  UNION ALL
  (SELECT 'welcome'::text, u.id FROM auth.users u
     JOIN email_automations a ON a.key = 'welcome' AND a.enabled AND u.created_at >= a.enabled_at
    WHERE u.email_confirmed_at IS NOT NULL AND u.created_at <= now() - interval '1 hour'
      AND NOT EXISTS (SELECT 1 FROM fundraisers f WHERE f.user_id = u.id)
      AND NOT EXISTS (SELECT 1 FROM account_emails e WHERE e.kind = 'welcome' AND e.source_id = u.id AND e.status <> 'failed')
    ORDER BY u.created_at LIMIT 20)
$$;
REVOKE ALL ON FUNCTION public.due_account_emails() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.due_account_emails() TO service_role;
