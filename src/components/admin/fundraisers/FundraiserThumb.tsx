import { useState } from 'react';
import { NeedIcon } from '@/components/needs/NeedIcon';
import { transformedFundraiserImage } from '@/lib/fundraiserImages';
import { cn } from '@/lib/utils';

/**
 * A fundraiser's own photo for admin lists (primary gallery photo, then the first in order, then the old
 * cover), fetched small through the Supabase image transform. Without a photo, or if it fails to load, it
 * shows the fundraiser's need icon on a pale tile, so a row is never blank.
 */
export function FundraiserThumb({ url, need, size = 48, className, rounded = 'rounded-md' }: { url: string | null; need?: string | null; size?: number; className?: string; rounded?: string }) {
  const [failed, setFailed] = useState(false);
  const src = url && !failed ? transformedFundraiserImage(url, Math.round(size * 2.5), 70) : null;
  if (!src) {
    return (
      <span aria-hidden="true" className={cn('flex shrink-0 items-center justify-center bg-primary/10 text-primary', rounded, className)} style={size ? { width: size, height: size } : undefined}>
        <NeedIcon id={need ?? ''} className="h-[45%] w-[45%]" />
      </span>
    );
  }
  return (
    <img src={src} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)}
      className={cn('shrink-0 bg-muted object-cover', rounded, className)} style={size ? { width: size, height: size } : undefined} />
  );
}
