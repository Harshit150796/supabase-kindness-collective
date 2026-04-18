
The user wants to remove the hanging brown/green branches and vines visible across the landing page (the ones in `AnimatedBranchesLeft` and `AnimatedBranchesRight` overlays). The screenshot shows the brown wooden branch on the left and green stem on the right that overlay the page content.

The `CentralTree` in the hero section was not mentioned — only the page-wide hanging branches/vines. But to be safe, I should clarify whether they want to keep the CentralTree (the animated tree centerpiece between the two hero images) or remove that too.

Actually, re-reading: "remove all these hanging branches and vines from all over the page" — the screenshot clearly shows the side-hanging branches (left brown wood + right green stem). The CentralTree sits between hero images, not "hanging all over the page". I'll remove only the side overlays and keep CentralTree, but note this in the plan.

## Remove Hanging Branches & Vines Overlays

### What to remove
The brown wooden branches (left side) and green vines/stems (right side) that overlay the entire hero-to-trust section of the landing page.

### Changes

**`src/pages/Index.tsx`**
- Remove `<AnimatedBranchesLeft />` and `<AnimatedBranchesRight />` from the relative wrapper
- Remove their imports
- The `<div className="relative">` wrapper can stay or be unwrapped (keeping it is harmless)

**Delete files (no longer used):**
- `src/components/landing/AnimatedBranchesLeft.tsx`
- `src/components/landing/AnimatedBranchesRight.tsx`

**Keep as-is:**
- `CentralTree` component inside `HeroSection` (the tree between the two hero images) — this is not a "hanging branch overlay", it's the hero centerpiece. If you also want this removed, let me know.
- Vine/tree CSS keyframes in `src/index.css` — harmless if unused, and `CentralTree` still uses them.

### Memory updates
- Remove `mem://style/animated-branch-overlays` (no longer applies)
- Update `mem://index.md` to drop that reference

### Files changed
- `src/pages/Index.tsx` — remove imports + JSX usage
- Delete `src/components/landing/AnimatedBranchesLeft.tsx`
- Delete `src/components/landing/AnimatedBranchesRight.tsx`
- Memory cleanup
