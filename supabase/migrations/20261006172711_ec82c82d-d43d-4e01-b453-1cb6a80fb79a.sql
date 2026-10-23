CREATE OR REPLACE FUNCTION public.recompute_fundraiser_totals(_fundraiser_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF _fundraiser_id IS NULL THEN RETURN; END IF;
 PERFORM 1 FROM public.fundraisers WHERE id=_fundraiser_id FOR UPDATE;
 UPDATE public.fundraisers f SET amount_raised=t.raised, donors_count=t.donors, updated_at=now()
 FROM (SELECT coalesce(sum(d.amount),0) raised, count(DISTINCT coalesce(d.donor_id::text,lower(d.donor_email),d.id::text))::integer donors FROM public.donations d WHERE d.fundraiser_id=_fundraiser_id AND d.status='completed') t WHERE f.id=_fundraiser_id;
END $$;
REVOKE ALL ON FUNCTION public.recompute_fundraiser_totals(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.recompute_fundraiser_totals(uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.sync_donation_fundraiser_totals() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _id uuid;
BEGIN
 IF TG_OP='UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status AND NEW.amount IS NOT DISTINCT FROM OLD.amount AND NEW.fundraiser_id IS NOT DISTINCT FROM OLD.fundraiser_id AND NEW.donor_id IS NOT DISTINCT FROM OLD.donor_id AND NEW.donor_email IS NOT DISTINCT FROM OLD.donor_email THEN RETURN NEW; END IF;
 -- Lock both campaigns in stable order for reassignment safety.
 IF TG_OP='UPDATE' THEN
   FOR _id IN SELECT DISTINCT x FROM unnest(ARRAY[OLD.fundraiser_id,NEW.fundraiser_id]) x WHERE x IS NOT NULL ORDER BY x LOOP PERFORM public.recompute_fundraiser_totals(_id); END LOOP;
 ELSE PERFORM public.recompute_fundraiser_totals(NEW.fundraiser_id); END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.sync_donation_fundraiser_totals() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER donations_sync_fundraiser_totals AFTER INSERT OR UPDATE OF status,amount,fundraiser_id,donor_id,donor_email ON public.donations FOR EACH ROW EXECUTE FUNCTION public.sync_donation_fundraiser_totals();
CREATE OR REPLACE FUNCTION public.apply_donation_to_fundraiser(_fundraiser_id uuid,_amount numeric,_donor_email text,_donor_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN PERFORM public.recompute_fundraiser_totals(_fundraiser_id); END $$;
REVOKE ALL ON FUNCTION public.apply_donation_to_fundraiser(uuid,numeric,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_donation_to_fundraiser(uuid,numeric,text,uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.get_fundraiser_totals(_fundraiser_id uuid) RETURNS TABLE(total_raised numeric, donations_count bigint, retailers text[]) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT coalesce(sum(d.amount),0)::numeric, count(DISTINCT coalesce(d.donor_id::text,lower(d.donor_email),d.id::text))::bigint,
 coalesce((SELECT array_agg(DISTINCT trim(b)) FROM public.donations d2, unnest(string_to_array(coalesce(d2.brand_partner,''),',')) b WHERE d2.fundraiser_id=_fundraiser_id AND d2.status='completed' AND trim(b)<>''),'{}')
 FROM public.donations d JOIN public.fundraisers f ON f.id=d.fundraiser_id AND f.status IN ('active','paused','completed') WHERE d.fundraiser_id=_fundraiser_id AND d.status='completed';
$$;
DO $m$ DECLARE def text; BEGIN
 SELECT pg_get_functiondef('public.get_my_fundraiser_donations(uuid)'::regprocedure) INTO def;
 IF position('''count'', count(*)' in def)=0 THEN RAISE EXCEPTION 'Unexpected organizer ledger definition'; END IF;
 def:=replace(def,'''count'', count(*)','''count'', (SELECT count(DISTINCT coalesce(d.donor_id::text,lower(d.donor_email),d.id::text)) FROM public.donations d WHERE d.fundraiser_id=_fundraiser_id AND d.status=''completed'')');
 EXECUTE def;
END $m$;
CREATE OR REPLACE FUNCTION public.get_my_fundraisers() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in required' USING ERRCODE='42501'; END IF;
 RETURN coalesce((SELECT jsonb_agg(row_data ORDER BY created_at DESC) FROM (
 SELECT f.created_at,jsonb_build_object('id',f.id,'title',f.title,'category',f.category,'monthly_goal',f.monthly_goal,'cover_photo_url',f.cover_photo_url,'status',f.status,'unique_slug',f.unique_slug,'created_at',f.created_at,
 'amount_raised',t.raised,'donors_count',t.donors,'last_donation_at',t.last_donation,
 'coupons_ready',(SELECT count(*) FROM public.coupons c JOIN public.donations d ON d.id=c.donation_id WHERE d.fundraiser_id=f.id AND d.status='completed' AND c.has_credential AND c.status::text IN ('claimed','reserved','redeemed') AND c.revealed_at IS NULL AND c.used_at IS NULL AND (c.reserved_by=auth.uid() OR c.redeemed_by=auth.uid())),
 'fundraiser_images',coalesce((SELECT jsonb_agg(jsonb_build_object('image_url',i.image_url,'is_primary',i.is_primary,'display_order',i.display_order) ORDER BY i.is_primary DESC NULLS LAST,i.display_order,i.created_at) FROM public.fundraiser_images i WHERE i.fundraiser_id=f.id),'[]'::jsonb)) row_data
 FROM public.fundraisers f CROSS JOIN LATERAL (SELECT coalesce(sum(d.amount),0) raised,count(DISTINCT coalesce(d.donor_id::text,lower(d.donor_email),d.id::text)) donors,max(d.created_at) last_donation FROM public.donations d WHERE d.fundraiser_id=f.id AND d.status='completed') t WHERE f.user_id=auth.uid() AND f.archived_at IS NULL
 ) rows),'[]'::jsonb);
END $$;
REVOKE ALL ON FUNCTION public.get_my_fundraisers() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_my_fundraisers() TO authenticated,service_role;
CREATE OR REPLACE FUNCTION public.assert_fundraiser_totals() RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.fundraisers f CROSS JOIN LATERAL(SELECT coalesce(sum(d.amount),0) raised,count(DISTINCT coalesce(d.donor_id::text,lower(d.donor_email),d.id::text)) donors FROM public.donations d WHERE d.fundraiser_id=f.id AND d.status='completed') t WHERE f.amount_raised IS DISTINCT FROM t.raised OR f.donors_count IS DISTINCT FROM t.donors) THEN RAISE EXCEPTION 'Fundraiser stored totals differ from completed donations'; END IF; RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.assert_fundraiser_totals() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.assert_fundraiser_totals() TO service_role;