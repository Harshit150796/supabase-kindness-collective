import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

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

interface FundraiserCardProps {
  fundraiser: Fundraiser;
}

function formatDonations(n: number): string {
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) {
    const v = n / 1000;
    return `${v >= 10 ? Math.round(v) : v.toFixed(1)}K`;
  }
  const v = n / 1_000_000;
  return `${v >= 10 ? Math.round(v) : v.toFixed(1)}M`;
}

export function FundraiserCard({ fundraiser }: FundraiserCardProps) {
  const progressPercent = fundraiser.monthly_goal > 0
    ? Math.min((fundraiser.amount_raised / fundraiser.monthly_goal) * 100, 100)
    : 0;

  const primaryImage =
    fundraiser.fundraiser_images?.find((img) => img.is_primary)?.image_url ||
    fundraiser.fundraiser_images?.[0]?.image_url ||
    fundraiser.cover_photo_url ||
    null;

  const donorCount = fundraiser.donors_count || 0;
  const raised = fundraiser.amount_raised || 0;

  return (
    <Link
      to={`/f/${fundraiser.unique_slug}`}
      className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl"
    >
      <article className="w-full">
        {/* Image with overlaid donation pill */}
        <div className="relative overflow-hidden rounded-2xl bg-muted">
          <AspectRatio ratio={4 / 3}>
            {primaryImage ? (
              <img
                src={primaryImage}
                alt={fundraiser.title}
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Heart className="w-10 h-10 text-muted-foreground/30" />
              </div>
            )}
          </AspectRatio>

          <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
            {formatDonations(donorCount)} donations
          </div>
        </div>

        {/* Text below image */}
        <div className="pt-3 space-y-2">
          <h3 className="font-bold text-[17px] leading-snug text-foreground line-clamp-2 group-hover:underline decoration-2 underline-offset-2">
            {fundraiser.title}
          </h3>

          <div className="relative h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <p className="text-sm font-semibold text-foreground">
            ${raised.toLocaleString(undefined, { maximumFractionDigits: 0 })} raised
          </p>
        </div>
      </article>
    </Link>
  );
}
