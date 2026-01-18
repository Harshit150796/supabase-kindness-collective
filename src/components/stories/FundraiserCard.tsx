import { Link } from 'react-router-dom';
import { MapPin, Users, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

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
  food: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  household: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  health: 'bg-red-500/10 text-red-600 border-red-500/20',
  childcare: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  education: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  utilities: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  other: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

interface FundraiserCardProps {
  fundraiser: Fundraiser;
}

export function FundraiserCard({ fundraiser }: FundraiserCardProps) {
  const progressPercent = fundraiser.monthly_goal > 0 
    ? Math.min((fundraiser.amount_raised / fundraiser.monthly_goal) * 100, 100)
    : 0;

  const defaultImage = 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=400&h=300&fit=crop';

  return (
    <Link to={`/f/${fundraiser.unique_slug}`} className="block">
      <div className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <img 
            src={fundraiser.cover_photo_url || defaultImage} 
            alt={fundraiser.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.src = defaultImage;
            }}
          />
          <div className="absolute top-3 left-3">
            <Badge className={`${categoryColors[fundraiser.category] || categoryColors.other} border`}>
              {categoryLabels[fundraiser.category] || 'Support'}
            </Badge>
          </div>
          {fundraiser.status === 'active' && (
            <div className="absolute top-3 right-3">
              <div className="bg-primary/90 text-primary-foreground rounded-full p-1.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          {fundraiser.country && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>{fundraiser.country}</span>
            </div>
          )}
          
          <h3 className="font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {fundraiser.title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{fundraiser.story}</p>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">${(fundraiser.amount_raised || 0).toLocaleString()} raised</span>
              <span className="font-medium text-foreground">${fundraiser.monthly_goal.toLocaleString()} goal</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{fundraiser.donors_count || 0} donors</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
