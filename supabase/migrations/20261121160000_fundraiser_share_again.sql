-- The sharing checklist sent once more, in the new plain email layout, to every open fundraiser (founder
-- request, Nov 21, 2026). admin-dispatch sends it as account email kind 'fundraiser_share_again', once per
-- fundraiser, with the same rule as 'fundraiser_checklist': active and not an example. Same function as
-- 20261116062153 otherwise. Its subjects are the live-email subjects, already filed under 'fundraiser'.

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