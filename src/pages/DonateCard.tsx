import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ImagePlus, Loader2, X } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FaqList, PageHero, RelatedLinks, TwoPaths } from '@/components/seo/HelpSections';
import { AgreementNotice } from '@/components/legal/AgreementNotice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { brandList } from '@/data/brandLogos';
import { GIVE_PAGES } from '@/data/givePages';
import { breadcrumbJsonLd, canonicalUrl, faqJsonLd } from '@/lib/seo';
import { signInPath } from '@/lib/serverActions';
import { recordAgreement } from '@/lib/legal';
import {
  CARD_DAILY_LIMIT, CARD_PHOTO_BUCKET, CARD_PHOTO_MAX_BYTES, CARD_TYPES, cardStatusText, cardTypeLabel,
  type CardDonation, type CardType,
} from '@/lib/cardDonations';

const PATH = '/donate-a-card';
const TITLE = 'Donate an Unused Gift Card to a Family in Need';
const DESCRIPTION = 'Have a digital gift card, store coupon or promo code you won’t use? Give it to a family who asked for help, or to our shared pool. We check every card first.';
const OTHER_STORE = '__other';
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const STEPS = [
  { title: 'Enter the card', text: 'The store, the balance or discount, the code and any rules printed with it. Choose a family who asked for that kind of help, or our shared pool.' },
  { title: 'We check it', text: 'Our team checks the balance and the terms before anyone receives it. If a card can’t be used, we tell you why and delete its code.' },
  { title: 'It reaches a family', text: 'Accepted cards go to the family you chose, or to the shared pool for the next family who needs that store. You can follow each card on this page.' },
];

const ACCEPT = [
  'Unused digital gift cards and e-gift cards with a balance',
  'Digital store coupons and vouchers that anyone can use',
  'Promo codes for store or app credit that aren’t tied to your account',
  'Cards that haven’t expired, with at least a few weeks left',
];
const DECLINE = [
  'Physical cards and paper coupons (we accept digital codes only)',
  'Cards tied to a name, phone number or account, or marked non-transferable',
  'Rebate, reward-program and employee cards',
  'EBT, SNAP, WIC or other benefit cards',
  'Cards with no balance you can confirm, or that were partly used',
];

const FAQ = [
  { q: 'What happens to my card after I submit it?', a: 'Our team checks its balance and terms. If it can be used, it goes to the family you chose or to the shared pool, and this page shows it as accepted. If not, we decline it, tell you why and delete the code.' },
  { q: 'Can I give a card to a specific family?', a: 'Yes. Choose one of the open requests in the form. If that request closes before we finish checking the card, it goes to another family who asked for the same store, or to the shared pool.' },
  { q: 'Can I get my card back?', a: 'You can withdraw a card while it says We’re checking it. Once we accept it, it belongs to the person who receives it and can’t be returned.' },
  { q: 'Is a donated card tax-deductible?', a: 'No. CouponDonation Inc. is a company, not a registered charity, so donated cards aren’t tax-deductible.' },
  { q: 'Do you buy gift cards or pay for them?', a: 'Never. We only accept cards given freely. If someone asked you to buy gift cards and send the codes, it may be a scam: don’t send them to anyone, and report it at reportfraud.ftc.gov.' },
  { q: 'Will the family know who gave the card?', a: 'Families never see your email address or other contact details. Tick Don’t show my name if you’d rather we never share your name with them.' },
];

type OpenRequest = { id: string; title: string; unique_slug: string | null };

/** Open, real requests a card can go to directly. */
function useOpenRequests(preselect: string | null) {
  return useQuery({
    queryKey: ['card-donation-requests', preselect],
    queryFn: async () => {
      const { data } = await supabase.from('fundraisers').select('id, title, unique_slug')
        .eq('status', 'active').eq('is_example', false).is('archived_at', null)
        .order('created_at', { ascending: false }).limit(60);
      return (data ?? []) as OpenRequest[];
    },
    staleTime: 60_000,
  });
}

function useMyCards(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-card-donations', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('card_donations' as never)
        .select('id, store_name, card_type, value, discount_text, expires_on, code_hint, status, decline_reason, accepted_value, fundraiser_id, created_at, fundraisers(title, unique_slug)')
        .order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return (data ?? []) as unknown as CardDonation[];
    },
  });
}

