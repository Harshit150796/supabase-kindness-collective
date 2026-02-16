

## Add Distinct Colors to Donation Breakdown

Currently, all three breakdown items use very similar colors (primary green and two shades of muted gray), making them nearly indistinguishable. This plan adds vibrant, distinct colors to both the breakdown bars and the donut chart ring.

### Color Options

Here are three color palette options that work well with the existing Deep Emerald theme:

**Option A -- Emerald / Amber / Blue (Recommended)**
- Direct to Recipients (95%): Emerald green (`#10b981`) -- already your brand color, conveys growth and giving
- Platform Operations (3%): Amber/Gold (`#f59e0b`) -- warm, visible, matches your gold accent
- Payment Processing (2%): Sky blue (`#3b82f6`) -- cool contrast, trustworthy feel

**Option B -- Emerald / Purple / Orange**
- Direct to Recipients: Emerald green
- Platform Operations: Purple (`#8b5cf6`)
- Payment Processing: Orange (`#f97316`)

**Option C -- Emerald / Rose / Indigo**
- Direct to Recipients: Emerald green
- Platform Operations: Rose (`#f43f5e`)
- Payment Processing: Indigo (`#6366f1`)

I recommend **Option A** because amber/gold is already in your design system and the blue provides a professional, trustworthy contrast.

### Changes

**File: `src/components/landing/TrustTransparency.tsx`**

1. **Update `breakdownItems` array (line 112-116):** Change the `color` property from `bg-muted-foreground/50` and `bg-muted-foreground/30` to distinct Tailwind color classes:
   - Direct to Recipients: `bg-emerald-500` (keep green)
   - Platform Operations: `bg-amber-500` (gold/amber)
   - Payment Processing: `bg-blue-500` (sky blue)

2. **Update `AnimatedDonutChart` segments (line 44-48):** Match the donut ring colors to the breakdown bars:
   - Recipients segment: `#10b981` (emerald)
   - Operations segment: `#f59e0b` (amber)
   - Processing segment: `#3b82f6` (blue)

3. **Update breakdown item icons (line 327):** Color each icon to match its respective bar instead of all being `text-muted-foreground`:
   - Heart icon: `text-emerald-500`
   - PieChart icon: `text-amber-500`
   - DollarSign icon: `text-blue-500`

4. **Add colored dots as legend indicators** next to each label for even clearer differentiation (small colored circle before the text).

### Result

The donut chart will show three clearly distinct colored segments, and the breakdown bars below will use matching colors, making it instantly obvious which section corresponds to which percentage.
