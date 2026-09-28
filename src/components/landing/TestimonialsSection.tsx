import { Quote, CheckCircle2 } from 'lucide-react';
import { useCMSTestimonials } from '@/hooks/useCMSContent';
import { LineReveal, Reveal } from '@/components/ui/editorial-motion';

const roleColors: Record<string, string> = {
  donor: 'bg-primary/10 text-primary',
  recipient: 'bg-verify/10 text-verify',
  partner: 'bg-blue-500/10 text-blue-600'
};

export function TestimonialsSection() {
  const { data: cmsTestimonials } = useCMSTestimonials(true);

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

  if (displayTestimonials.length === 0) return null;

  return (
    <section className="bg-background py-24 md:py-36">
      <div className="container mx-auto px-4">
        <div className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
          <LineReveal><h2 className="font-display text-5xl font-normal leading-none text-foreground md:text-6xl">In their own words.</h2></LineReveal>
          <Reveal delay={0.1} className="mt-5"><p className="text-lg text-muted-foreground">Published accounts from people who have used or supported CouponDonation.</p></Reveal>
        </div>

        <div className="mx-auto grid max-w-6xl border-y border-border md:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-border">
          {displayTestimonials.map((testimonial, index) => (
            <Reveal
              key={testimonial.id} 
              delay={index * 0.07}
              className="border-b border-border p-6 last:border-b-0 lg:border-b-0"
            >
                <Quote className="w-8 h-8 text-primary/20 mb-4" />
                <p className="text-foreground text-sm leading-relaxed mb-6">
                  "{testimonial.quote}"
                </p>
                
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {testimonial.image && (
                      <img 
                        src={testimonial.image}
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
