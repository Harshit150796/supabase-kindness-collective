# Homepage live re-audit follow-up — Oct 6, 2026

## Changes
- Top Donors stays below the hero until 1280px (xl), and below it on all short viewports. No tree, lighting, material, cookie-bar or database changes.
- Fundraiser error and empty/no-results states fill the existing responsive reservation with centred copy, retry/reset actions and a Browse all stories link. Height is never released on errors.
- Audited every LazyOnView child: testimonials previously returned null and figures used a short unavailable paragraph; both now provide reservation-filling states. CompletedCampaigns may return null, but its sibling ImpactStories fills their shared reservation. TrustTransparency, SecurityBadges, CTASection and Footer always render content; DonationFlow retains its form structure. Existing content was not removed or merged.
- Fundraiser loading now permits three attempts, each with a 30-second timeout; backoff is 2 then 4 seconds (approximately 96 seconds maximum before an error, excluding browser suspension). Query cancellation is forwarded and listeners/timers are cleaned up. Existing batched card request remains unchanged.
- CountUp already used round in this checkout, not floor. The actual remaining bug was initial zero and animation from zero. Values below 10 now bypass animation entirely; initial/offscreen and reduced-motion renders use the final value. Larger animated counts round and never display zero for a positive total.

## Browser evidence (local preview, not published)
- 1024×768 and 1180×820: Top Donors overlay invisible; visible strip starts below the hero; CTAs clear.
- 390×844 and 1024×768: a MutationObserver captured the first figures render as $1,484 / $1,155 / $20 / 1 / 1. Every subsequent captured received/used count remained 1 / 1. Reduced-motion 390 also showed 1 / 1.
- Forced fundraiser 503 responses: three attempts with measured 2.0s and 4.0s backoff; centred error with retry and stories path, 1900px reserved section at 1024. Manual retry restored real cards; document height grew 9461 → 9522px, never shrank.
- Forced empty fundraiser list at 390: centred honest empty state and stories path.
- Delayed fundraiser response by 13 seconds: succeeded on its first attempt, with no error; the previous 12-second timeout would have aborted it.
- Forced testimonial and landing-stats failures at 390: designed centred states, no fabricated figures. Screenshots inspected.
- Top-to-bottom stepped viewport screenshots (~85% viewport) and back-to-top height logs:

| Size | Initial height | Final height | Samples | Decreases | Horizontal overflow |
| --- | ---: | ---: | ---: | ---: | --- |
| 390×844 | 10722 | 11263 | 32 | 0 | None |
| 768×1024 | 9423 | 10965 | 26 | 0 | None |
| 1024×768 | 9425 | 10072 | 32 | 0 | None |
| 1180×820 | 9431 | 9907 | 30 | 0 | None |
| 1440×900 | 9389 | 9872 | 26 | 0 | None |

No page runtime exceptions captured across those five runs. Screenshots and scripts are under /tmp/browser/landing-followup, with results.json containing measurements.

## Tests and limitations
- All 52 Deno tests pass (48 existing plus 4 tests of real shared count/retry logic).
- Latest preview build telemetry reports build OK. An independent TypeScript-only check was not run; the preview build is not proof of a separate typecheck.
- Browser verification uses local Chromium, not production after publishing or physical iPad/phone hardware. The 30-second timeout exhaustion was tested by policy assertions, not waiting through a full 96-second cellular stall. Immediate 503 exhaustion, manual retry and a real 13-second delayed response were exercised.
- This focused follow-up retested the five listed sizes, not the entire previous fourteen-size matrix. Protected authenticated screens were not retested.
- No publishing, database modifications, sample emails, payment changes or unique-content removals.
