# Bring back the test totals on the homepage

## What happened
The homepage figures depend on one switch: Admin → Settings → "Include trial stats". When it's on, the totals include the sample gifts and coupons. When it's off, they show real gifts only ($800 donated, $485 being prepared, $70 issued, 2 received).

The switch was turned off on Oct 24 by the legal/privacy database update you sent ("legal.patch" step 2). Its SQL contained `update admin_settings set include_trial_stats = false`, and I reported it at the time as "was true before, is false after". Nothing changed it on its own, and no sample gifts or coupons were deleted. The calculation that adds samples and real coupons together is still in place.

## Fix
1. Turn the "Include trial stats" switch back on (one data change, no code change).
2. Read back the homepage figures to confirm they are the combined sample + real totals again (last time: about $24,965 donated from 291 gifts, 882 coupons worth $25,649, 825 used, with retailer bars adding up to the same total).
3. Report the exact new numbers.

## Keep in mind
- With the switch on, "Coupons being prepared" shows $0. In test mode every coupon is counted as issued, which is how it worked before too.
- Turn the switch off again before publishing, so visitors don't see sample figures as real ones. The legal update did exactly that, which is why the numbers went back.
- Nothing published, no code or design changes.
