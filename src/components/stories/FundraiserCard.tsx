import { Link } from 'react-router-dom';
import { MapPin, Heart, ArrowRight, BadgeCheck } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { cn } from '@/lib/utils';
import { useZipLocation } from '@/lib/zipLookup';

interface FundraiserImage {
  id: string;
  image_url: string;
  is_primary: boolean;
}

interface Fundraiser {
  id: string;
  title: string;
  story: string;
  category: string;
  monthly_goal: number;
  amount_raised: number;
  donors_count: number;
  unique_slug: string;
  cover_photo_url?: string | null;
  country?: string | null;
  zip_code?: string | null;
  status: string;
  created_at?: string;
  fundraiser_images?: FundraiserImage[];
}

const categoryLabels: Record<string, string> = {
  food: 'Food Support',
  household: 'Household',
  health: 'Healthcare',
  childcare: 'Childcare',
  education: 'Education',
  utilities: 'Utilities',
  other: 'Other',
};

interface FundraiserCardProps {
  fundraiser: Fundraiser;
}

const AVATAR_TINTS = [
  'bg-emerald-200',
  'bg-amber-200',
  'bg-sky-200',
  'bg-rose-200',
];

export function FundraiserCard({ fundraiser }: FundraiserCardProps) {
  const progressPercent = fundraiser.monthly_goal > 0
    ? Math.min((fundraiser.amount_raised / fundraiser.monthly_goal) * 100, 100)
    : 0;

  const primaryImage = fundraiser.fundraiser_images?.find(img => img.is_primary)?.image_url
    || fundraiser.fundraiser_images?.[0]?.image_url
    || fundraiser.cover_photo_url
    || null;

  const location = useZipLocation(fundraiser.zip_code, fundraiser.country);
  const category = categoryLabels[fundraiser.category] || 'Support';
  const donorCount = fundraiser.donors_count || 0;
  const avatarCount = Math.min(donorCount, 3);
  const overflow = donorCount - avatarCount;
  const isLive = fundraiser.status === 'active';

  return (
    <Link to={`/f/${fundraiser.unique_slug}`} className="block group">
      <article className="w-full bg-card rounded-2xl overflow-hidden border border-border shadow-[0_10px_30px_-15px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.18)]">
        {/* Image */}
        <div className="relative overflow-hidden">
          <AspectRatio ratio={16 / 9}>
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={fundraiser.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Heart className="w-10 h-10 text-muted-foreground/30" />
              </div>
            )}
          </AspectRatio>

          {/* Floating status */}
          {isLive && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2 py-1 rounded-full shadow-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Live</span>
            </div>
          )}

          {/* Verified badge */}
          <div
            className="absolute top-3 right-3 bg-white/95 backdrop-blur-md p-1 rounded-full shadow-sm text-emerald-600"
            title="Verified Recipient"
            aria-label="Verified Recipient"
          >
            <BadgeCheck className="w-4 h-4" strokeWidth={2.5} />
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3.5">
          {/* Meta row */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-tight border border-emerald-100">
              {category}
            </span>
            {location && (
              <div className="flex items-center gap-1 text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border">
                <MapPin className="w-3 h-3" strokeWidth={2.5} />
                <span className="text-[11px] font-semibold text-foreground/80">{location}</span>
              </div>
            )}
          </div>

          {/* Title + excerpt */}
          <div className="space-y-1.5">
            <h3 className="text-base md:text-lg font-bold text-foreground leading-snug tracking-tight line-clamp-2 group-hover:text-primary transition-colors">
              {fundraiser.title}
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
              {fundraiser.story}
            </p>
          </div>

          {/* Funding */}
          <div>
            <div className="flex justify-between items-end mb-2">
              <div className="space-y-0.5">
                <p className="text-lg font-extrabold text-foreground leading-tight">
                  ${(fundraiser.amount_raised || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] font-medium text-muted-foreground">
                  raised of <span className="font-bold text-foreground/80">${fundraiser.monthly_goal.toLocaleString()}</span>
                </p>
              </div>
              <div className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 whitespace-nowrap">
                {Math.round(progressPercent)}% Funded
              </div>
            </div>

            <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Social proof + action */}
          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <div className="flex items-center gap-2">
              {donorCount > 0 ? (
                <>
                  <div className="flex -space-x-1.5">
                    {Array.from({ length: avatarCount }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'w-6 h-6 rounded-full border-2 border-card',
                          AVATAR_TINTS[i % AVATAR_TINTS.length]
                        )}
                      />
                    ))}
                    {overflow > 0 && (
                      <div className="w-6 h-6 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                        +{overflow}
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-foreground/70">
                    {donorCount} {donorCount === 1 ? 'Donor' : 'Donors'}
                  </span>
                </>
              ) : (
                <span className="text-[11px] font-semibold text-muted-foreground">Be the first to help</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 bg-emerald-500 group-hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-lg transition-all shadow-md shadow-emerald-500/20 group-hover:shadow-emerald-500/40 text-xs">
              Support
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
