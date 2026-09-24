import { brandList } from '@/data/brandLogos';
import { MotionDebug, useMotionPreference } from '@/hooks/useMotionPreference';

export const LiveActivityBar = () => {
  const gentle = useMotionPreference() === 'gentle';
  return (
    <section
      aria-labelledby="redeemable-at-heading"
      className="relative overflow-hidden border-y border-border/60 bg-gradient-to-r from-primary/5 via-background to-accent/5"
    >
      <div aria-hidden="true" className="absolute -left-16 -top-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-20 -right-16 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />

      <div className="container relative mx-auto px-4 py-2.5 md:py-3">
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-8 lg:gap-12">
          <div className="shrink-0 text-center md:w-[200px] md:text-left">
            <h2 id="redeemable-at-heading" className="text-sm font-semibold text-foreground md:text-base">
              Every dollar, redeemable at
            </h2>
            <p className="mt-0.5 text-[11px] text-muted-foreground md:text-xs">
              Pick the familiar brands where your kindness is spent.
            </p>
          </div>

          <div
            className="w-full min-w-0 overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
              WebkitMaskImage: 'linear-gradient(to right, transparent, black 5%, black 95%, transparent)',
            }}
          >
            <MotionDebug />
            <div
              className="flex w-max animate-marquee lg:[animation-duration:40s] hover:[animation-play-state:paused] active:[animation-play-state:paused]"
              style={gentle ? { animationDuration: '60s' } : undefined}
            >
              {[0, 1].map((group) => (
                <div
                  key={group}
                  aria-hidden={group === 1}
                  className="flex shrink-0 items-center gap-4 pr-4 md:gap-5 md:pr-5"
                >
                  {brandList.map((brand) => (
                    <div
                      key={`${group}-${brand.name}`}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card shadow-[0_8px_24px_-12px_hsl(var(--foreground)/0.28)] transition-transform duration-300 hover:-translate-y-0.5 md:h-14 md:w-14"
                      title={brand.name}
                    >
                      <img
                        src={brand.logo}
                        alt={group === 0 ? brand.name : ''}
                        className="h-7 w-7 object-contain md:h-8 md:w-8"
                        loading="eager"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

