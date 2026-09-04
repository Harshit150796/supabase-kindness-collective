# Remove "Beta" Language from the Website

Remove every user-visible "beta" reference so the front page (and the share modal) no longer states the platform is in a beta version. Text-only edits — no layout, styling, or logic changes.

## Files & exact changes

### 1. `src/components/landing/LiveActivityBar.tsx`
Two user-visible beta strings plus one code comment:

- **Line 32 comment** — `// Fixed beta-baseline figures — no simulated growth.`
  → `// Fixed baseline figures — no simulated growth.`
- **Lines 88–93 (Quick Stats, "Beta program" pill)** — currently:
  ```
  <Zap ... />
  <span ...>
    <span className="font-semibold text-foreground">Beta</span>
    <span className="hidden sm:inline"> program</span>
  </span>
  ```
  Replace the label content so it reads **"Live program"**:
  - `Beta` → `Live`
  - ` program` → ` program` (unchanged)
  Net visible text: "Live program".
- **Line 108** — ` raised during beta` → ` raised to date`

### 2. `src/components/landing/ImpactDashboard.tsx`
- **Line 35** — badge text `Beta Impact` → `Community Impact`

### 3. `src/components/apply/ShareModal.tsx`
- **Lines 303–305** — the orange "Beta" pill next to "Live fundraising tools":
  ```
  <span className="px-2 py-0.5 bg-orange-500/20 text-orange-500 text-xs font-medium rounded-full">
    Beta
  </span>
  ```
  Remove the entire `<span>` badge (keep the "Live fundraising tools" heading and surrounding layout intact).

## What is NOT touched
- The fixed stat values themselves ($1,250 raised, 24 donations, $10,000 total donated, 20 families) stay as-is — only the word "beta" is removed.
- No layout, color, spacing, font, or component-structure changes.
- No backend, Stripe, or donation logic.

## Verification
- TypeScript check on the three edited files.
- Load the home page headless at desktop and mobile widths; screenshot the Live Activity bar and Impact Dashboard; confirm no "Beta" / "beta" / "raised during beta" text renders.
- Open a fundraiser share modal and confirm the "Live fundraising tools" header shows no "Beta" pill.
- Re-run `rg -ni "beta" src/` (excluding comments if desired) and confirm zero user-visible matches.
