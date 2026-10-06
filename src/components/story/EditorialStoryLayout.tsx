import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Share2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { LineReveal, Reveal, ImageReveal } from '@/components/ui/editorial-motion';

interface EditorialStoryLayoutProps {
  title: string;
  location?: string | null;
  summary: string;
  body?: string | null;
  image?: string | null;
  imageAlt?: string;
  onShare?: () => void;
  children?: React.ReactNode;
}

export function EditorialStoryLayout({ title, location, summary, body, image, imageAlt, onShare, children }: EditorialStoryLayoutProps) {
  const paragraphs = (body || summary).split('\n\n').filter(Boolean);
  return (
    <div className="min-h-dvh bg-background">
      <Navbar />
      <main>
        <header className="py-20 md:py-28">
          <div className="container mx-auto max-w-6xl px-4">
            <Link to="/stories" className="mb-10 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"><ArrowLeft className="h-4 w-4" />All stories</Link>
            <div className="grid items-end gap-10 lg:grid-cols-[1fr_18rem]">
              <div><LineReveal><h1 className="max-w-4xl font-display text-6xl font-normal leading-none text-foreground md:text-8xl">{title}</h1></LineReveal>{location && <Reveal delay={0.08}><p className="mt-7 flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" />{location}</p></Reveal>}</div>
              <Reveal delay={0.12}><p className="text-lg leading-relaxed text-muted-foreground">{summary}</p></Reveal>
            </div>
          </div>
        </header>
        {image && <div className="container mx-auto max-w-6xl px-4 pb-16"><ImageReveal className="aspect-[16/9] overflow-hidden rounded-[1.5rem] bg-muted"><img src={image} alt={imageAlt || title} className="h-full w-full object-cover" /></ImageReveal></div>}
        <article className="container mx-auto grid max-w-6xl gap-12 rounded-t-[2rem] px-4 py-16 md:py-24 lg:grid-cols-[minmax(0,1fr)_15rem]" style={{backgroundColor:'hsl(var(--primary-97))'}}>
          <Reveal><div className="max-w-3xl space-y-6 text-lg leading-8 text-muted-foreground">{paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></Reveal>
          <aside className="rounded-[1.5rem] bg-background p-6">
            <p className="text-sm leading-relaxed text-muted-foreground">This is an editorial story, not an active fundraiser. No campaign totals or supporter claims are attached to it.</p>
            {onShare && <Button variant="outline" className="mt-6" onClick={onShare}><Share2 className="mr-2 h-4 w-4" />Share story</Button>}
          </aside>
          {children}
        </article>
      </main>
      <Footer />
    </div>
  );
}