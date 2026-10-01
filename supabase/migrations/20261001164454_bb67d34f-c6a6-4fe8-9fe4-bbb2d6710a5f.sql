CREATE OR REPLACE FUNCTION public.short_display_name(_name text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE WHEN _name IS NULL OR btrim(_name) = '' THEN NULL
    ELSE split_part(btrim(_name),' ',1) || CASE WHEN split_part(btrim(_name),' ',2) <> ''
      THEN ' ' || upper(left(split_part(btrim(_name),' ',2),1)) || '.' ELSE '' END END
$$;

CREATE OR REPLACE FUNCTION public.get_fundraiser_organizer(_fundraiser_id uuid)
RETURNS TABLE(display_name text, city text, country text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.short_display_name(p.full_name), p.city, p.country
  FROM public.fundraisers f JOIN public.profiles p ON p.user_id = f.user_id
  WHERE f.id = _fundraiser_id AND f.status IN ('active','pending')
$$;

CREATE OR REPLACE FUNCTION public.get_fundraiser_donations(_fundraiser_id uuid, _limit integer DEFAULT 10, _order text DEFAULT 'recent')
RETURNS TABLE(id uuid, display_name text, is_anonymous boolean, amount numeric, message text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT d.id,
    CASE WHEN COALESCE(d.is_anonymous,false) THEN 'Anonymous'
         ELSE COALESCE(public.short_display_name(d.donor_name),'Supporter') END,
    COALESCE(d.is_anonymous,false), d.amount, d.message, d.created_at
  FROM public.donations d
  JOIN public.fundraisers f ON f.id = d.fundraiser_id AND f.status IN ('active','pending')
  WHERE d.fundraiser_id = _fundraiser_id AND d.status IN ('completed','succeeded')
  ORDER BY CASE WHEN _order = 'top' THEN d.amount END DESC NULLS LAST, d.created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 100))
$$;

CREATE OR REPLACE FUNCTION public.get_fundraiser_coupon_trail(_fundraiser_id uuid)
RETURNS TABLE(converted numeric, redeemed numeric, coupons_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(COALESCE(c.value,c.expected_value,0)),0),
         COALESCE(SUM(CASE WHEN c.status='redeemed' THEN COALESCE(c.value,c.expected_value,0) ELSE 0 END),0),
         COUNT(c.id)
  FROM public.coupons c JOIN public.donations d ON d.id = c.donation_id
  WHERE d.fundraiser_id = _fundraiser_id AND d.status IN ('completed','succeeded')
$$;

GRANT EXECUTE ON FUNCTION public.get_fundraiser_organizer(uuid), public.get_fundraiser_donations(uuid,integer,text), public.get_fundraiser_coupon_trail(uuid) TO anon, authenticated;