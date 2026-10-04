# Richer coupon credentials, issued brand, partial issuance, recipient alerts

## Audit findings (current state)
- The editor (`FundraiserCouponsTab`) refuses to save unless lines add up exactly to the brand total, and caps each line at $1–$500. The server (`admin_save_coupon_group`) enforces the same sum.
- The editor's target is the current sum of coupon rows, not `donation_brands.allocated_amount`, so leftover cents never show.
- Recipient alerts: after a save, the browser calls `fundraiser-actions` → `notify_coupon_ready` with the changed ids. It has no per-coupon "already notified" key, so a retry or a second call can notify twice, and if the browser closes after saving, no alert is sent. This gets unified (see 4).
- Brand logos: no Visa, Mastercard or American Express files yet.

## 1 — Credential types per coupon line
Type: **Code** (code, optional PIN, optional link) · **Gift card** (card number, PIN, optional link) · **Prepaid debit card** (number, MM/YY, CVV, optional cardholder name, billing ZIP). All types: value-expiry date and optional recipient instructions.
Inline validation (also enforced on the server): Luhn for prepaid numbers, CVV 3–4 digits, MM/YY not past, ZIP 5 or 5+4, lengths limited.

### Encryption design
- AES-256-GCM, 96-bit random IV per field, with a context tag (coupon id + field name) so a value can't be moved to another row. Stored as `v1:<key_id>:<iv>:<ciphertext+tag>` base64.
- Key: `COUPON_SECRET_KEY_V1` (64 bytes random), stored as an edge-function secret and **never in the database**. `key_id` makes rotation possible: add `_V2`, new writes use V2, and a one-off admin re-encrypt job moves old rows over before V1 is removed.
- Encryption and decryption happen **only in a new `coupon-secrets` edge function**. Its actions: `admin_save_group` (encrypts, then calls the audited RPC with ciphertext + last4), `owner_reveal` (calls the existing `owner_reveal_coupon` for permission, first-reveal recording and donor-email queueing, then decrypts) and `admin_reveal` (staff only, audited).
- The database holds only ciphertext + `last4`. The ciphertext columns get no grants for anon/authenticated (same as `code`); only service_role can read them.
- Never logged: the function strips secrets from errors and doesn't write request bodies to logs.
- Returned records (Fix 2) copy the ciphertext unchanged into the `returned` row, so it stays encrypted.
- Existing plaintext `code`: recommend migrating it later in a separate, approved step. The risk is that if decryption fails mid-migration, codes could be lost, so it needs a dual-read period and a verified backup first. For now new e-codes also go encrypted, and old rows keep working through a fallback read.

## 2 — Brand shown to the recipient
- `issued_brand` per line, defaulting to the donor's brand, chosen from the logo catalog. Add Visa, Mastercard and Amex SVGs from Simple Icons (CC0), in their official colours and proportions.
- If it differs from `store_name`, the server requires a reason (5–200 chars), which goes into the audit log. The donor's impact view and emails say: "You chose DoorDash; it was issued as a Visa prepaid card because …".
- `store_name` stays the money trail and is unchanged.

## 3 — Partial issuance, top-ups, no cap
- Target = `donation_brands.allocated_amount`. Any non-void total up to the target saves fine. The editor shows "$10 of $20 issued · $10 to issue". The admin overview shows a "to issue" total, and the donor sees "$X being prepared".
- Going over the target requires a "Platform top-up" amount + reason. That's stored, audited and shown to the donor as "CouponDonation added $5". The server rejects any over-issue without a matching top-up.
- No $500 cap. Any amount over $0.01 is allowed, with a confirmation prompt for any line over $1,000.
- Before building, I'll report how many existing donation/brand groups will show a remaining balance, and the total.
- Unchanged: void-not-delete, returned-code preservation, owner-only codes, and no triggers.

