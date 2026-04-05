

## Add Custom Amount Input to Donation Flow

### Problem
Step 2 of the donation flow only allows selecting from preset buttons ($10, $25, $50, $100, $200) and a slider capped at $500. Users who want to donate specific amounts like $21, $500+, or $1000 have no way to type a custom value.

### Plan

**Edit `src/components/landing/DonationFlow.tsx`**

1. Add a custom amount input field between the preset buttons and the slider
   - A text input styled with a "$" prefix, allowing users to type any amount
   - Include a "Custom" button alongside the presets that focuses the input
   - Validate: minimum $5, maximum $10,000 (or reasonable upper limit), whole numbers only
   - On typing, deselect any preset button highlight and update the amount state
   - On selecting a preset, clear the custom input

2. Update the slider max from 500 to match the typed amount if it exceeds 500, or keep slider as a secondary control for the $5-$500 range

3. Add `Input` import from `@/components/ui/input`

### UI layout (Step 2)
```text
          [$10] [$25] [$50] [$100] [$200] [Custom]
          
          ┌──────────────────────────┐
          │ $  |  Enter amount...    │
          └──────────────────────────┘
          
          ──────── slider ────────
            $5                $500
```

### Validation
- Enforce min $5 via blur validation with toast error
- Allow amounts above $500 (slider becomes secondary)
- Sanitize non-numeric input

### Files changed
- `src/components/landing/DonationFlow.tsx` — Add custom input field, validation logic, update imports

