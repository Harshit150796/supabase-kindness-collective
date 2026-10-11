import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { Pause, Play } from 'lucide-react';
import { useCMSTestimonials } from '@/hooks/useCMSContent';
import { LineReveal, Reveal } from '@/components/ui/editorial-motion';
import { ReservedSectionState } from './ReservedSectionState';
import { photoUrl } from '@/lib/responsivePhotos';
import { tidy, tidyLabel, voiceRows, type VoiceLine } from '@/lib/testimonialLines';

type Voice = { id: string; quote: string; name: string; roleLabel: string; location: string; image: string };
type CmsTestimonial = { id: string; quote: string | null; name: string | null; role_label: string | null; location: string | null; image_url: string | null };

/** Speed of the drifting rows in px per second: calm enough to read on every screen size. */
const DRIFT_SPEED = { phone: 34, wide: 44 };
const FEATURE_EVERY_MS = 9000;

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function Face({ voice, size, className }: { voice: Voice; size: number; className: string }) {
  if (!voice.image) return <span aria-hidden="true" className={`${className} flex items-center justify-center bg-secondary text-sm font-semibold text-muted-foreground`}>{initials(voice.name)}</span>;
  return <img src={photoUrl(voice.image, size * 2)} width={size} height={size} loading="lazy" decoding="async" alt="" className={className} />;
}

/**
 * One drifting row of lines. The lines repeat until the strip is long enough, then the strip is
 * doubled so it can loop seamlessly; only the first copy is exposed to assistive technology and the
 * keyboard. Its loop time comes from its measured width, so every row moves at the same speed.
 */
