-- Security review follow-up (Nov 7, 2026): get_top_donors_week listed named donors' weekly totals to
-- anyone; the site no longer calls it, so only server code keeps it.
revoke all on function public.get_top_donors_week() from public, anon, authenticated;
grant execute on function public.get_top_donors_week() to service_role;

-- notify_donor_on_coupon_status_change is a trigger function: triggers run it whatever the grants, so no
-- browser role needs EXECUTE (an earlier migration removed only public and anon).
revoke all on function public.notify_donor_on_coupon_status_change() from public, anon, authenticated;