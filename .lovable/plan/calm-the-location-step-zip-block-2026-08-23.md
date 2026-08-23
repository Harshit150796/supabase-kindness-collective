# Calm the location step (ZIP block)

The "Where are you located?" block on step 3 gets rebuilt in the "Inline confirmation" direction you picked. Only that block changes — the amount input, suggested chips, helper line and the Smart coupon matching card stay exactly as they are.

## What changes

- The big circular map-pin badge is gone. The heading and helper copy sit on their own, left-aligned, with tighter spacing.
- One full-width ZIP field with a small, quiet pin icon inside the left edge. The icon turns emerald while the field is focused.
- The wide letter-spacing on the digits is removed — normal, medium-weight numerals.
- When the ZIP resolves, a small emerald check and "Syracuse, NY" appear **inside** the field on the right, fading in gently. No detached floating text.
- Soft emerald focus ring instead of a hard border colour swap.
- On very narrow screens, if the city name would collide with the digits, the confirmation drops to a compact line just under the field so nothing overlaps.

## Technical notes

Single file: `src/components/apply/steps/GoalStep.tsx`.

- Replace the ZIP section markup: drop the `w-10 h-10 rounded-full` icon wrapper; heading becomes a plain `space-y-1.5` header block.
- Field wrapper `relative group`; `MapPin` absolutely positioned left with `text-muted-foreground group-focus-within:text-primary transition-colors`; input `w-full pl-12 pr-32 h-14 rounded-2xl bg-muted/40 border border-border` plus `focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary`, `tracking-normal`.
- Resolved `cityState` rendered in an absolutely positioned right-side node (`pointer-events-none`, `animate-fade-in`) with `Check` + `text-primary`; `pr-32` reserves its room. Below-field fallback shown via a `sm:hidden`-style guard only when the label is long.
- All colours through existing semantic tokens (`primary`, `muted`, `border`, `muted-foreground`) — no hardcoded gray/emerald utilities, so dark mode keeps working.
- No changes to `zipCode` state, validation, `useZipLocation`, or `ApplyRecipient.tsx`.