function VoiceRow({ lines, voices, active, reverse, onPick }: {
  lines: VoiceLine[];
  voices: Voice[];
  active: number;
  reverse?: boolean;
  onPick: (person: number, event: MouseEvent<HTMLButtonElement>) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const base = useMemo(() => {
    const filled: VoiceLine[] = [];
    while (lines.length && filled.length < 6) filled.push(...lines);
    return filled;
  }, [lines]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || typeof ResizeObserver === 'undefined') return;
    const measure = () => {
      const speed = window.innerWidth < 640 ? DRIFT_SPEED.phone : DRIFT_SPEED.wide;
      const loop = track.scrollWidth / 2;
      if (loop > 0) track.style.setProperty('--voices-loop', `${(loop / speed).toFixed(1)}s`);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, [base]);

  return (
    <div className="voices-row" data-direction={reverse ? 'back' : 'forward'}>
      <div ref={trackRef} className="voices-track">
        {[0, 1].map((copy) => base.map((line, index) => {
          const voice = voices[line.person];
          const echo = copy === 1 || index >= lines.length;
          return (
            <div key={`${copy}-${index}-${line.key}`} className="voices-cell" aria-hidden={echo || undefined}>
              <button type="button" className="voices-item" data-active={line.person === active || undefined} tabIndex={echo ? -1 : undefined} onClick={(event) => onPick(line.person, event)}>
                <Face voice={voice} size={46} className="voices-face" />
                <span className="flex min-w-0 flex-col gap-1.5">
                  <q className="voices-line">{line.text}</q>
                  <span className="voices-name">{voice.name}</span>
                </span>
              </button>
              <span className="voices-sep" aria-hidden="true" />
            </div>
          );
        }))}
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  const { data: cmsTestimonials, isLoading, isError, refetch } = useCMSTestimonials(true);
  const sectionRef = useRef<HTMLElement>(null);
  const featureRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [chosen, setChosen] = useState(false);
  const [onScreen, setOnScreen] = useState(false);

  const voices = useMemo<Voice[]>(() => ((cmsTestimonials || []) as CmsTestimonial[]).map((t) => ({
    id: t.id,
    quote: tidy(t.quote || ''),
    name: tidyLabel(t.name || ''),
    roleLabel: tidyLabel(t.role_label || ''),
    location: tidyLabel(t.location || ''),
    image: t.image_url || '',
  })).filter((voice) => voice.quote && voice.name), [cmsTestimonials]);
  const rows = useMemo(() => voiceRows(voices.map((voice) => voice.quote)), [voices]);

  // Rows only move while the section is on screen, and the featured account turns over gently
  // until someone picks one; the pause button stops both.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === 'undefined') { setOnScreen(true); return; }
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { rootMargin: '120px 0px' });
    observer.observe(section);
    return () => observer.disconnect();
  }, [voices.length]);
  useEffect(() => {
    if (paused || chosen || !onScreen || voices.length < 2) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % voices.length), FEATURE_EVERY_MS);
    return () => window.clearInterval(timer);
  }, [paused, chosen, onScreen, voices.length]);

  const pick = useCallback((person: number, event: MouseEvent<HTMLButtonElement>) => {
    setActive(person);
    setChosen(true);
    const feature = featureRef.current;
    if (!feature) return;
    // Keyboard users land on the account they chose; on small screens it is brought into view.
    if (event.detail === 0) feature.focus({ preventScroll: true });
    const box = feature.getBoundingClientRect();
    if (box.bottom > window.innerHeight || box.top < 0) feature.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  if (voices.length === 0) return <section className="flex min-h-[var(--lazy-reserved-height,590px)] flex-col bg-secondary/45 py-14 lg:py-28">
    <ReservedSectionState title={isLoading ? 'Gathering their words.' : isError ? 'Their stories are taking longer to arrive.' : 'Every story starts with someone.'}
      description={isLoading ? 'Published accounts will appear here when they arrive.' : isError ? 'Please try again to read published accounts from our community.' : 'There are no published accounts here yet. Explore the fundraisers and stories behind this community.'}
      onRetry={isError ? () => refetch() : undefined} />
  </section>;

  const current = Math.min(active, voices.length - 1);

  return (
    <section ref={sectionRef} data-voices data-moving={onScreen && !paused ? 'true' : 'false'} className="voices min-h-[var(--lazy-reserved-height,0px)] overflow-hidden bg-secondary/45 py-14 lg:py-24">
      <div className="container mx-auto flex flex-col gap-5 px-4 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <LineReveal><h2 className="font-display text-5xl font-normal leading-none text-foreground md:text-6xl">In their own words.</h2></LineReveal>
        <Reveal delay={0.08} className="flex max-w-md flex-col items-start gap-3">
          <p className="text-base leading-relaxed text-muted-foreground md:text-lg">Published accounts from people who have used or supported CouponDonation. Choose a line to read it in full.</p>
          <button type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused}
            className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {paused ? <Play className="h-4 w-4" aria-hidden="true" /> : <Pause className="h-4 w-4" aria-hidden="true" />}
            {paused ? 'Play the moving lines' : 'Pause the moving lines'}
          </button>
        </Reveal>
      </div>

      <div className="mt-9 flex flex-col gap-1 md:mt-12 md:gap-2.5">
        <VoiceRow lines={rows[0]} voices={voices} active={current} onPick={pick} />
        <VoiceRow lines={rows[1]} voices={voices} active={current} onPick={pick} reverse />
      </div>

      <div className="container mx-auto mt-8 px-4 md:mt-12">
        {/* Every account sits in the same grid cell, so the panel is always as tall as the longest
            one and the page below never shifts when the featured account changes. */}
        <div ref={featureRef} tabIndex={-1} data-voices-feature className="grid rounded-[1.5rem] bg-background p-6 outline-none focus-visible:ring-2 focus-visible:ring-ring md:p-10">
          {voices.map((voice, index) => {
            const shown = index === current;
            const long = voice.quote.length > 200;
            return (
              <div key={voice.id} aria-hidden={!shown || undefined} className={`[grid-area:1/1] grid content-center gap-5 md:grid-cols-[96px_minmax(0,1fr)] md:gap-8 ${shown ? 'voices-feature' : 'invisible'}`}>
                <div className="flex items-center gap-4 md:block">
                  <Face voice={voice} size={96} className="h-14 w-14 shrink-0 rounded-full object-cover md:h-24 md:w-24" />
                  <div className="min-w-0 md:hidden">
                    <p className="font-semibold text-foreground">{voice.name}</p>
                    {voice.location && <p className="text-sm text-muted-foreground">{voice.location}</p>}
                  </div>
                </div>
                <figure className="m-0 min-w-0">
                  <blockquote className={`m-0 font-display text-foreground ${long ? 'text-xl leading-snug md:text-[1.6rem]' : 'text-[1.375rem] leading-snug md:text-[1.75rem]'}`}>“{voice.quote}”</blockquote>
                  <figcaption className="mt-4 text-sm leading-relaxed text-muted-foreground md:mt-5 md:text-[0.95rem]">
                    <span className="hidden font-semibold text-foreground md:inline">{voice.name}</span>
                    {voice.roleLabel && <><span className="hidden md:inline"> · </span>{voice.roleLabel}</>}
                    {voice.location && <span className="hidden md:inline"> · {voice.location}</span>}
                  </figcaption>
                </figure>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
