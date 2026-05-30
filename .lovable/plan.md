# Hero Tree — Surrounding UI & AI Tree

You picked three additions (top tagline + CTA, right-side Top Donors leaderboard, AI Tree chat with live-data tools) but also picked the "Minimal" layout. I'm resolving that by keeping all three but designing them as small, **dismissible glass overlays** that never crowd the tree — the canvas stays the star.

## What you'll see on the hero

```text
┌──────────────────────────────────────────────────────────────┐
│   "Transparent · Trackable · Real-time"                       │
│            Every donation grows into groceries.               │
│              [ Donate now ]   [ How it works ]                │
│                                                               │
│                                              ┌──────────────┐ │
│                                              │ 🏆 Top Donors│ │
│                                              │  this week   │ │
│              🌳 (3D tree, untouched)         │  1. Sarah $..│ │
│                                              │  2. Mike  $..│ │
│                                              │  3. Anon  $..│ │
│                                              │              │ │
│                                              └──────────────┘ │
│                                                               │
│                                       ┌────────────────────┐  │
│                                       │ 🌿 Hi! I'm Coupon. │  │
│                                       │ Ask me anything →  │  │
│                                       └────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

All three overlays:
- Use the existing emerald/gold tokens, backdrop blur, rounded-2xl, soft shadow (same language as `TransparencyPopover`).
- Are `pointer-events-auto` only on themselves; the rest of the canvas keeps full interactivity (shake, day/night, coupons, plants).
- Collapse to a small pill on mobile (`<768px`) so the tree stays uncluttered on phones.

## 1. Top tagline + CTA (`HeroHeadline.tsx`)

- Position: `absolute top-6 left-1/2 -translate-x-1/2 z-30`, centered, max-width ~640px, text-center.
- Line 1: small uppercase rotating word — `Transparent` → `Trackable` → `Real-time` (3s interval, fade/slide).
- Line 2 (H1): "Every donation grows into groceries." — uses semantic foreground tokens with a subtle text-shadow so it stays legible on day/night skies.
- Buttons: primary "Donate now" (opens existing `BrandSelectorModal` / scrolls to `DonationFlow`) and ghost "How it works" (`/how-it-works`).
- Mobile: hides the rotating word, keeps H1 + single CTA.

## 2. Top Donors leaderboard (`TopDonorsPanel.tsx`)

- Position: `absolute top-24 right-4 z-30`, ~280px wide, glass card, collapsible (chevron toggle, remembers state in `localStorage`).
- Shows top 5 donors **this week** by total `amount`, joining `donations` → display name from `donor_name` (fallback "Anonymous" when `is_anonymous`).
- Visual: rank badge (1 gold, 2 silver, 3 bronze), avatar initial circle, name, total amount, tiny streak/sparkline.
- Auto-refresh every 60s; realtime channel on `donations` inserts to bump counts live with a brief highlight.
- "View full leaderboard" link at the bottom (no new page now — link to existing `/admin/analytics`? — actually link to a new lightweight `/leaderboard` route only if you want; default = scroll to `BrandLeaderboard` section).
- Hidden on mobile by default; available via a small floating "🏆" button bottom-right.

## 3. AI Tree chat ("Talk to Coupon") (`AITreeChat.tsx` + `supabase/functions/coupon-chat/`)

- Trigger: a small floating leaf-button bottom-right of the hero, label "Talk to Coupon 🌿". Click opens a 360×520px glass chat panel anchored bottom-right (above the leaderboard area on desktop; full sheet on mobile).
- Greeting: "Hi! I'm Coupon, the tree. Ask me about active campaigns, where your money goes, or pick a cause to support."
- Suggested prompt chips:
  - "Show me hunger campaigns near me"
  - "How does CouponDonation work?"
  - "Where does my money go?"
  - "Suggest a campaign for $25"
- Streaming responses, markdown rendering, message history per browser session (localStorage; single conversation, not threaded — keeps it lightweight per the chat-agent contract since no persistence was requested).
- Built on AI Elements primitives (Conversation, Message, MessageResponse, PromptInput, Shimmer) per the chat UI contract.

### AI backend (Supabase Edge Function)
- Function: `coupon-chat`, streams via AI SDK + Lovable AI Gateway, model `google/gemini-3-flash-preview`.
- System prompt: friendly, plant-themed persona; only answers about CouponDonation, donations, transparency, active fundraisers. Politely declines off-topic asks.
- Tools (Q&A + live data, no checkout):
  - `searchFundraisers({ query?, category?, region?, limit })` — reads `fundraisers` where `status='active'`, returns title, slug, goal, raised, location.
  - `getImpactStats()` — totals: lifetime donations, coupons created, families helped, today's totals.
  - `getTopDonors({ window: 'today'|'week'|'all' })` — same data as the leaderboard panel.
  - `explainTransparency()` — returns the 95/3/2 breakdown copy.
  - `getActiveBrands()` — list of partner brands accepting donations.
- All tools are read-only Supabase queries from inside the edge function (uses anon client, respects existing RLS for `fundraisers`). No mutations, no checkout creation in this phase.
- `stopWhen: stepCountIs(50)`.

### Client wiring
- `useChat` from `@ai-sdk/react`, `DefaultChatTransport` pointed at the edge function URL (`SUPABASE_URL/functions/v1/coupon-chat`).
- Render tool calls inside collapsed accordion under each assistant message — when a fundraiser search runs, results render as compact cards with a "View" link to `/f/:slug` and a "Donate" link to `/donate?fundraiser=…`.

## Files to add / change

**New**
- `src/components/landing/hero/HeroHeadline.tsx`
- `src/components/landing/hero/TopDonorsPanel.tsx`
- `src/components/landing/hero/AITreeChat.tsx`
- `src/components/landing/hero/AITreeLauncher.tsx` (floating leaf button)
- `src/hooks/useTopDonors.ts` (week-window query + realtime)
- `supabase/functions/coupon-chat/index.ts`
- `supabase/functions/_shared/ai-gateway.ts` (Lovable AI Gateway provider helper — only if not already present)
- AI Elements components installed via the AI Elements CLI (`conversation`, `message`, `prompt-input`, `shimmer`)

**Edited**
- `src/components/landing/HeroSection.tsx` — wraps the existing `Tree3DScene` and overlays the three new components in a relative container; no changes to the 3D scene itself.
- `supabase/config.toml` — register the new edge function.

**Untouched**
- All `tree3d/*` components, `Tree3DScene.tsx`, interactions, sky, ground, coupons, plants, fireflies.

## Out of scope (for this round)
- AI Tree taking checkout actions (would require `needsApproval` tool + handing off to Stripe). Easy follow-up later.
- New `/leaderboard` page.
- Voice input on the AI chat.
- Seasonal skins / weather / goal-meter-as-tree.

## Technical notes (for the developer reader)
- All overlays sit in a single `<div className="absolute inset-0 pointer-events-none z-20">` so individual cards can opt into `pointer-events-auto`.
- The Top Donors query: `select donor_name, is_anonymous, sum(amount) as total from donations where status='succeeded' and created_at > now() - interval '7 days' group by 1,2 order by total desc limit 5` — exposed via a SECURITY DEFINER RPC `get_top_donors_week()` so RLS on `donations` (donor-scoped) doesn't block public reads. New migration adds the function + grants `EXECUTE` to `anon, authenticated`.
- Edge function uses `LOVABLE_API_KEY` (auto-provisioned if missing). No client-side keys.
- Realtime: subscribes to `postgres_changes` on `donations` insert; on event, re-runs the RPC (debounced 5s).
- Chat persistence = localStorage only (one conversation per browser, "Clear chat" button). Matches "no DB persistence" choice implicit in keeping this lightweight.

Approve this and I'll build it; or tell me which pieces to drop/swap (e.g., skip the AI chat for now, or add checkout to the tree).
