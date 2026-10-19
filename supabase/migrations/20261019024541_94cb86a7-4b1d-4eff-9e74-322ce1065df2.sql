ALTER TABLE public.fundraisers ADD COLUMN IF NOT EXISTS is_example boolean NOT NULL DEFAULT false;
ALTER TABLE public.fundraisers ADD COLUMN IF NOT EXISTS example_organizer text;

CREATE TABLE public.example_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fundraiser_id uuid NOT NULL REFERENCES public.fundraisers(id) ON DELETE CASCADE,
  donor_name text NOT NULL,
  is_anonymous boolean NOT NULL DEFAULT false,
  amount numeric(10,2) NOT NULL,
  brand_name text NOT NULL,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.example_donations TO service_role;
ALTER TABLE public.example_donations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.example_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  example_donation_id uuid NOT NULL REFERENCES public.example_donations(id) ON DELETE CASCADE,
  brand_name text NOT NULL,
  value numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'issued',
  issued_at timestamptz NOT NULL DEFAULT now(),
  received_at timestamptz,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.example_coupons TO service_role;
ALTER TABLE public.example_coupons ENABLE ROW LEVEL SECURITY;
CREATE INDEX ON public.example_donations(fundraiser_id);
CREATE INDEX ON public.example_coupons(example_donation_id);

CREATE OR REPLACE FUNCTION public.get_fundraiser_totals(_fundraiser_id uuid)
 RETURNS TABLE(total_raised numeric, donations_count bigint, retailers text[])
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
 SELECT coalesce(sum(d.amount),0)::numeric, count(DISTINCT coalesce(d.donor_id::text,lower(d.donor_email),d.id::text))::bigint,
 coalesce((SELECT array_agg(DISTINCT trim(b)) FROM public.donations d2, unnest(string_to_array(coalesce(d2.brand_partner,''),',')) b WHERE d2.fundraiser_id=_fundraiser_id AND d2.status='completed' AND trim(b)<>''),'{}')
 FROM public.donations d JOIN public.fundraisers f ON f.id=d.fundraiser_id AND f.status IN ('active','paused','completed') AND NOT f.is_example
 WHERE d.fundraiser_id=_fundraiser_id AND d.status='completed'
 AND NOT EXISTS (SELECT 1 FROM public.fundraisers x WHERE x.id=_fundraiser_id AND x.is_example)
 UNION ALL
 SELECT coalesce(sum(e.amount),0)::numeric, count(DISTINCT e.donor_name)::bigint,
   coalesce((SELECT array_agg(DISTINCT e2.brand_name) FROM public.example_donations e2 WHERE e2.fundraiser_id=_fundraiser_id),'{}')
 FROM public.example_donations e
 WHERE e.fundraiser_id=_fundraiser_id AND EXISTS (SELECT 1 FROM public.fundraisers x WHERE x.id=_fundraiser_id AND x.is_example AND x.status IN ('active','paused','completed'));
$function$;

CREATE OR REPLACE FUNCTION public.get_fundraiser_donations(_fundraiser_id uuid, _limit integer DEFAULT 10, _order text DEFAULT 'recent'::text)
 RETURNS TABLE(id uuid, display_name text, is_anonymous boolean, amount numeric, message text, created_at timestamp with time zone)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT * FROM (
  SELECT d.id,
    CASE WHEN COALESCE(d.is_anonymous,false) THEN 'Anonymous'
         ELSE COALESCE(public.short_display_name(d.donor_name),'Supporter') END,
    COALESCE(d.is_anonymous,false), d.amount, d.message, d.created_at
  FROM public.donations d
  JOIN public.fundraisers f ON f.id = d.fundraiser_id AND f.status IN ('active','pending') AND NOT f.is_example
  WHERE d.fundraiser_id = _fundraiser_id AND d.status IN ('completed','succeeded')
  UNION ALL
  SELECT e.id, CASE WHEN e.is_anonymous THEN 'Anonymous' ELSE public.short_display_name(e.donor_name) END,
    e.is_anonymous, e.amount, e.message, e.created_at
  FROM public.example_donations e
  JOIN public.fundraisers f ON f.id = e.fundraiser_id AND f.status IN ('active','pending') AND f.is_example
  WHERE e.fundraiser_id = _fundraiser_id) r
  ORDER BY CASE WHEN _order = 'top' THEN r.amount END DESC NULLS LAST, r.created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 100))
