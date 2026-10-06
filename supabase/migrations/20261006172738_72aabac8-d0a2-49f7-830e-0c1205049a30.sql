CREATE OR REPLACE FUNCTION public.get_my_fundraisers() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required' USING ERRCODE='42501'; END IF;
 RETURN coalesce((SELECT jsonb_agg(row_data ORDER BY created_at DESC) FROM (
 SELECT f.created_at,jsonb_build_object('id',f.id,'title',f.title,'category',f.category,'monthly_goal',f.monthly_goal,'cover_photo_url',f.cover_photo_url,'status',f.status,'unique_slug',f.unique_slug,'created_at',f.created_at,
 'amount_raised',l.data->'total','donors_count',l.data->'count','last_donation_at',(SELECT max(d->>'created_at') FROM jsonb_array_elements(l.data->'donations') d),
 'coupons_ready',(SELECT count(*) FROM public.get_my_fundraiser_coupons(f.id) c WHERE c.can_reveal AND c.revealed_at IS NULL AND c.used_at IS NULL),
 'fundraiser_images',coalesce((SELECT jsonb_agg(jsonb_build_object('image_url',i.image_url,'is_primary',i.is_primary,'display_order',i.display_order) ORDER BY i.is_primary DESC NULLS LAST,i.display_order,i.created_at) FROM public.fundraiser_images i WHERE i.fundraiser_id=f.id),'[]'::jsonb)) row_data
 FROM public.fundraisers f CROSS JOIN LATERAL (SELECT public.get_my_fundraiser_donations(f.id) data) l WHERE f.user_id=auth.uid() AND f.archived_at IS NULL
 ) rows),'[]'::jsonb);
END $$;