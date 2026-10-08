import { Quote, CheckCircle2 } from 'lucide-react';
import { useCMSTestimonials } from '@/hooks/useCMSContent';
import { LineReveal, Reveal } from '@/components/ui/editorial-motion';
import { ReservedSectionState } from './ReservedSectionState';
import { photoUrl } from '@/lib/responsivePhotos';

const roleColors: Record<string, string> = {
  donor: 'bg-primary/10 text-primary',
  recipient: 'bg-verify/10 text-verify',
  partner: 'bg-verify/10 text-verify'
};

export function TestimonialsSection() {
  const { data: cmsTestimonials, isLoading, isError, refetch } = useCMSTestimonials(true);

  const displayTestimonials = (cmsTestimonials || []).map((t: any) => ({
        id: t.id,
        quote: t.quote,
        name: t.name,
        role: t.role as 'donor' | 'recipient' | 'partner',
        roleLabel: t.role_label,
        location: t.location || '',
        image: t.image_url || '',
        verified: t.verified,
      }));

  if (displayTestimonials.length === 0) return <section className="flex min-h-[var(--lazy-reserved-height,590px)] flex-col bg-secondary/45 py-14 lg:py-28">
    <ReservedSectionState title={isLoading ? 'Gathering their words.' : isError ? 'Their stories are taking longer to arrive.' : 'Every story starts with someone.'}
      description={isLoading ? 'Published accounts will appear here when they arrive.' : isError ? 'Please try again to read published accounts from our community.' : 'There are no published accounts here yet. Explore the fundraisers and stories behind this community.'}
      onRetry={isError ? () => refetch() : undefined} />
  </section>;

  return (
    <section className="min-h-[var(--lazy-reserved-height,0px)] bg-secondary/45 py-14 lg:py-28">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
          <LineReveal><h2 className="font-display text-5xl font-normal leading-none text-foreground md:text-6xl">In their own words.</h2></LineReveal>
          <Reveal delay={0.1} className="mt-5"><p className="text-lg text-muted-foreground">Published accounts from people who have used or supported CouponDonation.</p></Reveal>
        </div>

        <div className="mx-auto flex max-w-6xl snap-x snap-mandatory gap-5 overflow-x-auto pb-3 md:grid md:grid-cols-2 lg:grid-cols-4">
          {displayTestimonials.map((testimonial, index) => (
            <Reveal
              key={testimonial.id} 
              delay={index * 0.07}
              className="w-[min(82vw,340px)] shrink-0 snap-start rounded-[1.5rem] bg-background p-7 transition-transform duration-180 hover:-translate-y-0.5 md:w-auto"
            >
                <Quote className="w-8 h-8 text-primary/20 mb-4" />
                <p className="text-foreground text-sm leading-relaxed mb-6">
                  "{testimonial.quote}"
                </p>
                
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {testimonial.image && (
                      <img 
                        src={photoUrl(testimonial.image, 96)}
                        width={48} height={48} loading="lazy" decoding="async"
                        alt={testimonial.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    {testimonial.verified && (
                      <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center bg-primary">
                        <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">{testimonial.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{testimonial.location}</div>
                  </div>
                </div>
                
                <div className="mt-3">
                  <span className={`inline-flex items-center gap-1 border-l-2 border-current pl-2 text-xs font-medium ${roleColors[testimonial.role] || roleColors.donor}`}>
                    <CheckCircle2 className="w-3 h-3" />
                    {testimonial.roleLabel}
                  </span>
                </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
