# Make every Organizer tool on the fundraiser page work reliably

## What I found
- **Post update**: posting works through the safety check. But deleting an update has no error message, so a failed delete looks like it worked. Donor emails about updates go out on the 5-minute schedule. Nobody has confirmed that one has arrived yet.
- **Team / co-organizer invites**: the invite email is sent. But the list only shows the email address and "pending", there is no way to resend an invite, and removing someone gives no confirmation.
- **Settings**: the save button gives no feedback while saving, and pressing it twice can save twice. Unsaved changes are lost without warning.
- **Co-organizers**: once they accept, they may not be able to open a paused or pending fundraiser's tools, because they can only see a fundraiser that is live or one they own.

## What I'll change
1. **Updates tab**
   - Show a clear message when posting or deleting fails (including the safety block and the "try later" limit).
   - Ask for confirmation before deleting.
   - Show how many donors will get the email when "Email donors" is on.
2. **Team tab**
   - Show each person's status: Invited, Joined, Removed.
   - Add **Resend invite**. It sends a fresh link and turns off the old one.
   - Ask for confirmation before removing someone, and show a success message.
   - Show a clear error when the email is not valid, the person is already invited, or the team is full (10 people).
3. **Settings tab**
   - Show "Saving…" on the button and turn it off while saving.
   - Show **Save settings** only when something has changed.
   - Show the real error message if saving fails.
4. **Co-organizer access**: co-organizers can open the tools for fundraisers they help with, even while the fundraiser is paused or pending. They still cannot change the beneficiary or where coupons go.
5. **Inbox button**: confirm it opens the organizer's messages for this fundraiser.

## How I'll check it
- Sign in as the fundraiser owner and post an update with "Email donors" on, then delete it.
- Invite a test email address I control, resend the invite, remove the person, and confirm the email reaches Resend. I'll report the email ID and whether it was delivered.
- Toggle each setting, save, reload and confirm it stuck.
- Any step I can't observe will be reported as unverified. No real donors will be emailed during testing. Nothing gets published.

## Not changing
Payments, coupons, donations, totals, the homepage, and the safety rules on posts.

## Technical details
- `OrganizerTools.tsx`: error handling on delete, AlertDialogs, dirty-state and busy flags on settings, status labels.
- `fundraiser-actions`: new `resend_invite` action (organizer only, rotates the token hash, sends the email). Return friendly error strings instead of zod flatten objects.
- Additive migration: SELECT policy on `fundraisers` for `is_fundraiser_team(id, auth.uid())`. No triggers, nothing on payment tables.
- During testing, use only a test donor or an empty fundraiser so no real donors get queued emails.
