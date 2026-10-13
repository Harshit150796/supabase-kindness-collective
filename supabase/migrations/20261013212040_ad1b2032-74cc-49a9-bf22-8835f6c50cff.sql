CREATE OR REPLACE FUNCTION public.admin_followup_set_ai(_on boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE old boolean;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin access required'; END IF;
  SELECT followup_ai_writing INTO old FROM public.admin_settings WHERE id = 1;
  UPDATE public.admin_settings SET followup_ai_writing = _on WHERE id = 1;
  PERFORM public.log_admin_action('followup_ai_writing', 'admin_settings', '1', jsonb_build_object('on', old), jsonb_build_object('on', _on));
END $$;
REVOKE ALL ON FUNCTION public.admin_followup_set_ai(boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_followup_set_ai(boolean) TO authenticated;