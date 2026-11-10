import { useEffect, useRef, useState } from 'react';

/**
 * The ten-year band under "Give what people need." (founder's pick, Nov 10, 2026: a mix of "C. Watch date
 * window" and "F. Ten-year bezel", on white like the page around it): "Donate $10 today. Check where it went
 * in" with the year set large beside it (below it on phones), its last two digits in a watch-style date
 * window, and under them a ruler of the ten years. When most of the band is in view the window rolls from
 * this year to ten years on while the ruler's line draws across, with the same timing, so the line passes
 * each year as the window shows it (transforms only). Pause animations shows the finished state.
 * Years come from the visitor's clock, so the band never goes out of date.
 */
export function TenYearBand({ still }: { still: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const from = new Date().getFullYear();
  const to = from + 10;
  const reel = Array.from({ length: to - from + 1 }, (_, i) => String(from + i).slice(-2));
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

  const done = still || seen;
  // One timing for both, so the line and the window move together.
  const transition = still ? 'none' : 'transform 2.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s';

  return (
    <section aria-labelledby="ten-year-heading" className="bg-background text-foreground" data-ten-year-band>
      {/* Phones read heading, year, ruler, note; wider screens put the year beside the words and the ruler under both. */}
      <div ref={ref} className="container mx-auto grid gap-x-12 gap-y-4 px-4 pb-4 pt-12 md:grid-cols-[minmax(0,1fr)_auto] md:items-center lg:pb-6 lg:pt-16">
        <h2 id="ten-year-heading" className="font-display text-[2.25rem] font-normal leading-[1.08] md:col-start-1 md:row-start-1 md:self-end md:text-[2.75rem] lg:text-[3.25rem]">
          Donate $10 today.<br />Check where it went in<span className="sr-only"> {to}.</span>
        </h2>
        <div aria-hidden="true" className="flex items-center font-display text-[80px] leading-none tabular-nums md:col-start-2 md:row-span-2 md:row-start-1 md:text-[104px] lg:text-[120px]">
          <span>{String(to).slice(0, 2)}</span>
          <span className="ml-2 inline-block rounded-xl border border-primary/35 bg-primary/[0.04] px-3 py-1 shadow-[inset_0_2px_8px_hsl(var(--ink)/0.08)] lg:px-3.5">
            <span className="block h-[1.05em] overflow-hidden">
              <span
                data-ten-year-reel={done ? 'rolled' : 'waiting'}
                className="block text-verify"
                style={{ transform: `translateY(${done ? -(reel.length - 1) * 1.05 : 0}em)`, transition }}
              >
                {reel.map((digits, i) => <span key={i} className="block h-[1.05em]">{digits}</span>)}
              </span>
            </span>
          </span>
        </div>
        <div aria-hidden="true" className="mt-2 md:col-span-2 md:row-start-3 md:mt-6">
          <div className="relative h-6">
            <div className="absolute inset-x-0 top-[11px] h-px bg-border" />
            <div data-ten-year-line={done ? 'drawn' : 'waiting'} className="absolute inset-x-0 top-[10px] h-[3px] origin-left bg-primary" style={{ transform: done ? 'scaleX(1)' : 'scaleX(0)', transition }} />
            <div className="absolute left-0 top-0 h-6 w-0.5 bg-primary" />
            {marks.map((year, i) => <div key={year} className="absolute top-1.5 h-3 w-px bg-foreground/25" style={{ left: `${(i + 1) * 10}%` }} />)}
            <div className="absolute right-0 top-0 h-6 w-0.5 bg-verify" />
          </div>
          <div className="relative mt-2 h-5 text-[13px] tabular-nums text-muted-foreground">
            <span className="absolute left-0 top-0 font-semibold text-primary">{from}</span>
            {marks.map((year, i) => <span key={year} className="absolute top-0 hidden -translate-x-1/2 sm:block" style={{ left: `${(i + 1) * 10}%` }}>{year}</span>)}
            <span className="absolute right-0 top-0 font-semibold text-verify">{to}</span>
          </div>
        </div>
        <p className="max-w-[520px] text-base leading-relaxed text-muted-foreground md:col-start-1 md:row-start-2 md:self-start md:text-[17px]">Every donation keeps its receipt, so the answer is still there ten years on.</p>
      </div>
    </section>
  );
}
