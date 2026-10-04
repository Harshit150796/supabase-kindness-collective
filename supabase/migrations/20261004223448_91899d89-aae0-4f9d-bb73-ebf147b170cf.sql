CREATE TABLE public.account_email_state (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  donation_watermark timestamptz NOT NULL DEFAULT now(),
  live_watermark timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.account_email_state TO service_role;
ALTER TABLE public.account_email_state ENABLE ROW LEVEL SECURITY;
INSERT INTO public.account_email_state(id) VALUES (1) ON CONFLICT DO NOTHING;

CREATE TABLE public.account_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  source_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'sending',
  attempts int NOT NULL DEFAULT 1,
  resend_id text,
  last_error text,
  claimed_by text,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  UNIQUE (kind, source_id)
);
GRANT ALL ON public.account_emails TO service_role;
GRANT SELECT ON public.account_emails TO authenticated;
ALTER TABLE public.account_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read account email log" ON public.account_emails FOR SELECT TO authenticated USING (public.is_admin_any(auth.uid()));

-- No backfill: every fundraiser that is already live (or was live and is now paused/closed) is marked skipped.
INSERT INTO public.account_emails(kind, source_id, status, claimed_by)
SELECT 'fundraiser_live', id, 'skipped', 'deploy-watermark' FROM public.fundraisers WHERE COALESCE(status,'') <> 'pending'
ON CONFLICT DO NOTHING;

-- Exactly-once claim shared by the fast path and the dispatcher.
CREATE OR REPLACE FUNCTION public.claim_account_email(_kind text, _source uuid, _by text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ok boolean := false; wm timestamptz; n int;
BEGIN
  IF _kind = 'donation_confirmation' THEN
    SELECT donation_watermark INTO wm FROM account_email_state WHERE id = 1;
    SELECT EXISTS (SELECT 1 FROM donations d WHERE d.id = _source AND d.status IN ('completed','succeeded') AND d.created_at >= wm) INTO ok;
  ELSIF _kind = 'fundraiser_live' THEN
    SELECT EXISTS (SELECT 1 FROM fundraisers f WHERE f.id = _source AND f.status = 'active') INTO ok;
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
    WHERE f.status = 'active'
      AND NOT EXISTS (SELECT 1 FROM account_emails e WHERE e.kind = 'fundraiser_live' AND e.source_id = f.id AND e.status <> 'failed')
    ORDER BY f.created_at LIMIT 50)
$$;
REVOKE ALL ON FUNCTION public.due_account_emails() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.due_account_emails() TO service_role;