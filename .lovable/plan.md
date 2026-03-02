

## Admin Stories Page Redesign

### Overview
Redesign `/admin/stories` with a polished, professional UI and add a "Set as Featured" action so admins can pick which story shows in the homepage hero section.

### 1. Enhanced Story List Cards

Replace the current compact card rows with richer cards that show more information at a glance:

- Larger image thumbnails (80x80 instead of 64x64) with rounded corners
- Clear status badges: "Published" (green), "Draft" (gray), "Featured" (gold star badge)
- Inline stats row showing donation progress: "$1,680 / $2,000 (84%)" with a mini progress bar
- Donors count, category pill, and location displayed clearly
- Impact badge shown if present
- Better spacing and visual hierarchy

### 2. "Set as Featured" Action

Add a star/crown button on each story card:
- Clicking it sets that story to `display_order = 1` (the index the weekly rotation currently resolves to)
- The previously featured story gets bumped to the next available order
- A gold "Featured" badge appears on the currently featured story (the one at `display_order = 1` among published stories)
- This gives admins direct control over which story appears in the hero section without needing to manually juggle display_order numbers

### 3. Improved Edit/Create Dialog

Reorganize the dialog into clear sections with better labels and descriptions:
- **Basic Info** section: Name, Location, Category (with proper Select component instead of raw HTML select)
- **Story Content** section: Short Story (with placeholder guidance), Full Story
- **Fundraising Stats** section: Amount Raised, Goal, Donors Count -- with a visual progress preview
- **Media** section: Image upload with drag-drop styling
- **Settings** section: Impact badge, Display Order, Published toggle

### 4. Summary Stats Header

Add a stats bar at the top of the page showing:
- Total stories count
- Published vs Draft count
- Currently featured story name

### 5. Category Filter Tabs

Add filter tabs below the search bar: All | Family | Child | Emergency | Community
- Allows quick filtering by category in addition to the text search

### Technical Details

**File changed:** `src/pages/admin/AdminStories.tsx` (single file, complete rewrite of the component)

**No database changes needed.** The "Set as Featured" feature works by reordering `display_order` values in the existing `cms_stories` table -- the same mechanism already used by the up/down arrows.

**New imports:** `Star`, `Eye`, `DollarSign`, `Target`, `Filter` from lucide-react; `Badge` from ui/badge; `Tabs`/`TabsList`/`TabsTrigger` from ui/tabs; `Progress` from ui/progress; `Select`/`SelectTrigger`/`SelectValue`/`SelectContent`/`SelectItem` from ui/select.

**Key logic for "Set as Featured":**
```text
1. Find all published stories sorted by display_order
2. Set the target story to display_order = 1
3. Shift all other published stories' display_order values accordingly
4. Invalidate the cms-stories query cache
```

This ensures the HeroSection's weekly rotation formula (`weekIndex % stories.length`) picks the featured story at index 0.

