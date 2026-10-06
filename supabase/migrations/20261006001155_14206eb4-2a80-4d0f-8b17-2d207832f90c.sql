CREATE OR REPLACE FUNCTION public.get_my_fundraiser_donations(_fundraiser_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_fundraiser_team(_fundraiser_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not allowed' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'total', COALESCE(sum(q.amount), 0),
    'count', count(*),
    'donations', COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', q.id,
          'amount', q.amount,
          'donor_display', q.donor_display,
          'message', q.message,
          'created_at', q.created_at
        ) ORDER BY q.created_at DESC
      ),
      '[]'::jsonb
    )
  )
  INTO r
  FROM (
    SELECT
      d.id,
      d.amount,
      d.message,
      d.created_at,
      CASE
        WHEN COALESCE(d.is_anonymous, false) THEN 'Anonymous'
        WHEN NULLIF(btrim(p.full_name), '') IS NULL THEN 'Donor'
        ELSE concat_ws(
          ' ',
          split_part(btrim(p.full_name), ' ', 1),
          CASE
            WHEN array_length(regexp_split_to_array(btrim(p.full_name), '\s+'), 1) > 1
            THEN left((regexp_split_to_array(btrim(p.full_name), '\s+'))[array_length(regexp_split_to_array(btrim(p.full_name), '\s+'), 1)], 1) || '.'
            ELSE NULL
          END
        )
      END AS donor_display
    FROM public.donations d
    LEFT JOIN public.profiles p ON p.user_id = d.donor_id
    WHERE d.fundraiser_id = _fundraiser_id
      AND d.status = 'completed'
  ) q;

  RETURN r;
END
$$;

REVOKE ALL ON FUNCTION public.get_my_fundraiser_donations(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_fundraiser_donations(uuid) TO authenticated;