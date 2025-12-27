import { Quote, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { testimonials } from '@/data/testimonials';

const roleColors = {
  donor: 'bg-primary/10 text-primary',
  recipient: 'bg-amber-500/10 text-amber-600',
  partner: 'bg-blue-500/10 text-blue-600'
};

export function TestimonialsSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Community Voices
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Hear From Our Community
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real stories from donors, recipients, and partners who are part of our mission.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial) => (
            <Card 
              key={testimonial.id} 
              className="border-border/50 hover:shadow-lg transition-shadow duration-300"
            >
              <CardContent className="p-6">
                <Quote className="w-8 h-8 text-primary/20 mb-4" />
                <p className="text-foreground text-sm leading-relaxed mb-6">
                  "{testimonial.quote}"
                </p>
                
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {testimonial.verified && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
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
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[testimonial.role]}`}>
                    <CheckCircle2 className="w-3 h-3" />
                    {testimonial.roleLabel}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
