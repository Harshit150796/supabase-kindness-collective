CREATE OR REPLACE FUNCTION public.notify_donor_on_coupon_status_change()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE notif_title text; notif_message text; brand text; val numeric; pid uuid;
BEGIN
  IF NEW.donor_id IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN RETURN NEW; END IF;
  -- notifications.user_id references profiles.id, not the auth user id
  SELECT id INTO pid FROM public.profiles WHERE user_id = NEW.donor_id;
  IF pid IS NULL THEN RETURN NEW; END IF;
  brand := COALESCE(NEW.store_name, 'a partner brand');
  val := COALESCE(NEW.value, NEW.expected_value, 0);
  IF NEW.status = 'available' AND (TG_OP = 'INSERT' OR OLD.status = 'pending_procurement') THEN
    notif_title := 'Your coupon is live';
    notif_message := 'Your $' || val::text || ' ' || brand || ' coupon is now available for a verified family.';
  ELSIF NEW.status = 'claimed' OR NEW.status = 'reserved' THEN
    notif_title := 'A family claimed your coupon';
    notif_message := 'A verified family just claimed your $' || val::text || ' ' || brand || ' coupon.';
  ELSIF NEW.status = 'redeemed' THEN
    notif_title := 'Your coupon was redeemed';
    notif_message := 'Your $' || val::text || ' ' || brand || ' coupon was used today. Thank you for making this possible.';
  ELSE
    RETURN NEW;
  END IF;
  INSERT INTO public.notifications (user_id, title, message) VALUES (pid, notif_title, notif_message);
  RETURN NEW;
END;
$function$;