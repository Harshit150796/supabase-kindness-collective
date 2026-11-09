# Shorter Share bar on tablets

## Why it's so long
On phones and tablets, a bar is pinned to the bottom of the fundraiser page with Donate and Share side by side, each taking half the width. This fundraiser is an example campaign, so Donate is hidden, and Share stretches across the whole screen. On a tablet that makes it about 860px wide.

## Fix
- Center the buttons in the bar and cap them at a phone-like width (about 480px). The bar's background still runs edge to edge, but the buttons no longer stretch across a tablet.
- When Share is the only button (example campaigns), it becomes a normal-sized button (about 200px), centered.
- With both buttons, they keep sharing the space equally, inside the capped width.
- Laptops are unchanged; they don't show this bar.

## Technical details
- `src/pages/PublicFundraiser.tsx`, lines 238–241: wrap the buttons in `mx-auto flex w-full max-w-md gap-3`. When `fundraiser.is_example` is true, the Share button uses `w-full max-w-[12.5rem]` with the row set to `justify-center`, instead of `flex-1`.
- Check it in the browser at tablet (890px) and phone widths.
