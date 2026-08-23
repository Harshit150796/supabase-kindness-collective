# One account, two capabilities

## Short answer

You are right — and the database already agrees with you. A trigger (`ensure_dual_roles`) gives **every** signup both `donor` and `recipient` roles automatically. So the "Donate / Receive" picker on signup creates no real separation today; it only changes which dashboard the user lands on first. It is a fake fork that adds a decision before the user has any context, and it quietly sets the wrong expectation ("I picked donor, so I probably can't ask for help here").

Recommendation: remove the picker, keep one generic account, and treat donating and receiving as **actions** the user takes, not account types.

## How other platforms handle it

- **GoFundMe** — one account. You sign up when you donate or when you start a fundraiser; nothing asks "are you a donor or a beneficiary". "Your fundraisers" and "Your donations" both live in the same account menu. Beneficiary identity/bank verification happens per-fundraiser at withdrawal time, not at signup.
- **Kickstarter / Indiegogo** — one account. Backing and launching are actions; a creator profile is created lazily the first time you launch.
- **Patreon, Ko-fi, Buy Me a Coffee** — one account; the "creator" side is unlocked on demand from the same login.
- **DonorsChoose** — the exception that proves the rule: teacher accounts are separate *because* eligibility (school employment) must be proven up front. When the receiving side requires hard gating, platforms split; otherwise they never do.

Pattern: split accounts only when the receiving side needs verification **before** the account is usable. In your model, coupon eligibility is verified per application/verification record, so the split buys nothing.

## Why two account types actively hurts you

- Extra pre-context decision at the highest-drop-off moment in signup.
- Donor-only users never discover they can ask for help; recipients feel excluded from giving back (the exact loop you want — recipients who later donate).
- Every feature ships twice: two dashboards, two histories, two nav trees, two sets of empty states.
- Stripe/compliance angle: a "recipient account type" reads like a payee class. A single user account where funds only ever become restricted retail vouchers is a cleaner story.
- Support/data mess: same human with two mental models, duplicate coupon views, ambiguous "which dashboard is truth".

Genuine loss from merging: the segmentation signal ("this person came to give"). Recoverable by recording *intent* — where they signed up from — instead of a role.

## Target shape

One account. Two surfaces inside it, both always available:

```text
My Account
├── Giving          donations made, stage of each donation,
│                   which retailers the vouchers went to, impact
└── Voucher Wallet  coupons received, issuing brand, value,
                    status (available / claimed / redeemed), expiry
     └── My Requests   fundraiser/assistance applications + verification status
```

`admin` stays a real, separate role — it gates access and must remain in `user_roles`.

## What changes

1. **Signup** — drop the Donate/Receive radio group. Keep name, email, password, OTP. Both roles are still written (trigger already does it), so nothing downstream breaks.
2. **Intent, not role** — remember where the signup came from (donate flow, apply flow, plain signup) and use it only to choose the first screen after signup and for analytics. No behaviour is locked by it.
3. **Unified dashboard** — a single `/dashboard` home showing two cards: "Your giving" and "Your voucher wallet", each with live counts and an empty state that invites the other action ("You haven't received vouchers yet — see if you're eligible").
4. **Navigation** — replace the role-derived sidebar with one fixed set: Home, Giving, Voucher Wallet, My Requests, Settings. Existing `/donor/*` and `/recipient/*` routes keep working as redirects so shared links and bookmarks survive.
5. **Post-auth routing** — replace the `hasRole('donor') ? '/donor' : '/recipient'` cascade with: admin → `/admin`, everyone else → `/dashboard` (or the intent target when signup happened mid-flow).
6. **Verification stays per-action** — asking for assistance still requires the application + verification record. That gate moves nowhere; it just is not implied by an account type.

## Technical notes

- No migration needed for the merge itself: `user_roles` already carries both roles for every user; `has_role` and all RLS policies keep working unchanged. Do **not** collapse `user_roles` — admin gating depends on it.
- Files touched: `src/pages/Auth.tsx` (remove role picker + role param), `src/hooks/useAuth.tsx` (`signUp` no longer takes a role choice; always writes both), `src/components/layout/DashboardLayout.tsx` (single nav set, drop `roleLabel` fork), `src/components/layout/Navbar.tsx` (dashboard link), `src/App.tsx` (add `/dashboard`, alias old paths), plus a new unified dashboard page that reuses the existing donor/recipient page bodies as sections.
- `GeoGuard` keeps guarding write/apply/admin routes exactly as now — it is route-based, not role-based, apart from the admin bypass.
- Rollout can be staged: step 1 (remove picker) is a few lines and safe on its own; steps 3–5 are the larger UI merge.

## Open question

Terminology for the two surfaces — "Giving" / "Voucher Wallet" is my proposal. If you prefer "My Donations" / "My Coupons", say so and I will use those everywhere.
