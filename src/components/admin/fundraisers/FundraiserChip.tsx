import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { sb } from '@/lib/adminApi';
import { resolveFundraiserImage } from '@/lib/fundraiserImages';
import { cn } from '@/lib/utils';
import { FundraiserThumb } from './FundraiserThumb';

export type FundraiserPhoto = { id: string; title: string; status: string | null; category: string | null; help_categories: string[] | null; photo_url: string | null };

/**
 * Photos and titles for the fundraisers on one page of any admin list, in one small query
 * (the same photo rule as the public site: primary gallery photo, first in order, then the old cover).
 */
export function useFundraiserPhotos(ids: Array<string | null | undefined>) {
  const unique = [...new Set(ids.filter(Boolean) as string[])].sort();
  return useQuery({
    queryKey: ['adm-fr-photos', unique],
    enabled: unique.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await sb.from('fundraisers')
        .select('id,title,status,category,help_categories,cover_photo_url,fundraiser_images(image_url,is_primary,display_order,created_at)')
        .in('id', unique);
      if (error) throw error;
      const map = new Map<string, FundraiserPhoto>();
      for (const f of (data ?? []) as Array<Omit<FundraiserPhoto, 'photo_url'> & { cover_photo_url: string | null; fundraiser_images: Array<{ image_url: string; is_primary: boolean | null; display_order: number | null; created_at: string | null }> }>) {
        map.set(f.id, { id: f.id, title: f.title, status: f.status, category: f.category, help_categories: f.help_categories, photo_url: resolveFundraiserImage(f) });
      }
      return map;
    },
  });
}

/** A fundraiser's photo and title, linking to it in Admin > Fundraisers. */
export function FundraiserChip({ id, title, photos, size = 32, tab, fallback = 'General fund', className }: {
  id: string | null | undefined; title?: string | null; photos?: Map<string, FundraiserPhoto>; size?: number; tab?: string; fallback?: string; className?: string;
}) {
  if (!id) return <span className={cn('text-xs text-muted-foreground', className)}>{fallback}</span>;
  const f = photos?.get(id);
  const name = f?.title ?? title ?? 'Fundraiser';
  return (
    <Link to={`/admin/fundraisers?id=${id}${tab ? `&tab=${tab}` : ''}`} onClick={(e) => e.stopPropagation()}
      className={cn('group inline-flex min-w-0 max-w-[260px] items-center gap-2 text-sm', className)}>
      <FundraiserThumb url={f?.photo_url ?? null} need={f?.help_categories?.[0] ?? f?.category} size={size} />
      <span className="truncate text-foreground group-hover:text-primary group-hover:underline group-hover:underline-offset-4">{name}</span>
    </Link>
  );
}
