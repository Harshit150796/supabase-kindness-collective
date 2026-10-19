REVOKE EXECUTE ON FUNCTION public.is_example_fundraiser(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_example_fundraiser(uuid) TO service_role;