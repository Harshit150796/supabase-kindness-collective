CREATE OR REPLACE FUNCTION public.get_fundraiser_organizer(_fundraiser_id uuid)
 RETURNS TABLE(display_name text, city text, country text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT public.short_display_name(p.full_name), p.city, p.country
  FROM public.fundraisers f JOIN public.profiles p ON p.user_id = f.user_id
  WHERE f.id = _fundraiser_id AND f.status IN ('active','pending') AND NOT f.is_example
  UNION ALL
  SELECT public.short_display_name(f.example_organizer), NULL, f.country FROM public.fundraisers f
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
  SELECT public.short_display_name(f.example_organizer), 'organizer', NULL, f.country FROM public.fundraisers f
  WHERE f.id=_fundraiser_id AND f.is_example AND f.status IN ('active','pending')
$function$;