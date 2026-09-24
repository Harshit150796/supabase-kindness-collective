CREATE OR REPLACE FUNCTION public.get_landing_stats()
RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select json_build_object(
    'donations_count', (select count(*) from donations where status='completed'),
    'total_raised', (select coalesce(sum(amount),0) from donations where status='completed'),
    'coupons_created', (select count(*) from coupons),
    'coupons_claimed', (select count(*) from coupons where status in ('claimed','redeemed')),
    'active_fundraisers', (select count(*) from fundraisers where status='active'),
    'brands', coalesce((select json_agg(t order by t.total desc) from (
        select db.brand_name as name, round(sum(db.allocated_amount)::numeric,2) as total
        from donation_brands db join donations d on d.id=db.donation_id
        where d.status='completed' group by db.brand_name having sum(db.allocated_amount)>0) t), '[]'::json)
  );
$$;
GRANT EXECUTE ON FUNCTION public.get_landing_stats() TO anon, authenticated;