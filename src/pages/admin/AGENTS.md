# Admin portal rules
- Admin portal pages render inside AdminLayout (via DashboardLayout on /admin paths); lists use server-side pagination through DataTable, never whole-table loads.
- Admin mutations go through security-definer admin_* RPCs that re-check role (admin/staff/viewer) and write admin_audit_log; never rely on hidden buttons.
- Fundraisers are archived, not deleted; permanent delete only via admin_hard_delete_fundraiser with zero donations/coupons.
- No fundraiser UPDATE triggers; auto-tasks poll via admin-dispatch.
- One 5-minute pg_cron job calls admin-dispatch with a Vault secret; downstream dispatchers reject calls without it.
