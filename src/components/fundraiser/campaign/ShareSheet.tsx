import { useState } from 'react';
import { Copy, Check, Download, Mail, MessageSquare, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ProgressRing } from './DonationPanel';
import { usd } from '@/hooks/useFundraiserLive';
import { FundraiserImageFallback, transformedFundraiserImage } from '@/lib/fundraiserImages';

/**
 * Public share URL. Stays on coupondonation.com — never the raw backend function URL (AGENTS.md).
 * When a branded preview host is live, set VITE_SHARE_HOST (e.g. https://share.coupondonation.com).
 */
export function publicShareUrl(slug: string) {
  const host = (import.meta.env.VITE_SHARE_HOST as string | undefined)?.replace(/\/$/, '');
  return host ? `${host}/f/${slug}` : `https://coupondonation.com/f/${slug}`;
}

export function ShareCardPreview({ title, cover, raised, goal, organizer }: { title: string; cover: string | null; raised: number; goal: number; organizer: string }) {
  const pct = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0;
  return (
    <div className="overflow-hidden rounded-[1.25rem] bg-ink text-ink-foreground">
      <div className="aspect-[16/9] w-full">{cover ? <img width={900} height={506} decoding="async" src={transformedFundraiserImage(cover, 900) ?? cover} alt="" className="h-full w-full object-cover" loading="lazy" /> : <FundraiserImageFallback />}</div>
      <div className="flex items-center gap-4 p-5">
        <div className="rounded-full bg-background p-1"><ProgressRing percent={pct} size={72} /></div>
        <div className="min-w-0">
          <p className="line-clamp-2 font-display text-2xl leading-tight">{title}</p>
          <p className="mt-1 text-sm opacity-75">{usd(raised)} raised · Organized by {organizer}</p>
        </div>
      </div>
    </div>
  );
}

export function ShareSheet({ open, onOpenChange, slug, title, cover, raised, goal, organizer }: { open: boolean; onOpenChange: (o: boolean) => void; slug: string; title: string; cover: string | null; raised: number; goal: number; organizer: string }) {
  const { toast } = useToast(); const [copied, setCopied] = useState(false);
  const url = publicShareUrl(slug);
  const text = `Help support "${title}" on CouponDonation`;
  const e = encodeURIComponent;
  const channels = [
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${e(url)}` },
    { name: 'X', href: `https://twitter.com/intent/tweet?url=${e(url)}&text=${e(text)}` },
    { name: 'WhatsApp', href: `https://wa.me/?text=${e(`${text} ${url}`)}` },
    { name: 'Messenger', href: `fb-messenger://share/?link=${e(url)}` },
    { name: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}` },
  ];
  const copy = async () => { await navigator.clipboard.writeText(url); setCopied(true); toast({ title: 'Link copied' }); setTimeout(() => setCopied(false), 2000); };
  const native = async () => { try { await navigator.share({ title, text, url }); } catch { /* dismissed */ } };
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=16&data=${e(url)}`;
  const downloadQR = async () => {
    try {
      const blob = await (await fetch(qrSrc)).blob();
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${slug}-qr.png`; a.click(); URL.revokeObjectURL(a.href);
    } catch { window.open(qrSrc, '_blank', 'noopener'); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display text-3xl font-normal">Share this fundraiser</DialogTitle></DialogHeader>
        <ShareCardPreview title={title} cover={cover} raised={raised} goal={goal} organizer={organizer} />
        <div className="flex gap-2">
          <input readOnly value={url} className="min-w-0 flex-1 rounded-full bg-secondary px-4 text-sm" aria-label="Fundraiser link" />
          <Button onClick={copy} className="bg-ink text-ink-foreground hover:bg-ink/90">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}<span className="ml-2">Copy</span></Button>
        </div>
        {typeof navigator !== 'undefined' && 'share' in navigator && <Button variant="outline" onClick={native}><Share2 className="mr-2 h-4 w-4" />Share from this device</Button>}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {channels.map((c) => <Button key={c.name} variant="outline" asChild><a href={c.href} target="_blank" rel="noopener noreferrer">{c.name}</a></Button>)}
          <Button variant="outline" asChild><a href={`mailto:?subject=${e(title)}&body=${e(`${text}\n\n${url}`)}`}><Mail className="mr-2 h-4 w-4" />Email</a></Button>
        </div>
        <Button variant="outline" asChild><a href={`sms:?&body=${e(`${text} ${url}`)}`}><MessageSquare className="mr-2 h-4 w-4" />Text message</a></Button>
        <div className="flex items-center gap-4 rounded-[1rem] bg-secondary/60 p-4">
          <img width={160} height={160} decoding="async" src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${e(url)}`} alt="QR code for this fundraiser" className="h-24 w-24 rounded-lg bg-background" loading="lazy" />
          <div><p className="font-medium">QR code</p><p className="text-sm text-muted-foreground">For posters and flyers.</p><Button size="sm" variant="link" className="px-0" onClick={downloadQR}><Download className="mr-1 h-4 w-4" />Download</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
