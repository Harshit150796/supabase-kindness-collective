export interface FundraiserImageLike {
  image_url: string;
  is_primary?: boolean | null;
  display_order?: number | null;
  created_at?: string | null;
}

export interface FundraiserImageSource {
  cover_photo_url?: string | null;
  fundraiser_images?: FundraiserImageLike[] | null;
}

export function orderedFundraiserImages(images: FundraiserImageLike[] = []) {
  return [...images].sort((a, b) => {
    if (!!a.is_primary !== !!b.is_primary) return a.is_primary ? -1 : 1;
    const order = Number(a.display_order ?? Number.MAX_SAFE_INTEGER) - Number(b.display_order ?? Number.MAX_SAFE_INTEGER);
    if (order) return order;
    return String(a.created_at ?? '').localeCompare(String(b.created_at ?? ''));
  });
}

/** One canonical photo rule: primary gallery → first ordered gallery → legacy cover. */
export function resolveFundraiserImage(source: FundraiserImageSource): string | null {
  return orderedFundraiserImages(source.fundraiser_images ?? [])[0]?.image_url ?? source.cover_photo_url ?? null;
}

export function transformedFundraiserImage(url: string | null, width = 960, quality = 76) {
  if (!url || !url.includes('/storage/v1/object/public/')) return url;
  const rendered = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
  return `${rendered}?width=${width}&quality=${quality}&resize=cover`;
}

export function FundraiserImageFallback({ category, className = '' }: { category?: string | null; className?: string }) {
  const label = category === 'utilities' ? 'Essential bills' : category === 'health' ? 'Health support' : category === 'education' ? 'Education support' : 'Everyday essentials';
  return (
    <div className={`flex h-full w-full items-end bg-primary-20 p-6 text-primary-foreground ${className}`} aria-label={`${label} fundraiser`}>
      <div>
        <div className="mb-5 h-1 w-16 bg-primary-foreground/70" />
        <p className="font-sans text-xl font-semibold leading-snug">{label}</p>
        <p className="mt-2 max-w-[15rem] text-sm text-primary-foreground/75">Coupon-locked support through CouponDonation</p>
      </div>
    </div>
  );
}