function CardForm({ userId, requests, preselect, onDone }: { userId: string; requests: OpenRequest[]; preselect: string | null; onDone: () => void }) {
  const stores = useMemo(() => brandList.filter((b) => !['Visa', 'Mastercard', 'American Express'].includes(b.name)).map((b) => b.name).sort(), []);
  const [store, setStore] = useState('');
  const [otherStore, setOtherStore] = useState('');
  const [type, setType] = useState<CardType>('gift_card');
  const [value, setValue] = useState('');
  const [discount, setDiscount] = useState('');
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [url, setUrl] = useState('');
  const [expires, setExpires] = useState('');
  const [terms, setTerms] = useState('');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [destination, setDestination] = useState<'pool' | 'family'>(preselect ? 'family' : 'pool');
  const [fundraiser, setFundraiser] = useState(preselect ?? '');
  const [anonymous, setAnonymous] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (preselect && requests.some((r) => r.id === preselect)) { setDestination('family'); setFundraiser(preselect); }
  }, [preselect, requests]);

  const storeName = store === OTHER_STORE ? otherStore.trim() : store;
  const amount = Number(value);
  const today = new Date().toISOString().slice(0, 10);
  const missing =
    !storeName ? 'Choose the store'
      : type === 'gift_card' && !(amount > 0) ? 'Enter the balance'
      : value && !(amount > 0 && amount <= 2000) ? 'Enter a balance between $1 and $2,000'
      : !code.trim() && !url.trim() ? 'Enter the code or the link'
      : url.trim() && !/^https:\/\//i.test(url.trim()) ? 'The link must start with https://'
      : expires && expires < today ? 'This card has expired'
      : destination === 'family' && !fundraiser ? 'Choose a family'
      : !confirmed ? 'Tick the confirmation'
      : null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (missing || busy) return;
    setBusy(true);
    try {
      let photoPath: string | null = null;
      if (photo) {
        const ext = (photo.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'jpg';
        photoPath = `${userId}/${crypto.randomUUID()}.${ext}`;
        const up = await supabase.storage.from(CARD_PHOTO_BUCKET).upload(photoPath, photo, { contentType: photo.type, upsert: false });
        if (up.error) throw new Error('The photo couldn’t be uploaded. Try a smaller JPG or PNG, or leave it out.');
      }
      const { error } = await supabase.rpc('submit_card_donation' as never, {
        _store: storeName, _type: type, _value: value ? amount : null, _discount: discount.trim() || null,
        _code: code.trim() || null, _pin: pin.trim() || null, _url: url.trim() || null, _expires: expires || null,
        _terms: terms.trim() || null, _note: note.trim() || null, _photo_path: photoPath,
        _fundraiser: destination === 'family' ? fundraiser : null, _anon: anonymous,
      } as never);
      if (error) throw new Error(error.message);
      void recordAgreement(userId, 'card-donation');
      toast({ title: 'Thank you. We’ll check your card', description: 'You can follow it in Your donated cards below.' });
      setStore(''); setOtherStore(''); setValue(''); setDiscount(''); setCode(''); setPin(''); setUrl(''); setExpires('');
      setTerms(''); setNote(''); setPhoto(null); setConfirmed(false); setAnonymous(false);
      onDone();
    } catch (err) {
      toast({ title: 'Your card wasn’t submitted', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const field = 'mt-2 h-12 w-full rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring';
  return (
    <form onSubmit={submit} className="space-y-8" noValidate data-card-form>
      <fieldset>
        <legend className="font-sans text-lg font-semibold text-foreground">What kind of card is it?</legend>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          {CARD_TYPES.map((t) => (
            <label key={t.id} className={`flex cursor-pointer flex-col rounded-2xl p-4 transition-[box-shadow] ${type === t.id ? 'bg-background shadow-[inset_0_0_0_2px_hsl(var(--primary))]' : 'bg-background/70 hover:shadow-[inset_0_0_0_1px_hsl(var(--border))]'}`}>
              <input type="radio" name="card-type" value={t.id} checked={type === t.id} onChange={() => setType(t.id)} className="sr-only" />
              <span className="font-medium text-foreground">{t.label}</span>
              <span className="mt-1 text-sm leading-snug text-muted-foreground">{t.hint}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="card-store">Store</Label>
          <select id="card-store" value={store} onChange={(e) => setStore(e.target.value)} className={field}>
            <option value="">Choose the store</option>
            {stores.map((s) => <option key={s} value={s}>{s}</option>)}
            <option value={OTHER_STORE}>Another store</option>
          </select>
          {store === OTHER_STORE && <Input aria-label="Store name" className="mt-2 h-12" maxLength={60} placeholder="Store name" value={otherStore} onChange={(e) => setOtherStore(e.target.value)} />}
        </div>
        <div>
          <Label htmlFor="card-value">{type === 'gift_card' ? 'Balance' : 'Value, if it has one'}</Label>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
            <Input id="card-value" inputMode="decimal" className="h-12 pl-7" placeholder="25.00" value={value} onChange={(e) => setValue(e.target.value.replace(/[^\d.]/g, '').slice(0, 7))} />
          </div>
        </div>
        {type !== 'gift_card' && (
          <div className="sm:col-span-2">
            <Label htmlFor="card-discount">What it gives</Label>
            <Input id="card-discount" className="mt-2 h-12" maxLength={140} placeholder="For example, $10 off a $50 order" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </div>
        )}
        <div>
          <Label htmlFor="card-code">Code or card number</Label>
          <Input id="card-code" className="mt-2 h-12 font-mono" autoComplete="off" spellCheck={false} maxLength={200} value={code} onChange={(e) => setCode(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="card-pin">PIN, if there is one</Label>
          <Input id="card-pin" className="mt-2 h-12 font-mono" autoComplete="off" spellCheck={false} maxLength={40} value={pin} onChange={(e) => setPin(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="card-url">Redemption link, if it came as a link</Label>
          <Input id="card-url" type="url" className="mt-2 h-12" maxLength={500} placeholder="https://" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="card-expires">Expiry date, if it has one</Label>
          <Input id="card-expires" type="date" min={today} className="mt-2 h-12" value={expires} onChange={(e) => setExpires(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="card-terms">Rules and terms</Label>
          <Textarea id="card-terms" className="mt-2 min-h-28 text-base" maxLength={2000} placeholder="Copy any terms that came with it: where it works, minimum spend, online or in store only." value={terms} onChange={(e) => setTerms(e.target.value)} />
          <p className="mt-1.5 text-sm text-muted-foreground">The family sees these with the code, so they know how to use it.</p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-sm font-medium text-foreground">Screenshot of the card or its terms (optional)</p>
          {photo ? (
            <div className="mt-2 flex items-center gap-3 rounded-xl bg-background p-3">
              <ImagePlus className="h-5 w-5 text-primary" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-sm">{photo.name}</span>
              <button type="button" onClick={() => setPhoto(null)} className="rounded p-1.5 text-muted-foreground hover:bg-muted" aria-label="Remove screenshot"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <label className="mt-2 flex min-h-12 cursor-pointer items-center gap-2 rounded-xl bg-background px-4 py-3 text-[15px] text-primary hover:shadow-[inset_0_0_0_1px_hsl(var(--border))]">
              <ImagePlus className="h-5 w-5" aria-hidden="true" />Add a screenshot
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                if (file && file.size > CARD_PHOTO_MAX_BYTES) { toast({ title: 'That image is over 5 MB', variant: 'destructive' }); return; }
                setPhoto(file);
              }} />
            </label>
          )}
          <p className="mt-1.5 text-sm text-muted-foreground">Only our team sees it. Cover the code and PIN; type them in the boxes above instead.</p>
        </div>
      </div>

      <fieldset>
        <legend className="font-sans text-lg font-semibold text-foreground">Who should receive it?</legend>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {([['pool', 'Our shared pool', 'We give it to the next family who asked for that store.'], ['family', 'A family I choose', 'Pick one of the open requests.']] as const).map(([id, label, hint]) => (
            <label key={id} className={`flex cursor-pointer flex-col rounded-2xl p-4 ${destination === id ? 'bg-background shadow-[inset_0_0_0_2px_hsl(var(--primary))]' : 'bg-background/70 hover:shadow-[inset_0_0_0_1px_hsl(var(--border))]'}`}>
              <input type="radio" name="destination" value={id} checked={destination === id} onChange={() => setDestination(id)} className="sr-only" />
              <span className="font-medium text-foreground">{label}</span>
              <span className="mt-1 text-sm text-muted-foreground">{hint}</span>
            </label>
          ))}
        </div>
        {destination === 'family' && (
          requests.length ? (
            <div className="mt-4">
              <Label htmlFor="card-family">Family</Label>
              <select id="card-family" value={fundraiser} onChange={(e) => setFundraiser(e.target.value)} className={field}>
                <option value="">Choose a request</option>
                {requests.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
            </div>
          ) : (
            <p className="mt-4 text-[15px] text-muted-foreground">There are no open requests to choose from right now, so this card will go to the shared pool.</p>
          )
        )}
      </fieldset>

      <div className="space-y-4">
        <div>
          <Label htmlFor="card-note">A note for our team (optional)</Label>
          <Textarea id="card-note" className="mt-2 min-h-20 text-base" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <label className="flex items-start gap-3 text-[15px] leading-relaxed text-foreground">
          <Checkbox checked={anonymous} onCheckedChange={(v) => setAnonymous(v === true)} className="mt-1" />
          Don’t show my name to the family
        </label>
        <label className="flex items-start gap-3 rounded-2xl bg-background p-4 text-[15px] leading-relaxed text-foreground" data-card-confirm>
          <Checkbox checked={confirmed} onCheckedChange={(v) => setConfirmed(v === true)} className="mt-1" />
          I confirm this card is mine to give, unused, not tied to my name or account, and that I didn’t buy it because someone asked me to. Once it’s accepted, I can’t get it back.
        </label>
      </div>

      <div className="space-y-3">
        <AgreementNotice action="Donate this card" />
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" size="lg" disabled={!!missing || busy}>{busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting</> : 'Donate this card'}</Button>
          {missing && <span className="text-sm text-muted-foreground" aria-live="polite">{missing}</span>}
        </div>
        <p className="text-sm text-muted-foreground">Up to {CARD_DAILY_LIMIT} cards a day. Never send codes by email; this form is the only safe way.</p>
      </div>
    </form>
  );
}

function MyCards({ cards, onWithdraw }: { cards: CardDonation[]; onWithdraw: (id: string) => void }) {
  if (!cards.length) return null;
  return (
    <section aria-labelledby="my-cards-heading" className="mt-14">
      <h2 id="my-cards-heading" className="font-display text-3xl font-normal text-foreground">Your donated cards</h2>
      <ul className="mt-6 space-y-3">
        {cards.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-background p-4">
            <div className="min-w-0">
              <p className="font-medium text-foreground">
                {c.store_name} {cardTypeLabel(c.card_type).toLowerCase()}{c.value ? `, ${usd.format(Number(c.accepted_value ?? c.value))}` : c.discount_text ? `, ${c.discount_text}` : ''}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">{c.code_hint} · Sent {shortDate.format(new Date(c.created_at))}</p>
              <p className={`mt-1 text-sm ${c.status === 'declined' ? 'text-destructive' : c.status === 'accepted' ? 'text-primary' : 'text-foreground/80'}`}>{cardStatusText(c)}</p>
            </div>
            {c.status === 'pending' && <Button size="sm" variant="ghost" onClick={() => onWithdraw(c.id)}>Withdraw</Button>}
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Donate an unused digital gift card, store coupon or promo code to a family or the shared pool
 * (founder request, Oct 2026). Digital codes only. Linked from the Donate page, /donate-gift-cards,
 * fundraiser pages and the footer, not the homepage.
 */
export default function DonateCard() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [params] = useSearchParams();
  const qc = useQueryClient();
  const preselect = params.get('fundraiser');
  const requests = useOpenRequests(preselect);
  const mine = useMyCards(user?.id);

  const withdraw = async (id: string) => {
    if (!window.confirm('Withdraw this card? Its code will be deleted.')) return;
    const { error } = await supabase.rpc('withdraw_card_donation' as never, { _id: id } as never);
    if (error) toast({ title: 'Couldn’t withdraw the card', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Card withdrawn' }); qc.invalidateQueries({ queryKey: ['my-card-donations'] }); }
  };

  const jsonLd = [
    { '@context': 'https://schema.org', '@type': 'WebPage', '@id': canonicalUrl(PATH), url: canonicalUrl(PATH), name: TITLE, description: DESCRIPTION, inLanguage: 'en-US',
      isPartOf: { '@id': 'https://coupondonation.com/#website' }, publisher: { '@id': 'https://coupondonation.com/#organization' } },
    breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: 'Donate a card', path: PATH }]),
    faqJsonLd(FAQ),
  ];

  return (
    <div className="min-h-dvh bg-background">
      <SEO title={TITLE} description={DESCRIPTION} path={PATH} jsonLd={jsonLd} />
      <Navbar />
      <main>
        <PageHero
          h1="Donate a gift card you won’t use"
          lead="An unused gift card, store coupon or promo code can cover someone’s groceries or medicine this week. Give it to a family who asked for help, or to our shared pool, and we’ll check it before it reaches them."
          primary={{ label: 'Donate a card', to: '#card-form' }}
          secondary={{ label: 'What we accept', to: '#what-we-accept' }}
        />
        <TwoPaths give={{ title: 'How it works', steps: STEPS, action: { label: 'Donate a card', to: '#card-form' } }} />

        <section id="what-we-accept" aria-label="What we accept" className="scroll-mt-24 py-16 md:py-24" style={{ backgroundColor: 'hsl(var(--primary-97))' }}>
          <div className="container mx-auto grid max-w-6xl gap-14 px-4 lg:grid-cols-2 lg:gap-20">
            <div>
              <h2 className="font-display text-4xl font-normal text-foreground md:text-5xl">What we accept</h2>
              <ul className="mt-8 list-disc space-y-3 pl-6 text-[17px] leading-relaxed text-foreground/85 marker:text-primary">{ACCEPT.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
            <div>
              <h2 className="font-display text-4xl font-normal text-foreground md:text-5xl">What we can’t take</h2>
              <ul className="mt-8 list-disc space-y-3 pl-6 text-[17px] leading-relaxed text-foreground/85 marker:text-muted-foreground">{DECLINE.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          </div>
          <div className="container mx-auto mt-12 max-w-6xl px-4">
            <div className="flex max-w-3xl gap-4 rounded-[1.5rem] bg-background p-6" role="note">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
              <p className="text-[16px] leading-relaxed text-foreground/85">
                <strong className="text-foreground">If someone told you to buy gift cards, it’s probably a scam.</strong> Don’t send the codes to anyone, including us, and report it at{' '}
                <a href="https://reportfraud.ftc.gov/" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-2">reportfraud.ftc.gov</a>. We never buy cards or pay for them.
              </p>
            </div>
          </div>
        </section>

        <section id="card-form" aria-labelledby="card-form-heading" className="scroll-mt-24 py-16 md:py-24">
          <div className="container mx-auto max-w-3xl px-4">
            <h2 id="card-form-heading" className="font-display text-4xl font-normal text-foreground md:text-5xl">Donate your card</h2>
            <div className="mt-8 rounded-[1.5rem] p-5 sm:p-8" style={{ backgroundColor: 'hsl(var(--primary-97))' }}>
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : user ? (
                <CardForm userId={user.id} requests={requests.data ?? []} preselect={preselect} onDone={() => qc.invalidateQueries({ queryKey: ['my-card-donations'] })} />
              ) : (
                <div className="space-y-4">
                  <p className="text-[17px] leading-relaxed text-foreground">Sign in to donate a card, so we can tell you when it’s checked and keep its code safe. It takes a minute, and you can follow every card you give.</p>
                  <Button asChild size="lg"><Link to={signInPath(`${PATH}${location.search}`)}>Sign in to donate a card</Link></Button>
                </div>
              )}
            </div>
            {user && <MyCards cards={mine.data ?? []} onWithdraw={withdraw} />}
          </div>
        </section>

        <FaqList items={FAQ} />
        <RelatedLinks
          title="More ways to help"
          links={[{ name: 'Give a new gift card', to: '/donate' }, ...GIVE_PAGES.map((g) => ({ name: g.name, to: g.path })), { name: 'Open requests', to: '/stories' }]}
        />
      </main>
      <Footer />
    </div>
  );
}
