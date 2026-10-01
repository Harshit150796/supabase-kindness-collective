import { useEffect, useState } from 'react';
import { Heart, Share2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMotionPreference } from '@/hooks/useMotionPreference';
import { fetchFundraiserDonations, timeAgo, usd, type FundraiserLive, type PublicDonation } from '@/hooks/useFundraiserLive';

export function ProgressRing({ percent, size = 128 }: { percent: number; size?: number }) {
  const motion = useMotionPreference();
  const [shown, setShown] = useState(0);
  useEffect(() => { const t = window.setTimeout(() => setShown(percent), motion === 'full' ? 150 : 0); return () => window.clearTimeout(t); }, [percent, motion]);
  const r = size / 2 - 8; const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="8" fill="none" className="stroke-secondary" />
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="8" fill="none" strokeLinecap="round" className="stroke-primary"
          style={{ strokeDasharray: c, strokeDashoffset: c * (1 - shown / 100), transition: `stroke-dashoffset ${motion === 'full' ? 1400 : 700}ms cubic-bezier(.2,.8,.2,1)` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl text-foreground">{Math.round(percent)}%</span>
      </div>
    </div>
  );
}

function DonationRow({ d }: { d: PublicDonation }) {
  return (
    <li className="flex items-start gap-3 py-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-medium text-secondary-foreground">
        {d.is_anonymous ? <Heart className="h-4 w-4" /> : (d.display_name?.[0] ?? 'S').toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{d.display_name}</p>
        <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{usd(d.amount)}</span> · {timeAgo(d.created_at)}</p>
        {d.message && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">“{d.message}”</p>}
      </div>
    </li>
  );
}

export function DonationsModal({ fundraiserId, open, order, onOpenChange }: { fundraiserId: string; open: boolean; order: 'recent' | 'top'; onOpenChange: (o: boolean) => void }) {
  const [rows, setRows] = useState<PublicDonation[] | null>(null);
  const [tab, setTab] = useState(order);
  useEffect(() => setTab(order), [order]);
  useEffect(() => { if (!open) return; setRows(null); fetchFundraiserDonations(fundraiserId, tab, 100).then(setRows).catch(() => setRows([])); }, [open, tab, fundraiserId]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-hidden flex flex-col">
        <DialogHeader><DialogTitle className="font-display text-3xl font-normal">Donations</DialogTitle></DialogHeader>
        <div className="flex gap-2">
          {(['recent', 'top'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-sm ${tab === t ? 'bg-ink text-ink-foreground' : 'bg-secondary text-foreground'}`}>{t === 'recent' ? 'Newest' : 'Top'}</button>
          ))}
        </div>
        <ul className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
          {rows === null ? <li className="py-6 text-muted-foreground">Loading…</li> : rows.length === 0 ? <li className="py-6 text-muted-foreground">No donations yet.</li> : rows.map((d) => <DonationRow key={d.id} d={d} />)}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

export function DonationPanel({ live, goal, onDonate, onShare, fundraiserId, closed }: { live: FundraiserLive; goal: number; onDonate: () => void; onShare: () => void; fundraiserId: string; closed?: boolean }) {
  const [modal, setModal] = useState<null | 'recent' | 'top'>(null);
  const percent = goal > 0 ? Math.min(100, (live.totalRaised / goal) * 100) : 0;
  const funded = goal > 0 && live.totalRaised >= goal;
  return (
    <div className="rounded-[1.5rem] bg-card p-6 md:p-7 shadow-card-hover">
      <div className="flex items-center gap-5">
        <ProgressRing percent={percent} size={112} />
        <div className="min-w-0">
          <p className="font-display text-4xl leading-none text-foreground">{usd(live.totalRaised)}</p>
          <p className="mt-2 text-sm text-muted-foreground">raised of {usd(goal)} goal</p>
          {live.donationsCount > 0 && <p className="mt-1 text-sm text-muted-foreground">{live.donationsCount.toLocaleString()} {live.donationsCount === 1 ? 'donation' : 'donations'}</p>}
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {funded || closed ? (
          <div className="flex h-14 items-center justify-center gap-2 rounded-full bg-primary/10 font-semibold text-primary"><CheckCircle2 className="h-5 w-5" />{funded ? 'Fully funded' : 'Not accepting donations'}</div>
        ) : (
          <Button size="lg" className="h-14 w-full text-lg font-semibold" onClick={onDonate}><Heart className="mr-2 h-5 w-5" />Donate now</Button>
        )}
        <Button size="lg" className="h-12 w-full bg-ink text-ink-foreground hover:bg-ink/90" onClick={onShare}><Share2 className="mr-2 h-4 w-4" />Share</Button>
      </div>
      {live.recent.length > 0 && (
        <>
          <ul className="mt-6 divide-y divide-border border-t border-border">{live.recent.map((d) => <DonationRow key={d.id} d={d} />)}</ul>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setModal('recent')}>See all</Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setModal('top')}>See top</Button>
          </div>
        </>
      )}
      <DonationsModal fundraiserId={fundraiserId} open={modal !== null} order={modal ?? 'recent'} onOpenChange={(o) => !o && setModal(null)} />
    </div>
  );
}
