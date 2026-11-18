# Keep the Thanksgiving bar showing on every device

## Why phones don't show it
Nothing is wrong with phones. The bar was set to show on **Nov 17 only**, until 11:59 PM Eastern. It is now past midnight Eastern (Nov 18), so any device that opens the site now gets the Holiday Giving Drive bar instead.

The laptop still shows it because that page was opened before midnight. The site only checks the date when the page loads, so an open tab keeps the old bar until it is refreshed. Refresh the laptop and it will switch too.

(Also: pressing the × on the bar hides it for the rest of that visit, on any device.)

## Proposed change
- Extend the bar's end time to **Nov 26, 2026, 11:59 PM Eastern** (the offer's own deadline), so it shows on laptops, tablets and phones until then. After that, the Giving Drive bar comes back by itself.
- Update the date in the code note and its rule note.

## Technical details
- `src/lib/thanksgivingOffer.ts`: `barEndsAt` `2026-11-18T04:59:59Z` -> `2026-11-27T04:59:59Z`; update the doc comment.
- `src/components/drive/DriveBar.tsx` comment and `src/components/drive/AGENTS.md` note if they mention Nov 17 only.
- Check with `?thanksgiving` unset at phone and laptop widths. Nothing published.
