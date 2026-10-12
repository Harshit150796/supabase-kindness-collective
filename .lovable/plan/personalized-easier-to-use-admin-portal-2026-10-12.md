# Personalized, easier-to-use admin portal

## Goal
Improve the whole admin portal, starting with Fundraisers. Combine **each team member’s own priorities** with **richer donor and fundraiser context**, while preserving the existing green/blue identity and all financial, privacy and permission rules.

## Confirmed gaps
- Donors and Users have no record-detail view; the Donors page mainly links to a filtered donation list.
- The Fundraisers page’s “Images & legacy editor” link redirects back to the same page.
- Outside-coupon donor and stock selectors load capped lists rather than searchable, paginated results.
- The notification bell counts only its latest 15 items, and its “Mark all read” affects only that batch.
- Moderation uses the public navigation, capped 200-row lists and direct status updates instead of the portal’s audited mutation pattern.
- The donor CSV export requests only the first 200 records.

## 1. Personal workspace and consistent navigation
- Add a named greeting, **My work / Team overview** switch, assigned and overdue tasks, and direct links to the records needing attention. Keep platform totals separate from personal priorities.
- Let each team member save named filters, choose a default view and pin useful destinations.
- Preserve filters, sorting, page and open-record/tab context when moving between records or returning to a list.
- Standardize headers, search, menus, loading/retry states, empty results and success feedback. Keep the workspace dense and scannable, not a collection of decorative cards.
- Clear personal data and cached views when the signed-in account changes.

## 2. Fundraisers first
- Give the detail view a persistent fundraiser title, organizer context, status, public-page link and clear primary actions.
- Group the many tabs into understandable operations: overview, coupons, supporters, content/team and review/history. Preserve every existing capability.
- Surface linked tasks, outstanding coupon work and reports with direct actions; allow creating an assigned follow-up task without leaving the fundraiser.
- Remove the dead legacy-editor link. Keep the current gallery controls and imagery fallback order.
- Protect unsaved edits when closing a drawer, changing records or leaving the page. Use consistent confirmation dialogs instead of scattered native prompts.
- Add selected-record lifecycle actions where safe, with explicit confirmation, per-record results and individual audit entries. Never silently approve campaigns or change approval defaults.

### Coupons and donor communication
- Keep site-donation coupons and **From other sources** clearly separated, including their different effects on financial totals.
- Turn the outside-coupon form into a clear **Coupon → Donor/source → Review** flow, retaining any brand, manual entry or stock, existing/new/no donor, anonymity and recipient choices.
- Replace capped donor/stock dropdowns with searchable, paginated pickers. Include eligible outside-source donors as well as donation-linked donors; never create a fake payment transaction.
- Show field-specific validation and a review of brand, value, source and email recipients before saving. Keep credentials masked in summaries.
- Show recorded email state and distinguish “coupon saved” from “email failed.” Provide the existing explicit outside-source send/resend workflow with recipient confirmation.
- For ordinary checkout confirmations, show delivery status and support investigation/retry of genuinely unsent mail only; preserve exactly-once confirmation per checkout reference.

## 3. Connected donor and user records
- Add donor and user detail views with their linked fundraisers, donations, coupon contributions, recorded communication status and activity.
- Add private team notes and assigned follow-up tasks attached to the correct record, with author and timestamp.
- Handle guest donors and outside-source donors without falsely creating accounts or merging different people. Preserve public anonymity.
- Use exact record identities for related-history queries, not a broad email search that could match unrelated records.
- Keep role changes in the existing restricted access area; do not introduce role-editing controls in Users or Donors.

## 4. Close portal-wide workflow gaps
- **Moderation:** move into the persistent admin layout, add server-side pagination and filters, explicit audited message-body viewing, and audited resolve/dismiss/review actions. Make fundraiser reports actionable through the same protected workflow.
- **Notifications:** use one shared unread count across the bell and full page; offer distinct “Mark page read” and genuine “Mark all read” actions scoped to the current team member. Handle failures visibly.
- **Tasks, contact and partner inquiries:** make record links consistent, add contextual follow-up creation, and preserve current task-board and contact status behavior. Do not imply that opening a reply composer means an email was sent.
- **Coupons/procurement:** make stock, waiting and failure states clearer, retain filters and show action results in-page rather than only in a disappearing toast. No changes to purchase or auto-fill rules.
- **Donations/analytics:** add precise drill-through links and complete, filter-aware exports; fix the donor export’s 200-record cap. Financial records remain read-only.
- **CMS/newsletters/settings/audit:** apply the same navigation, form validation, unsaved-change protection and feedback standards. Make existing previews and delivery/history views easier to reach; show readable audit summaries with optional raw detail. Preserve publishing, subscriber consent and send behavior rather than adding new campaigns or automatic emails.

## Technical approach and safeguards
- Extend the existing admin layout, paginated tables and shared record/form patterns rather than creating a second portal.
- Before any database change, inspect live functions, grants, RLS, defaults and available structures. Reuse existing saved-view/task/audit support where appropriate; add only the necessary private notes/preferences or protected operations through additive migrations.
- Validate every new operation on the server for admin/staff/viewer; audit business mutations and sensitive views. UI visibility is not permission enforcement.
- Keep secrets out of personal preferences, notes, URLs, exports and logs. Use private signed receipt links and audited coupon reveals; prepaid remains a hosted link only.
- Preserve completed-donation totals, outside-coupon accounting, checkout deduplication, archive safeguards, beneficiary/payout routing and the existing dispatcher schedule. No fundraiser UPDATE triggers or payment-flow changes.
- Do not change the homepage, cookie bar or public marketing pages. Do not publish the website or send live test emails. Deploy only approved admin-function changes required for these workflows.

## Verification and completion
- Implement in the order above, tracking every admin area in a lean checklist so this is a portal-wide pass rather than only a fundraiser redesign.
- Test role boundaries, private-note ownership/access, saved-view isolation, complete exports, notification counts beyond one page, coupon validation and email deduplication.
- Verify search → open fundraiser → add outside coupon → review recipients → save → read back the record, plus donor history, notes/tasks and moderation resolution.
- Check drawer/forms, keyboard access and narrow/wide layouts, and confirm a passing build.
- **Current limitation:** this project uses external Supabase without a managed test session. Authenticated end-to-end verification is currently unavailable; public/source checks are not a substitute. Report any authenticated flows as unverified unless a safe supported session becomes available; do not request credentials or send real donor/organizer emails to compensate.