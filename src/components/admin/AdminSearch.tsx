import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { rpc } from '@/lib/adminApi';
import { callFn } from '@/lib/serverActions';
import { useAuth } from '@/hooks/useAuth';

type Hit = { kind: string; id: string; label: string; sub: string | null; link: string };
type Ask = { understood: string | null; answer?: string; link?: { label: string; url: string } | null; search?: string; error?: string };
type NavItem = { label: string; path: string; icon: ComponentType<{ className?: string }>; adminOnly?: boolean };

/** Questions start with a question word, end with "?", or are a few words long; short names and emails are lookups. */
const looksLikeQuestion = (q: string) => /\?\s*$/.test(q) || /^(how|what|which|who|when|where|show|list|find|count|give|any|are|is|did|do|does|why|top|all|latest|recent)\b/i.test(q.trim()) || q.trim().split(/\s+/).length >= 4;
const KIND_ORDER = ['fundraiser', 'person', 'donation', 'coupon', 'donated card', 'monthly gift', 'email', 'conversation', 'contact message', 'partner', 'task'];

/**
 * The admin search (⌘K). Typing finds records across operations (fundraisers, people, donations, coupons,
 * donated cards, monthly gifts, emails, conversations, contact messages, partners, tasks). "Ask" sends only
 * the typed question to the AI (admin-ask), which answers with a number from the database or opens the
 * right page with its filters.
 */
export function AdminSearch({ open, onOpenChange, nav, isAdmin }: { open: boolean; onOpenChange: (o: boolean) => void; nav: NavItem[]; isAdmin: boolean }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [ask, setAsk] = useState<Ask | null>(null);
  const [asking, setAsking] = useState(false);
  useEffect(() => { const t = setTimeout(() => setDebounced(q), 250); return () => clearTimeout(t); }, [q]);
  useEffect(() => { setAsk(null); }, [q]);
  useEffect(() => { if (!open) { setQ(''); setDebounced(''); setAsk(null); } }, [open]);

  const { data: results, isFetching } = useQuery({
    queryKey: ['admin-search', user?.id, debounced],
    enabled: open && debounced.trim().length >= 2,
    queryFn: () => rpc<Hit[]>('admin_search', { _q: debounced.trim() }),
  });
  const groups = useMemo(() => {
    const by = new Map<string, Hit[]>();
    for (const r of results ?? []) by.set(r.kind, [...(by.get(r.kind) ?? []), r]);
    return [...by.entries()].sort((a, b) => KIND_ORDER.indexOf(a[0]) - KIND_ORDER.indexOf(b[0]));
  }, [results]);
  const pages = nav.filter((i) => (isAdmin || !i.adminOnly) && (!q.trim() || i.label.toLowerCase().includes(q.trim().toLowerCase())));
  const go = (url: string) => { onOpenChange(false); navigate(url); };
  const question = q.trim().length >= 3 && looksLikeQuestion(q);

  const runAsk = async () => {
    const text = q.trim();
    if (text.length < 3 || asking) return;
    setAsking(true);
    const r = await callFn<Ask>('admin-ask', { q: text });
    setAsking(false);
    setAsk(r.error ? { understood: null, error: r.error } : r.data ?? { understood: null, error: 'No answer.' });
  };

  const askItem = q.trim().length >= 3 && (
    <CommandGroup heading="Ask">
      <CommandItem value="__ask" onSelect={runAsk}>
        {asking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
        <span className="truncate">Ask: “{q.trim()}”</span>
        <span className="ml-auto pl-2 text-xs text-muted-foreground">AI</span>
      </CommandItem>
    </CommandGroup>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-md sm:max-w-2xl">
        <DialogTitle className="sr-only">Search the admin portal</DialogTitle>
        <Command shouldFilter={false} className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-2.5 [&_[cmdk-item]_svg]:h-4 [&_[cmdk-item]_svg]:w-4">
          <CommandInput placeholder="Search anything, or ask: “how many donations this week?”" value={q} onValueChange={setQ} />
          {ask && (
            <div className="border-b border-border bg-muted/40 px-4 py-3 text-sm" role="status">
              {ask.understood && <p className="text-xs text-muted-foreground">{ask.understood}</p>}
              {ask.answer && <p className="mt-1 text-base font-medium">{ask.answer}</p>}
              {ask.error && <p className="mt-1 text-muted-foreground">{ask.error}</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                {ask.link && <Button size="sm" onClick={() => go(ask.link!.url)}>{ask.link.label}<ArrowRight className="ml-1.5 h-4 w-4" /></Button>}
                {ask.search && ask.search !== q.trim() && <Button size="sm" variant="outline" onClick={() => setQ(ask.search!)}>Search for “{ask.search}”</Button>}
              </div>
            </div>
          )}
          <CommandList className="max-h-[60vh]">
            <CommandEmpty>{q.trim().length < 2 ? 'Type a name, email, phone, amount, store or ID, or ask a question.' : isFetching ? 'Searching…' : 'No matching records. Try Ask.'}</CommandEmpty>
            {question && askItem}
            {groups.map(([kind, rows]) => (
              <CommandGroup key={kind} heading={kind === 'person' ? 'People' : `${kind[0].toUpperCase()}${kind.slice(1)}s`}>
                {rows.map((r) => (
                  <CommandItem key={r.kind + r.id} value={`${r.kind}:${r.id}`} onSelect={() => go(r.link)}>
                    <span className="min-w-0 flex-1 truncate">{r.label}</span>
                    {r.sub && <span className="ml-3 max-w-[45%] truncate text-xs text-muted-foreground">{r.sub}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
            {!question && askItem}
            {pages.length > 0 && <CommandGroup heading="Go to">
              {pages.slice(0, q.trim() ? 6 : 40).map((i) => (
                <CommandItem key={i.path} value={`go:${i.path}`} onSelect={() => go(i.path)}><i.icon className="mr-2 h-4 w-4" />{i.label}</CommandItem>
              ))}
            </CommandGroup>}
          </CommandList>
          <p className="border-t border-border px-4 py-2 text-[11px] text-muted-foreground">Ask sends only your question to our AI service, never records. Numbers come straight from the database.</p>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
