import { useParams, Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useCMSPost } from '@/hooks/useCMSContent';
import { format, parseISO } from 'date-fns';
import { Calendar, ArrowLeft } from 'lucide-react';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading } = useCMSPost(slug || '');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link to="/blog">
            <Button variant="ghost" className="gap-2 mb-6"><ArrowLeft className="w-4 h-4" />Back to Blog</Button>
          </Link>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : !post ? (
            <div className="text-center py-20">
              <h1 className="text-2xl font-bold text-foreground mb-4">Post not found</h1>
              <Link to="/blog"><Button>Back to Blog</Button></Link>
            </div>
          ) : (
            <article>
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">{post.category}</Badge>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {format(parseISO(post.published_at || post.created_at), 'MMMM dd, yyyy')}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6">{post.title}</h1>

              {post.cover_image_url && (
                <img src={post.cover_image_url} alt={post.title} className="w-full rounded-xl mb-8 max-h-96 object-cover" />
              )}

              <div className="prose prose-lg max-w-none text-foreground">
                {post.content.split('\n').map((paragraph, i) => (
                  paragraph.trim() ? <p key={i} className="text-foreground/90 leading-relaxed mb-4">{paragraph}</p> : null
                ))}
              </div>

              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-border">
                  {post.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              )}
            </article>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
