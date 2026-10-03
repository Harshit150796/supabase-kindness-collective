# Make "Edit fundraiser" open a working edit page

## Why you see the error
The "Edit fundraiser" button on your fundraiser page sends you to an edit page that was never built. The site doesn't recognise that address, so it shows "This page isn't here."

## What changes
- A new **Edit fundraiser** page at the address the button already uses.
- Only the fundraiser's owner can open it. Anyone else is sent back to the fundraiser page.
- You can change the **title**, **story**, **category** and **goal**, then press **Save changes** or **Cancel**.
- Photos are still managed on the fundraiser page, as they are now.
- After you save, you go back to your fundraiser page and see a confirmation message.

## Not changing
Donations, totals, payments, sharing and every other page stay the same.

## Technical details
- New `src/pages/FundraiserEdit.tsx` using the existing site layout and form components.
- Add the `/fundraiser/:id/edit` route in `App.tsx`, wrapped in the same `GeoGuard` as `/fundraiser/:id`.
- Load the fundraiser using the owner's existing access and check `user_id === auth user`. Save title, story, category and monthly_goal through the existing owner update permission (no database changes). Goal must be greater than 0. Stored totals are never touched.
- Check the save as the signed-in owner.
