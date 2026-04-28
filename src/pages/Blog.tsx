import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCMSPosts } from '@/hooks/useCMSContent';
import { format, parseISO } from 'date-fns';
import { Calendar, ArrowRight } from 'lucide-react';

export default function Blog() {
  const { data: posts, isLoading } = useCMSPosts(true);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Blog & Updates"
        description="Latest news, impact updates, donor spotlights, and stories from CouponDonation. Stay connected with our mission to end food insecurity."
        path="/blog"
        jsonLd={breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Blog', path: '/blog' }])}
      />
      <Navbar />
      <main>
        <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-gold/5">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">Blog & Updates</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              News, stories, and updates from the CouponDonation community.
            </p>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            {isLoading ? (
              <div className="grid gap-6">
                {[1, 2, 3].map(i => (
                  <Card key={i}><CardContent className="p-6"><Skeleton className="h-6 w-3/4 mb-3" /><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-2/3" /></CardContent></Card>
                ))}
              </div>
            ) : (posts || []).length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg">No articles published yet. Check back soon!</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {(posts || []).map((post: any) => (
                  <Link key={post.id} to={`/blog/${post.slug}`}>
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                      <CardContent className="p-0">
                        <div className="flex flex-col sm:flex-row">
                          {post.cover_image_url && (
                            <div className="sm:w-48 h-48 sm:h-auto flex-shrink-0 overflow-hidden">
                              <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                          )}
                          <div className="flex-1 p-6">
                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant="outline">{post.category}</Badge>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {format(parseISO(post.published_at || post.created_at), 'MMM dd, yyyy')}
                              </span>
                            </div>
                            <h2 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">{post.title}</h2>
                            <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{post.excerpt || post.content.substring(0, 150)}</p>
                            <span className="text-primary text-sm font-medium flex items-center gap-1">
                              Read more <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
