CREATE OR REPLACE FUNCTION public.get_my_fundraiser_donations(_fundraiser_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_fundraiser_team(_fundraiser_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;
  SELECT jsonb_build_object(
    'total', COALESCE(sum(d.amount), 0),
    'count', count(*),
    'donations', COALESCE(jsonb_agg(jsonb_build_object('id', d.id, 'amount', d.amount, 'donor_email', d.donor_email,
      'is_anonymous', COALESCE(d.is_anonymous, false), 'message', d.message, 'status', d.status, 'created_at', d.created_at)
      ORDER BY d.created_at DESC), '[]'::jsonb))
  INTO r FROM public.donations d WHERE d.fundraiser_id = _fundraiser_id AND d.status = 'completed';
  RETURN r;
END $$;
REVOKE ALL ON FUNCTION public.get_my_fundraiser_donations(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_fundraiser_donations(uuid) TO authenticated;