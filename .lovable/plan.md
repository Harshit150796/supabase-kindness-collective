## Goal
Replace inflated stats in the Impact sections with realistic pre-launch numbers. Number/label swaps only — no layout or copy changes.

## Edits

### 1. `src/components/landing/ImpactDashboard.tsx` — `impactStats` array
| Label | Before | After |
|---|---|---|
| Total Donated | `$2.5M+` | `$10,000` |
| Families Helped | `15,000+` | `20` |
| Coupons Delivered | `50,000+` | `50+` |
| Countries Reached | `25+` | `3+` |

### 2. `src/components/landing/ImpactSection.tsx` — `stats` array
Mirror the same numbers for consistency:
| Label | Before | After |
|---|---|---|
| Total Value Donated | `$2.5M+` | `$10,000` |
| Families Supported (sublabel `Across 25 countries`) | `15,000+` | `20` (sublabel → `Across 3 countries`) |
| Partner Brands | `50+` | `6` |
| Satisfaction Rate | `98%` | leave as `98%` (not a count) |

## Not touched
- `LiveActivityBar`, `BrandLeaderboard`, `CTASection`, `TestimonialsSection`, hero — untouched.
- All headings, badges, icons, and styling stay identical.

## Open question
- `ImpactSection` "Partner Brands 50+" and "Satisfaction Rate 98%" — you didn't mention these. Proposing `50+ → 6` (matches actual brand count) and keep `98%` as-is. Say the word if you'd rather leave both untouched or change differently.
