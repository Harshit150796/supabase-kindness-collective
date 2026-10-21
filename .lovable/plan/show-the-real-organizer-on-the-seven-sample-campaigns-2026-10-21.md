# Show the real organizer on the seven sample campaigns

## Why it happens
Sample campaigns read the organizer's name from a separate field, and that field is empty on these seven campaigns. Because of that, the page shows a generic organizer instead of the real person.

## Change
Copy each campaign owner's real profile name into that field. The page then shows it in the usual short form (first name and last initial), the same as on live campaigns:
- Jesse's Homeless Family: harry
- Katie, Cancer and Homelessness: harry
- Nicole Avoid Homelessness: sophie
- Mother, Son and Three Dogs: Aashi S.
- Justin, Car Accident: Tg
- Feed My Family (active): James U.
- Feed My Family (paused): Preet K.

The organizer line, the team section and the share card will all use this name. Nothing says "CouponDonation".

## Verification
Read the organizer name back for each of the seven campaigns, and open one campaign page to check it.

## Technical details
One data update: `update fundraisers f set example_organizer = btrim(p.full_name) from profiles p where p.user_id = f.user_id and f.id in (7 ids)`. No code or schema changes.
