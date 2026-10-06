import { brandList } from '@/data/brandLogos';
import { MotionDebug, useMotionPreference } from '@/hooks/useMotionPreference';

export const LiveActivityBar = () => {
  const gentle = useMotionPreference() === 'gentle';
  return (
    <section
      aria-labelledby="redeemable-at-heading"
      className="relative overflow-hidden bg-background"
    >
      <div className="container relative mx-auto px-4 py-5 md:py-6">
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-8 lg:gap-12">
          <div className="shrink-0 text-center md:w-[200px] md:text-left">
            <h2 id="redeemable-at-heading" className="text-sm font-semibold text-foreground md:text-base">
              Every dollar, redeemable at
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
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
              className="flex w-max animate-marquee lg:[animation-duration:48s] hover:[animation-play-state:paused] active:[animation-play-state:paused]"
              style={gentle ? { animationDuration: '64s' } : undefined}
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
                      className="flex h-14 w-16 shrink-0 items-center justify-center transition-transform duration-300 hover:scale-105 md:h-16 md:w-20"
                      title={brand.name}
                    >
                      <img
                        src={brand.logo}
                        alt={group === 0 ? brand.name : ''}
                        className="h-9 w-10 object-contain md:h-11 md:w-12"
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

