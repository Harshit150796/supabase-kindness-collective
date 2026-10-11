import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { pullLines, tidy, tidyLabel, voiceRows } from '../../../src/lib/testimonialLines.ts';

const QUOTES = [
  "I've donated to many platforms, but this is the first time I can see exactly where my money goes. Knowing my $50 became 3 meals for a family in need is incredibly fulfilling.",
  'I liked how straightforward CouponDonation is. You give, you see the impact, and it feels like your contribution actually means something. I gave it a try and realized how it can bring a global impact. You should try it yourself.',
  'Using CouponDonation made giving feel simple and meaningful. I really liked seeing how an everyday contribution could turn into something practical for someone who needs it.',
  'I set up a monthly donation and receive updates showing exactly which families benefited. The transparency is what keeps me giving.',
];

Deno.test('moving lines are lifted word for word from each account, never reworded', () => {
  for (const quote of QUOTES) {
    const lines = pullLines(quote);
    assert(lines.length >= 1 && lines.length <= 3);
    for (const line of lines) {
      const words = line.replace(/^“|”$/g, '').replace(/…/g, '');
      assert(tidy(quote).includes(words), line);
      assert(line.length <= 84, line);
    }
  }
  assertEquals(pullLines(QUOTES[3]), ['“…receive updates showing exactly which families benefited.”', '“The transparency is what keeps me giving.”']);
  assertEquals(pullLines(QUOTES[0])[0], '“…this is the first time I can see exactly where my money goes.”');
});

Deno.test('rows alternate people and both rows always have lines', () => {
  const [top, bottom] = voiceRows(QUOTES);
  assert(top.length && bottom.length);
  for (const row of [top, bottom]) for (let i = 1; i < row.length; i++) assert(row[i].person !== row[i - 1].person);
  const [onlyTop, onlyBottom] = voiceRows(['The transparency is what keeps me giving.']);
  assert(onlyTop.length && onlyBottom.length);
});

Deno.test('CMS spacing is tidied for display', () => {
  assertEquals(tidyLabel('Chicago , Illinois'), 'Chicago, Illinois');
  assertEquals(tidyLabel('Director of Cybersecurity and Compliance  Alliance Ground International'), 'Director of Cybersecurity and Compliance, Alliance Ground International');
  assertEquals(tidy("I've"), 'I’ve');
});

Deno.test('the section moves on the compositor, pauses, and keeps one accessible copy of each line', async () => {
  const section = await Deno.readTextFile('src/components/landing/TestimonialsSection.tsx');
  const css = await Deno.readTextFile('src/index.css');
  assert(section.includes('aria-pressed={paused}'));
  assert(section.includes("aria-hidden={echo || undefined}") && section.includes('tabIndex={echo ? -1 : undefined}'));
  assert(section.includes("data-moving={onScreen && !paused ? 'true' : 'false'}"));
  assert(section.includes('[grid-area:1/1]'));
  assert(css.includes('@keyframes voices-forward{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}'));
  assert(css.includes('.voices-row:hover .voices-track,.voices-row:focus-within .voices-track,.voices-row:active .voices-track{animation-play-state:paused}'));
  assert(!section.includes('CheckCircle2'));
});
