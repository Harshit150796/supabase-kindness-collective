-- Self-undoing integration proof. Never sends email or retains test donations.
BEGIN;
DO $$
DECLARE
 f uuid := '399ec0cf-480a-45a4-92e7-c2b4d9a0794e';
 a uuid := gen_random_uuid(); b uuid := gen_random_uuid();
 c uuid := gen_random_uuid(); e uuid := gen_random_uuid();
 base_amount numeric; base_count integer; owner uuid; payload jsonb;
BEGIN
 SELECT amount_raised,donors_count,user_id INTO base_amount,base_count,owner FROM public.fundraisers WHERE id=f;
 IF owner IS NULL THEN RAISE EXCEPTION 'Reference campaign missing'; END IF;
 INSERT INTO public.donations(id,fundraiser_id,amount,status,donor_email) VALUES(a,f,5,'completed','totals-proof@example.invalid');
 IF NOT EXISTS(SELECT 1 FROM public.fundraisers WHERE id=f AND amount_raised=base_amount+5 AND donors_count=base_count+1) THEN RAISE EXCEPTION 'Completed insert failed'; END IF;
 INSERT INTO public.donations(id,fundraiser_id,amount,status,donor_email) VALUES(b,f,10,'completed','TOTALS-PROOF@example.invalid');
 IF NOT EXISTS(SELECT 1 FROM public.fundraisers WHERE id=f AND amount_raised=base_amount+15 AND donors_count=base_count+1) THEN RAISE EXCEPTION 'Repeat guest identity was not deduplicated'; END IF;
 INSERT INTO public.donations(id,fundraiser_id,amount,status,is_anonymous) VALUES(c,f,5,'completed',true),(e,f,5,'completed',true);
 IF NOT EXISTS(SELECT 1 FROM public.fundraisers WHERE id=f AND donors_count=base_count+3) THEN RAISE EXCEPTION 'Unidentified guests must each count once'; END IF;
 UPDATE public.donations SET amount=20 WHERE id=a;
 IF NOT EXISTS(SELECT 1 FROM public.fundraisers WHERE id=f AND amount_raised=base_amount+40) THEN RAISE EXCEPTION 'Amount correction failed'; END IF;
 UPDATE public.donations SET status='refunded' WHERE id=b;
 IF NOT EXISTS(SELECT 1 FROM public.fundraisers WHERE id=f AND amount_raised=base_amount+30 AND donors_count=base_count+3) THEN RAISE EXCEPTION 'Refund reconciliation failed'; END IF;
 PERFORM public.apply_donation_to_fundraiser(f,20,NULL,NULL);
 PERFORM public.apply_donation_to_fundraiser(f,20,NULL,NULL);
 IF NOT EXISTS(SELECT 1 FROM public.fundraisers WHERE id=f AND amount_raised=base_amount+30) THEN RAISE EXCEPTION 'Legacy payment call double-counted'; END IF;
 UPDATE public.donations SET status='pending' WHERE id=a;
 IF NOT EXISTS(SELECT 1 FROM public.fundraisers WHERE id=f AND amount_raised=base_amount+10 AND donors_count=base_count+2) THEN RAISE EXCEPTION 'Removing last completed gift failed'; END IF;
 UPDATE public.donations SET status='completed' WHERE id=a;
 PERFORM set_config('request.jwt.claim.sub',owner::text,true);
 payload:=public.get_my_fundraisers();
 IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(payload) x WHERE x->>'id'=f::text AND (x->>'donors_count')::integer=base_count+3 AND (x->>'amount_raised')::numeric=base_amount+30) THEN RAISE EXCEPTION 'Owner list totals failed'; END IF;
 IF payload::text LIKE '%donor_email%' OR payload::text LIKE '%donor_id%' OR payload::text LIKE '%totals-proof@%' THEN RAISE EXCEPTION 'Owner list leaks identity'; END IF;
 IF (public.get_my_fundraiser_donations(f)->>'count')::integer<>base_count+3 THEN RAISE EXCEPTION 'Owner dashboard count is not distinct'; END IF;
 IF (SELECT donations_count FROM public.get_fundraiser_totals(f))<>base_count+3 THEN RAISE EXCEPTION 'Public count is not distinct'; END IF;
 PERFORM public.assert_fundraiser_totals();
END $$;
ROLLBACK;