import { Link } from 'react-router-dom';
import { Lock, MapPin } from 'lucide-react';
import { ImageReveal } from '@/components/ui/editorial-motion';
import { type Fundraiser } from '@/hooks/useFundraisers';
import { FundraiserImageFallback, resolveFundraiserImage, transformedFundraiserImage } from '@/lib/fundraiserImages';
import { useZipLocation } from '@/lib/zipLookup';
import { timeAgo, usd } from '@/hooks/useFundraiserLive';

export function FundraiserCard({ fundraiser, lead = false, inverse = false }: { fundraiser: Fundraiser; lead?: boolean; inverse?: boolean }) {
  const image = resolveFundraiserImage(fundraiser);
  const location = useZipLocation(fundraiser.zip_code, fundraiser.country);
  const raised = fundraiser.live_raised ?? 0;
  const count = fundraiser.live_donations_count ?? 0;
  const progress = fundraiser.monthly_goal > 0 ? Math.min(100, raised / fundraiser.monthly_goal * 100) : 0;
  const organizer = fundraiser.organizer_name
    ? fundraiser.organizer_name.charAt(0).toLocaleUpperCase() + fundraiser.organizer_name.slice(1)
    : 'a CouponDonation organizer';
  const hasDonations = raised > 0;
  return <Link to={`/f/${fundraiser.unique_slug}`} className="group block snap-start self-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><article className={`flex flex-col overflow-hidden ${inverse ? 'bg-transparent text-ink-foreground' : 'bg-background'}`}>
    <ImageReveal className={lead ? 'aspect-[3/1]' : 'aspect-[4/3]'}>{image ? <img src={transformedFundraiserImage(image, lead ? 1400 : 900) ?? image} alt={fundraiser.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" loading="lazy" /> : <FundraiserImageFallback category={fundraiser.category} />}</ImageReveal>
    <div className={lead ? 'flex flex-col p-6 md:p-7' : 'flex flex-col pt-5'}><div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">{location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{location}</span>}{fundraiser.latest_donation_at && <span>Last gift {timeAgo(fundraiser.latest_donation_at)}</span>}</div>
      <h3 className={`${lead ? 'text-4xl md:text-5xl' : 'text-2xl'} mt-3 line-clamp-2 font-display leading-[1.05] ${inverse ? 'text-ink-foreground' : 'text-foreground'} group-hover:underline decoration-1 underline-offset-4`}>{fundraiser.title}</h3><p className={`mt-3 line-clamp-2 text-sm leading-relaxed ${inverse ? 'text-ink-foreground/65' : 'text-muted-foreground'}`}>Organized by {organizer}</p>
      <div className="pt-6"><div className={`h-1.5 overflow-hidden ${inverse ? 'bg-ink-foreground/10' : 'bg-primary/10'}`}><div className="h-full bg-primary transition-[width] duration-700" style={{ width: `${progress}%` }} /></div><div className="mt-3 flex items-end justify-between gap-4">{hasDonations ? <div><strong className={inverse ? 'text-ink-foreground' : 'text-foreground'}>{usd(raised)} raised</strong><p className={`mt-0.5 text-sm ${inverse ? 'text-ink-foreground/65' : 'text-muted-foreground'}`}>{count} completed {count === 1 ? 'donation' : 'donations'}</p></div> : <strong className={inverse ? 'text-ink-foreground' : 'text-foreground'}>Be the first to give</strong>}<span className={`shrink-0 text-sm ${inverse ? 'text-ink-foreground/65' : 'text-muted-foreground'}`}>{usd(fundraiser.monthly_goal)} goal</span></div><div className="mt-5 flex items-center justify-between"><span className={`inline-flex items-center gap-1.5 text-xs ${inverse ? 'text-ink-foreground/65' : 'text-muted-foreground'}`}><Lock className="h-3.5 w-3.5 text-accent" />Coupon-locked</span><span className="font-semibold text-primary">Donate</span></div></div>
    </div></article></Link>;
}
