import { Link } from 'react-router-dom';
import { ImpactStory, impactStories } from '@/data/impactStories';
import { MapPin, ArrowRight } from 'lucide-react';

interface RelatedStoriesProps {
  currentStoryId: string;
  category: ImpactStory['category'];
}

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
      <h2 className="font-display text-4xl font-normal text-foreground mb-8">
        Continue reading.
      </h2>
      <div className="grid md:grid-cols-3 gap-6">
        {relatedStories.map((story) => {
          return (
            <Link 
              key={story.id} 
              to={`/story/${story.id}`}
              className="group"
            >
              <article>
                {/* Image */}
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={story.image}
                    alt={story.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                    <MapPin className="w-3 h-3" />
                    <span>{story.location}</span>
                  </div>
                  
                  <h3 className="font-display text-2xl text-foreground mb-2 group-hover:text-primary transition-colors">
                    {story.name}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {story.story}
                  </p>

                  <span className="inline-flex items-center text-sm font-medium text-primary">Read story <ArrowRight className="ml-2 h-4 w-4" /></span>
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