$function$;

CREATE OR REPLACE FUNCTION public.get_fundraiser_organizer(_fundraiser_id uuid)
 RETURNS TABLE(display_name text, city text, country text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT public.short_display_name(p.full_name), p.city, p.country
  FROM public.fundraisers f JOIN public.profiles p ON p.user_id = f.user_id
  WHERE f.id = _fundraiser_id AND f.status IN ('active','pending') AND NOT f.is_example
  UNION ALL
  SELECT f.example_organizer, NULL, f.country FROM public.fundraisers f
  WHERE f.id = _fundraiser_id AND f.status IN ('active','pending') AND f.is_example
$function$;

CREATE OR REPLACE FUNCTION public.get_fundraiser_team_public(_fundraiser_id uuid)
 RETURNS TABLE(display_name text, role text, city text, country text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT * FROM (
  SELECT CASE WHEN f.show_full_name AND t.role='organizer' THEN NULLIF(btrim(p.full_name),'') ELSE public.short_display_name(p.full_name) END,
         t.role, p.city, p.country
  FROM public.fundraiser_team t
  JOIN public.fundraisers f ON f.id=t.fundraiser_id AND f.status IN ('active','pending') AND NOT f.is_example
  JOIN public.profiles p ON p.user_id=t.user_id
  WHERE t.fundraiser_id=_fundraiser_id AND t.status='accepted'
  ORDER BY (t.role='organizer') DESC, t.created_at) a
  UNION ALL
  SELECT f.example_organizer, 'organizer', NULL, f.country FROM public.fundraisers f
  WHERE f.id=_fundraiser_id AND f.is_example AND f.status IN ('active','pending')
$function$;

CREATE OR REPLACE FUNCTION public.get_fundraiser_coupon_trail(_fundraiser_id uuid)
 RETURNS TABLE(converted numeric, redeemed numeric, coupons_count bigint)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT COALESCE(SUM(COALESCE(c.value,c.expected_value,0)),0),
         COALESCE(SUM(CASE WHEN c.status='redeemed' THEN COALESCE(c.value,c.expected_value,0) ELSE 0 END),0),
         COUNT(c.id)
  FROM public.coupons c JOIN public.donations d ON d.id = c.donation_id
  WHERE d.fundraiser_id = _fundraiser_id AND d.status IN ('completed','succeeded') AND c.status::text <> 'void'
    AND NOT EXISTS (SELECT 1 FROM public.fundraisers x WHERE x.id=_fundraiser_id AND x.is_example)
  UNION ALL
  SELECT COALESCE(SUM(c.value),0), COALESCE(SUM(CASE WHEN c.used_at IS NOT NULL THEN c.value ELSE 0 END),0), COUNT(c.id)
  FROM public.example_coupons c JOIN public.example_donations e ON e.id=c.example_donation_id
  WHERE e.fundraiser_id=_fundraiser_id AND EXISTS (SELECT 1 FROM public.fundraisers x WHERE x.id=_fundraiser_id AND x.is_example)
$function$;

CREATE OR REPLACE FUNCTION public.is_example_fundraiser(_id uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$ SELECT coalesce((SELECT is_example FROM public.fundraisers WHERE id=_id), false) $$;
GRANT EXECUTE ON FUNCTION public.is_example_fundraiser(uuid) TO anon, authenticated, service_role;

DO $$
DECLARE d text;
BEGIN
  d := pg_get_functiondef('public.get_landing_stats'::regproc);
  d := replace(d, '(SELECT count(*) FROM public.fundraisers WHERE status=''active'')', '(SELECT count(*) FROM public.fundraisers WHERE status=''active'' AND NOT is_example)');
  EXECUTE d;
END $$;