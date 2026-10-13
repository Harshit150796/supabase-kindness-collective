ALTER TABLE public.followup_sends ADD COLUMN IF NOT EXISTS sent_subject text, ADD COLUMN IF NOT EXISTS sent_body text, ADD COLUMN IF NOT EXISTS ai_written boolean NOT NULL DEFAULT false;

INSERT INTO public.followup_personas (persona_key,label,signals,evidence,subject,body,approved,approved_at) VALUES
('ready_to_give','Ready to give','["/donate","/f"]','{"summary":"Viewed donate or fundraiser pages"}','A quick note about giving',
'Hi {first_name},

Thanks for looking at how you can help a family get groceries. Every gift becomes grocery coupons, and the whole gift reaches the family.

When you are ready, you can give here: https://coupondonation.com/donate

— The CouponDonation team',true,now()),
('planning_fundraiser','Planning a fundraiser','["/apply","/fundraiser","/my-fundraisers"]','{"summary":"Viewed start or apply pages"}','Starting your fundraiser',
'Hi {first_name},

It looks like you are thinking about starting a fundraiser. It takes a few minutes, and we review every page to keep families safe.

You can pick up where you left off here: https://coupondonation.com/apply

— The CouponDonation team',true,now()),
('learning','Learning how it works','["/how-it-works","/faq","/about"]','{"summary":"Read how it works, FAQ or about"}','How your gift becomes groceries',
'Hi {first_name},

Thanks for reading about how CouponDonation works. In short, gifts become grocery coupons that families use at stores they already shop at.

The full step-by-step is here: https://coupondonation.com/how-it-works

— The CouponDonation team',true,now()),
('story_reader','Story reader','["/stories","/featured","/story-detail","/story"]','{"summary":"Read family stories"}','Families you read about',
'Hi {first_name},

Thanks for taking the time to read the stories of families on CouponDonation. Each one is a real household working through a hard stretch.

You can see more families here: https://coupondonation.com/stories

— The CouponDonation team',true,now()),
('partner','Possible partner','["/partners"]','{"summary":"Viewed partners page"}','Working together',
'Hi {first_name},

Thanks for looking at partnering with CouponDonation. We work with organizations that want to help families with groceries in a simple, dignified way.

You can tell us about your organization here: https://coupondonation.com/partners

— The CouponDonation team',true,now()),
('returning_donor','Returning donor','["/dashboard","/my-impact","/donor"]','{"summary":"Signed-in donor checking giving history"}','Your giving so far',
'Hi {first_name},

Thank you for giving through CouponDonation. You can see where your gifts went and how families used them at any time.

Your impact is here: https://coupondonation.com/my-impact

— The CouponDonation team',true,now())
ON CONFLICT (persona_key) DO NOTHING;

UPDATE public.admin_settings SET followup_live_sending = true WHERE id = 1;
INSERT INTO public.admin_audit_log (action, table_name, after) VALUES ('followup_seed_and_live_on','followup_personas','{"personas":6,"live":true,"by":"assistant at founder request"}');