import { useEffect, useRef, useState } from 'react';

const GREEN = 'bg-primary';
const BLUE = 'bg-verify';

/**
 * The ten-year band under "Give what people need." (founder's pick, Nov 10, 2026: "F. Ten-year bezel"):
 * give $10 today, check where it went ten years from now. A ruler runs from this year to ten years on, and
 * its green line draws itself once (transform only) when most of the band is in view; Pause animations
 * shows it drawn. White like the page around it (founder request). Years come from the visitor's clock, so the
 * band never goes out of date.
 */
export function TenYearBand({ still }: { still: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const from = new Date().getFullYear();
  const to = from + 10;
  const marks = Array.from({ length: 9 }, (_, i) => from + i + 1);

  useEffect(() => {
    const node = ref.current;
    if (!node || seen) return;
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return; }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.intersectionRatio >= 0.6)) { setSeen(true); observer.disconnect(); }
    }, { threshold: [0, 0.6] });
    observer.observe(node);
    return () => observer.disconnect();
  }, [seen]);

  const drawn = still || seen;

  return (
    <section aria-labelledby="ten-year-heading" className="bg-background text-foreground" data-ten-year-band>
      <div ref={ref} className="container mx-auto px-4 pb-2 pt-12 lg:pb-4 lg:pt-14">
        <div className="flex flex-col gap-3 md:flex-row md:items-baseline md:justify-between md:gap-8">
          <h2 id="ten-year-heading" className="font-display text-[2rem] font-normal leading-[1.1] md:text-[2.5rem] lg:text-5xl">Give $10 today. Check where it went in {to}.</h2>
          <p className="shrink-0 text-[15px] text-muted-foreground">Every donation keeps its receipt.</p>
        </div>
        <div aria-hidden="true" className="relative mt-8 h-7 lg:mt-10">
          <div className="absolute inset-x-0 top-[13px] h-px bg-border" />
          <div
            data-ten-year-line={drawn ? 'drawn' : 'waiting'}
            className={`absolute inset-x-0 top-3 h-[3px] origin-left ${GREEN}`}
            style={{ transform: drawn ? 'scaleX(1)' : 'scaleX(0)', transition: still ? 'none' : 'transform 3s cubic-bezier(0.16, 1, 0.3, 1) 0.3s' }}
          />
          <div className={`absolute left-0 top-0 h-7 w-0.5 ${GREEN}`} />
          {marks.map((year, i) => <div key={year} className="absolute top-[7px] h-3.5 w-px bg-foreground/25" style={{ left: `${(i + 1) * 10}%` }} />)}
          <div className={`absolute right-0 top-0 h-7 w-0.5 ${BLUE}`} />
        </div>
        <div aria-hidden="true" className="relative mt-3 h-8 text-[13px] tabular-nums text-muted-foreground lg:h-12">
          <span className="absolute left-0 top-0 font-display text-[1.75rem] leading-none text-primary lg:text-[2.5rem]">{from}</span>
          {marks.slice(1, 8).map((year, i) => <span key={year} className="absolute top-0.5 hidden -translate-x-1/2 sm:block" style={{ left: `${(i + 2) * 10}%` }}>{year}</span>)}
          <span className="absolute right-0 top-0 font-display text-[1.75rem] leading-none text-verify lg:text-[2.5rem]">{to}</span>
        </div>
      </div>
    </section>
  );
}
