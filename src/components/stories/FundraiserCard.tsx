import { Link } from 'react-router-dom';
import { MapPin, Heart, ArrowRight, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { cn } from '@/lib/utils';

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

const categoryColors: Record<string, string> = {
  food: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  household: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  health: 'bg-red-500/20 text-red-400 border-red-500/30',
  childcare: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  education: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  utilities: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  other: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

interface FundraiserCardProps {
  fundraiser: Fundraiser;
}

function getTimeAgo(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export function FundraiserCard({ fundraiser }: FundraiserCardProps) {
  const progressPercent = fundraiser.monthly_goal > 0 
    ? Math.min((fundraiser.amount_raised / fundraiser.monthly_goal) * 100, 100)
    : 0;

  // Prefer image from fundraiser_images table, fallback to cover_photo_url
  const primaryImage = fundraiser.fundraiser_images?.find(img => img.is_primary)?.image_url
    || fundraiser.fundraiser_images?.[0]?.image_url
    || fundraiser.cover_photo_url
    || null;
  
  const timeAgo = getTimeAgo(fundraiser.created_at);

  return (
    <Link to={`/f/${fundraiser.unique_slug}`} className="block group">
      <div className="relative bg-card rounded-2xl border border-border overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/30">
        {/* Image Section with Gradient Overlay */}
        <div className="relative overflow-hidden">
          <AspectRatio ratio={16 / 10}>
            {primaryImage ? (
              <img 
                src={primaryImage} 
                alt={fundraiser.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Heart className="w-12 h-12 text-muted-foreground/30" />
              </div>
            )}
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </AspectRatio>

          {/* Category Badge - Top Left */}
          <div className="absolute top-3 left-3">
            <Badge className={cn(
              "backdrop-blur-sm border text-xs font-medium",
              categoryColors[fundraiser.category] || categoryColors.other
            )}>
              {categoryLabels[fundraiser.category] || 'Support'}
            </Badge>
          </div>

          {/* Live Indicator - Top Right */}
          {fundraiser.status === 'active' && (
            <div className="absolute top-3 right-3">
              <div className="flex items-center gap-1.5 bg-emerald-500/90 text-white rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                Live
              </div>
            </div>
          )}

          {/* Support Now CTA - Bottom Right (appears on hover) */}
          <div className="absolute bottom-3 right-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <div className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-full px-4 py-2 text-sm font-semibold shadow-lg">
              Support Now
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-5 space-y-3">
          {/* Location & Time */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {fundraiser.country && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                <span>{fundraiser.country}</span>
              </div>
            )}
            {timeAgo && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{timeAgo}</span>
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-lg text-foreground leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {fundraiser.title}
          </h3>

          {/* Story Preview */}
          <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
            {fundraiser.story}
          </p>

          {/* Progress Section */}
          <div className="pt-2 space-y-3">
            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-foreground">
                  ${(fundraiser.amount_raised || 0).toLocaleString()}
                </span>
                <span className="text-muted-foreground">
                  of ${fundraiser.monthly_goal.toLocaleString()} goal
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500/30" />
                <span>{fundraiser.donors_count || 0} donors</span>
              </div>
              <div className="text-sm font-medium text-primary">
                {Math.round(progressPercent)}% funded
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
