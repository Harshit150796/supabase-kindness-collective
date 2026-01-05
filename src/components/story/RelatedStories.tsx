import { Link } from 'react-router-dom';
import { ImpactStory, impactStories } from '@/data/impactStories';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users } from 'lucide-react';

interface RelatedStoriesProps {
  currentStoryId: string;
  category: ImpactStory['category'];
}

const categoryLabels: Record<string, string> = {
  family: 'Family Support',
  child: 'Child Welfare',
  emergency: 'Emergency Aid',
  community: 'Community',
};

export function RelatedStories({ currentStoryId, category }: RelatedStoriesProps) {
  // Get stories from the same category, excluding the current one
  const relatedStories = impactStories
    .filter(story => story.id !== currentStoryId)
    .sort((a, b) => {
      // Prioritize same category
      if (a.category === category && b.category !== category) return -1;
      if (b.category === category && a.category !== category) return 1;
      return 0;
    })
    .slice(0, 3);

  if (relatedStories.length === 0) return null;

  return (
    <section className="py-12 border-t border-border">
      <h2 className="text-2xl font-bold text-foreground mb-6">
        More Stories You Can Help
      </h2>
      <div className="grid md:grid-cols-3 gap-6">
        {relatedStories.map((story) => {
          const progress = (story.amountRaised / story.goal) * 100;
          
          return (
            <Link 
              key={story.id} 
              to={`/story/${story.id}`}
              className="group"
            >
              <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                {/* Image */}
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={story.image}
                    alt={story.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <Badge className="absolute top-3 left-3 bg-background/80 text-foreground backdrop-blur-sm">
                    {categoryLabels[story.category]}
                  </Badge>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                    <MapPin className="w-3 h-3" />
                    <span>{story.location}</span>
                  </div>
                  
                  <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {story.name}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {story.story}
                  </p>

                  {/* Progress */}
                  <div className="space-y-2">
                    <Progress value={progress} className="h-1.5" />
                    <div className="flex justify-between text-xs">
                      <span className="text-foreground font-medium">
                        ${story.amountRaised.toLocaleString()} raised
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {story.donorsCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
