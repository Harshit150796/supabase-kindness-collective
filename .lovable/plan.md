

## Fix: Make Jean-Pierre the Current Featured Story

### Root Cause
The weekly rotation formula `Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % cmsStories.length` currently resolves to index 0 (Amina K.) for this week. The "flash" you saw was likely the component rendering before CMS data loaded (showing fallback), then switching to the CMS result (Amina).

### Solution
Reorder the `display_order` values so Jean-Pierre is at position 1 (first in the rotation). This guarantees he shows as the current featured story.

### Database Update (data only, no schema change)
- Set Jean-Pierre L. to `display_order = 1`
- Set Amina K. to `display_order = 2`  
- Set Grace N. to `display_order = 3`
- Shift Martinez Family to `display_order = 4`, others accordingly

### No Frontend Code Changes
The existing rotation logic will now pick Jean-Pierre (index 0) as the featured story this week.

### Files Changed
- None (data-only update via Supabase)

