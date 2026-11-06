-- Team sessions need the authenticator step (founder request, Nov 6, 2026).
-- The admin portal opens only through the hidden team sign-in, which adds an authenticator-app code
-- (Supabase TOTP, session level aal2). This makes the database enforce the same rule: a team role
-- (admin, staff, viewer) counts for the signed-in person only when their session passed that step in
-- the last 12 hours. Server code using the service role is trusted to check the session itself
-- (_shared/auth.ts teamRpc runs the check as the person instead).
-- The rule is switched on with security_settings.require_team_mfa once the founder has set up the
-- authenticator, so nobody is locked out during the change.

CREATE TABLE IF NOT EXISTS public.security_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  require_team_mfa boolean NOT NULL DEFAULT false,
  team_mfa_max_age_hours integer NOT NULL DEFAULT 12 CHECK (team_mfa_max_age_hours BETWEEN 1 AND 168),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.security_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.security_settings FROM anon, authenticated;
GRANT ALL ON public.security_settings TO service_role;

-- True when a team role may count for _uid in this request.
CREATE OR REPLACE FUNCTION public.team_session_ok(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN coalesce(auth.jwt() ->> 'role', '') = 'service_role' THEN true
    WHEN auth.uid() IS NULL OR auth.uid() IS DISTINCT FROM _uid THEN true
    WHEN NOT coalesce((SELECT s.require_team_mfa FROM public.security_settings s WHERE s.id), false) THEN true
    ELSE coalesce(auth.jwt() ->> 'aal', '') = 'aal2' AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(CASE WHEN jsonb_typeof(auth.jwt() -> 'amr') = 'array' THEN auth.jwt() -> 'amr' ELSE '[]'::jsonb END) AS m
      WHERE m ->> 'method' = 'totp'
        AND (m ->> 'timestamp') ~ '^[0-9]+(\.[0-9]+)?$'
        AND (m ->> 'timestamp')::double precision > extract(epoch FROM now())
          - 3600 * coalesce((SELECT s.team_mfa_max_age_hours FROM public.security_settings s WHERE s.id), 12))
  END
$$;

-- Whether the rule is on (for server code that checks sessions itself).
CREATE OR REPLACE FUNCTION public.team_mfa_required()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce((SELECT s.require_team_mfa FROM public.security_settings s WHERE s.id), false)
$$;

CREATE OR REPLACE FUNCTION public.is_admin_staff(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_uid AND role IN ('admin','staff')) AND public.team_session_ok(_uid) $$;
CREATE OR REPLACE FUNCTION public.is_admin_any(_uid uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_uid AND role IN ('admin','staff','viewer')) AND public.team_session_ok(_uid) $$;
-- has_role keeps its live signature (its role type has changed over time), so every two-argument
-- version is rewritten in place with the same argument types.
DO $do$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT format_type(p.proargtypes[1], NULL) AS role_type
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'has_role' AND p.pronargs = 2
      AND format_type(p.proargtypes[0], NULL) = 'uuid'
  LOOP
    EXECUTE format($f$
      CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role %s)
      RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $b$
        SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role::text = _role::text)
          AND (_role::text NOT IN ('admin', 'staff', 'viewer') OR public.team_session_ok(_user_id))
      $b$$f$, f.role_type);
  END LOOP;
END
$do$;

REVOKE ALL ON FUNCTION public.team_session_ok(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.team_session_ok(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.team_mfa_required() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.team_mfa_required() TO service_role;

-- Server code acting for a team member (_svc_as) runs only after it checked that person's session
-- itself (edge functions use teamRpc), so it carries the authenticator step over.
CREATE OR REPLACE FUNCTION public._svc_as(_actor uuid) RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', coalesce(_actor::text,''), true);
  PERFORM set_config('request.jwt.claims', json_build_object(
    'sub', _actor, 'role', 'authenticated', 'aal', 'aal2', 'svc_as', true,
    'amr', json_build_array(json_build_object('method', 'totp', 'timestamp', floor(extract(epoch FROM now()))))
  )::text, true);
END $$;
REVOKE ALL ON FUNCTION public._svc_as(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._svc_as(uuid) TO service_role;

-- Receipts: the organizer and the donors of the gift (impact-actions checks staff separately, as the person).
CREATE OR REPLACE FUNCTION public.can_view_coupon_receipts_as_party(_coupon_id uuid, _uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT _uid IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.coupons c JOIN public.donations d ON d.id = c.donation_id
    JOIN public.fundraisers f ON f.id = d.fundraiser_id
    WHERE c.id = _coupon_id AND (f.user_id = _uid OR d.donor_id = _uid
      OR (d.donor_email IS NOT NULL AND lower(d.donor_email) = (SELECT lower(email) FROM auth.users WHERE id = _uid AND email_confirmed_at IS NOT NULL))))
$$;
REVOKE ALL ON FUNCTION public.can_view_coupon_receipts_as_party(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_coupon_receipts_as_party(uuid, uuid) TO service_role;