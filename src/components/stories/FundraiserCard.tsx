import { Link } from 'react-router-dom';
import { MapPin, Heart, ArrowRight, BadgeCheck } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { cn } from '@/lib/utils';
import { formatCountry } from '@/lib/countryNames';

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

  const country = formatCountry(fundraiser.country);
  const category = categoryLabels[fundraiser.category] || 'Support';
  const donorCount = fundraiser.donors_count || 0;
  const avatarCount = Math.min(donorCount, 3);
  const overflow = donorCount - avatarCount;
  const isLive = fundraiser.status === 'active';

  return (
    <Link to={`/f/${fundraiser.unique_slug}`} className="block group">
      <article className="w-full bg-card rounded-3xl overflow-hidden border border-border shadow-[0_20px_50px_-20px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_30px_60px_-15px_rgba(16,185,129,0.18)]">
        {/* Image */}
        <div className="relative overflow-hidden">
          <AspectRatio ratio={16 / 10}>
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={fundraiser.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Heart className="w-12 h-12 text-muted-foreground/30" />
              </div>
            )}
          </AspectRatio>

          {/* Floating status */}
          {isLive && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Live Campaign</span>
            </div>
          )}

          {/* Verified badge */}
          <div
            className="absolute top-4 right-4 bg-white/95 backdrop-blur-md p-1.5 rounded-full shadow-sm text-emerald-600"
            title="Verified Recipient"
            aria-label="Verified Recipient"
          >
            <BadgeCheck className="w-5 h-5" strokeWidth={2.5} />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Meta row */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg uppercase tracking-tight border border-emerald-100">
              {category}
            </span>
            {country && (
              <div className="flex items-center gap-1.5 text-muted-foreground bg-muted/60 px-3 py-1 rounded-lg border border-border">
                <MapPin className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span className="text-xs font-semibold text-foreground/80">{country}</span>
              </div>
            )}
          </div>

          {/* Title + excerpt */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-foreground leading-tight tracking-tight line-clamp-2 group-hover:text-primary transition-colors">
              {fundraiser.title}
            </h3>
            <p className="text-muted-foreground text-[0.9375rem] leading-relaxed line-clamp-2">
              {fundraiser.story}
            </p>
          </div>

          {/* Funding */}
          <div>
            <div className="flex justify-between items-end mb-3">
              <div className="space-y-0.5">
                <p className="text-2xl font-black text-foreground">
                  ${(fundraiser.amount_raised || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs font-medium text-muted-foreground">
                  raised of <span className="font-bold text-foreground/80">${fundraiser.monthly_goal.toLocaleString()}</span> target
                </p>
              </div>
              <div className="text-sm font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100 whitespace-nowrap">
                {Math.round(progressPercent)}% Funded
              </div>
            </div>

            <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.35)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Social proof + action */}
          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <div className="flex items-center gap-3">
              {donorCount > 0 ? (
                <>
                  <div className="flex -space-x-2">
                    {Array.from({ length: avatarCount }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          'w-8 h-8 rounded-full border-2 border-card',
                          AVATAR_TINTS[i % AVATAR_TINTS.length]
                        )}
                      />
                    ))}
                    {overflow > 0 && (
                      <div className="w-8 h-8 rounded-full border-2 border-card bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                        +{overflow}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-foreground/70">
                    {donorCount} Kind {donorCount === 1 ? 'Donor' : 'Donors'}
                  </span>
                </>
              ) : (
                <span className="text-xs font-semibold text-muted-foreground">Be the first to help</span>
              )}
            </div>

            <div className="flex items-center gap-2 bg-emerald-500 group-hover:bg-emerald-600 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 text-sm">
              Support
              <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