## 4 — Tell the owner when credentials are added
- The save RPC writes one `coupon_ready` row per coupon into a new `coupon_owner_alerts` queue, unique on (coupon_id, credential_version). The version only goes up when new credentials are genuinely set, so re-saving doesn't notify again.
- The existing 5-minute dispatcher sends **one email per fundraiser per run** listing the coupons ("You've received a $20 DoorDash coupon…", with the logo, no codes or card details), plus an in-app notification.
- `notify_coupon_ready` becomes a thin "send now" trigger for the same queue, so there is one path and no duplicates. Procurement uses it too.

## 5 — Reveal for every type → donor email
- Same owner-only reveal as today: first reveal recorded once, and the "gift arrived" email queued once.
- Reveal UI: card number grouped in fours, expiry, CVV, PIN, instructions, a Copy button per field, and a Hide toggle. Co-organizers see only status and last 4.
- Impact emails name the issued brand and include the brand-change disclosure or top-up note.

## Proofs (self-undoing tests on made-up data)
Database holds only ciphertext (a raw select shows `v1:` blobs, no digits); owner reveal returns plaintext; co-organizer, donor, random user and signed-out get nothing, including direct selects of the cipher columns; admin reveal writes the audit log; last-4 masking in lists, audit log, CSV and notifications; Luhn and CVV rejections; partial save accepted; over-issue without a reason rejected; brand change without a reason rejected, and with one disclosed in `get_donation_impact`; one owner alert per save, none on re-save; donor email queued once on first reveal. Results reported as pass, fail or unverified.

## Sample emails
Only to connect.coupondonation@gmail.com, labelled SAMPLE: (a) the owner's "You've received a coupon" email, (b) the donor's "gift arrived" email for a Visa prepaid card with a brand-change disclosure. I'll report each Resend ID and its last_event; only "delivered" counts.

## Risks and recommendations
- **PCI: storing full card numbers and especially CVVs is the biggest risk.** PCI DSS forbids keeping CVV after authorization for cardholder data, and storing PANs brings the platform into PCI scope (SAQ D-level controls, key management, access reviews). Stripe/Square representations may also matter. Recommendation: buy prepaid cards through a provider (for example Tremendous) that hosts the card details behind a redemption link, and store only that link. If the founder still wants manual card entry, I'll build it as specified and add: a CVV that auto-purges 30 days after first reveal, staff-only entry, and a notice in the admin editor. **This needs the founder's decision before build.**
- Losing the key makes the secrets unreadable: keep an offline copy of the key value. Only the user can set this in Settings (I'll generate it, so they can't copy it, so I'd ask the founder to create and save it themselves).
- Partial issuance means donors may see "being prepared" balances for a long time, so the "to issue" admin total should be worked down.
- AGENTS.md is close to its size limit, so the rules will be merged into existing lines.

## Technical details
- Schema (additive): `coupons` gets `credential_type text`, `secret_cipher jsonb` (number/pin/cvv/code ciphertexts), `card_last4`, `card_exp_month/year`, `cardholder_name_cipher`, `billing_zip_cipher`, `value_expires_on date`, `recipient_instructions text`, `issued_brand text`, `brand_change_reason text`, `credential_version int default 0`. New tables `donation_brand_topups(donation_id, brand, amount, reason, created_by)` and `coupon_owner_alerts`, with grants for service_role only plus RLS.
- `admin_save_coupon_group` v2 takes items with type, ciphertext and metadata. It enforces `sum(non-void) <= allocated + topups` to the cent, requires reasons, bumps `credential_version` and queues alerts. It's callable only with the service role from `coupon-secrets` after the role re-check (`is_admin_staff` re-verified from the caller's JWT).
- `get_my_fundraiser_coupons`, `admin_fundraiser_coupons`, `get_donation_impact`: add type, issued_brand, last4, to-issue and top-up fields, never ciphertext.
- `impact-dispatch` / `admin-dispatch`: send the owner-alert batch, and add disclosures to the impact templates.
- UI: `CouponGroupEditor` type selector, per-type fields and the issued-brand picker; `OwnerCouponsSection` per-type reveal; `DonorImpactView` disclosure and pending balance.
- No triggers; webhooks, checkout and coupon creation untouched.
