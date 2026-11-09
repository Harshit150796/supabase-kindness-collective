-- First-gifts checklist for fundraisers that were live before it existed (founder request, Nov 9, 2026):
-- admin-dispatch sends it once per fundraiser as account email kind 'fundraiser_checklist'. Same function as
-- before, plus that kind: only active fundraisers that aren't examples.
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
