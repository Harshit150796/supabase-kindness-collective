# Fix subscriber dates on the Newsletters page

## What the investigation found
- All 58 subscribers show the same date (Mar 25, 2026) because every one was added to the list in one bulk action that day. The page shows that "added to list" moment, not when the person actually joined.
- **8 subscribers came from website accounts.** Their real signup dates exist (Jan 2 – Mar 4, 2026) and are what you see elsewhere on the site, such as Users and Donors.
- **50 subscribers came from the Excel import.** The spreadsheet had no dates, so the database has none for them. Only one also has a website account, and that account was made later (Aug 23), so it can't be used as their join date. I won't make up dates for these 50.

## Changes
1. **Correct the 8 website subscribers:** set their "Added" date to their real account signup date. The change is recorded in the audit log.
2. **Label the Excel subscribers honestly:** show "Imported · Mar 25, 2026" so it's clear that's the import date, not a join date. If you have the original spreadsheet with real dates, send it and I'll load those dates instead.
3. **Make sorting match:** the "Added" column will sort by the date it shows. Right now it sorts by a different date.
4. **Stop it happening again:** future "Import site users" runs will use each person's account signup date, not the time of the import.

## Technical details
- One-time audited data update: `email_subscribers.subscribed_at = profiles.created_at` where `source='website_user'`, matched on lowercased email. The old values go into `admin_audit_log`. Nothing else is touched.
- Update the `admin_import_profile_subscribers` RPC to insert `subscribed_at = profiles.created_at`. This change is additive only.
- In AdminNewsletters.tsx, the Added column uses `key: 'subscribed_at'` and adds the "Imported ·" prefix when `source='excel_import'`.
- To verify, a query will show the 8 dates matching their profiles, and a screenshot of the page will confirm it. Nothing is published.
