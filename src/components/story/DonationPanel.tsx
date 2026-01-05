import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CircularProgress } from './CircularProgress';
import { ShareButtons } from './ShareButtons';
import { SupportersList } from './SupportersList';
import { ImpactStory } from '@/data/impactStories';
import { Heart, Users, Shield, Sparkles } from 'lucide-react';

interface DonationPanelProps {
  story: ImpactStory;
}

export function DonationPanel({ story }: DonationPanelProps) {
  const progressPercent = (story.amountRaised / story.goal) * 100;
  const remaining = story.goal - story.amountRaised;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
      {/* Circular Progress */}
      <div className="flex flex-col items-center text-center">
        <CircularProgress value={progressPercent} size={140} strokeWidth={10} />
        
        <div className="mt-4 space-y-1">
          <div className="text-3xl font-bold text-foreground">
            ${story.amountRaised.toLocaleString()}
          </div>
          <div className="text-muted-foreground">
            raised of ${story.goal.toLocaleString()} goal
          </div>
        </div>

        {remaining > 0 ? (
          <Badge variant="secondary" className="mt-3">
            ${remaining.toLocaleString()} to go
          </Badge>
        ) : (
          <Badge className="mt-3 bg-primary text-primary-foreground">
            <Sparkles className="w-3 h-3 mr-1" />
            Goal Reached!
          </Badge>
        )}
      </div>

      {/* Donor count */}
      <div className="flex items-center justify-center gap-2 text-muted-foreground">
        <Users className="w-4 h-4" />
        <span className="text-sm">
          <strong className="text-foreground">{story.donorsCount}</strong> people have donated
        </span>
      </div>

      {/* CTA Buttons */}
      <div className="space-y-3">
        <Button 
          size="lg" 
          className="w-full gap-2 text-base"
          asChild
        >
          <Link to="/auth?mode=signup&role=donor">
            <Heart className="w-5 h-5" />
            Donate Now
          </Link>
        </Button>
        
        <ShareButtons title={`Help ${story.name} - CouponDonation`} />
      </div>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-2 py-3 border-t border-border">
        <Shield className="w-4 h-4 text-primary" />
        <span className="text-xs text-muted-foreground">
          100% goes to families • No platform fees
        </span>
      </div>

      {/* Brand partners */}
      {story.brandPartners && story.brandPartners.length > 0 && (
        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-3 text-center">
            Coupons provided by
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {story.brandPartners.map((brand) => (
              <Badge key={brand} variant="outline" className="text-xs">
                {brand}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Recent supporters */}
      <div className="pt-4 border-t border-border">
        <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Heart className="w-4 h-4 text-primary" />
          Recent Supporters
        </h4>
        <SupportersList donors={story.recentDonors || []} maxVisible={4} />
      </div>
    </div>
  );
}
