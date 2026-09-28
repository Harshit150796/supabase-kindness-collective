import { Navigate, useParams } from 'react-router-dom';
import { SEO, breadcrumbJsonLd } from '@/components/SEO';
import { impactStories } from '@/data/impactStories';
import { EditorialStoryLayout } from '@/components/story/EditorialStoryLayout';
import { RelatedStories } from '@/components/story/RelatedStories';

export default function StoryDetail() {
  const { id } = useParams<{ id: string }>();
  const story = impactStories.find((item) => item.id === id);
  if (!story) return <Navigate to="/stories" replace />;
  return (
    <>
      <SEO title={`${story.name} — Editorial Story`} description={story.story.slice(0, 155)} path={`/story/${story.id}`} type="article" jsonLd={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Stories', path: '/stories' }, { name: story.name, path: `/story/${story.id}` }])} />
      <EditorialStoryLayout title={story.name} location={story.location} summary={story.story} body={story.fullStory} image={story.image}>
        <div className="lg:col-span-2"><RelatedStories currentStoryId={story.id} category={story.category} /></div>
      </EditorialStoryLayout>
    </>
  );
}