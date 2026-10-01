import { useState, type ReactNode } from 'react';

/** Safe formatting subset: **bold**, "- " lists, and https links. Never renders HTML. */
function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*)|(https?:\/\/[^\s)]+)/g;
  let last = 0; let m: RegExpExecArray | null; let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<strong key={k++} className="font-semibold text-foreground">{m[1].slice(2, -2)}</strong>);
    else parts.push(<a key={k++} href={m[2]} target="_blank" rel="noopener noreferrer nofollow ugc" className="text-primary underline underline-offset-4 break-all">{m[2]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function StoryBody({ story }: { story: string }) {
  const [open, setOpen] = useState(false);
  const long = story.length > 700;
  const blocks = story.split(/\n{2,}/);
  return (
    <div>
      <div className={`relative space-y-5 text-lg leading-relaxed text-muted-foreground ${long && !open ? 'max-h-[22rem] overflow-hidden' : ''}`}>
        {blocks.map((b, i) => {
          const lines = b.split('\n');
          if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
            return <ul key={i} className="list-disc space-y-1 pl-6">{lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*[-*]\s+/, ''))}</li>)}</ul>;
          }
          return <p key={i} className="whitespace-pre-line">{inline(b)}</p>;
        })}
        {long && !open && <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />}
      </div>
      {long && <button onClick={() => setOpen((o) => !o)} className="mt-4 font-medium text-foreground underline underline-offset-4">{open ? 'Show less' : 'Read more'}</button>}
    </div>
  );
}
