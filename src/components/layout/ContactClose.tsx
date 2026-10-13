import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { UpdatesOptIn, recordUpdatesConsent } from '@/components/UpdatesOptIn';
import { getUserCountry } from '@/lib/geo';
import { US_STATES, US_TERRITORIES } from '@/data/usStates';
import {
  CONTACT_TOPICS, MESSAGE_MAX, formatUsPhone, usPhoneDigits, validateContact,
  type ContactErrors, type ContactFields,
} from '@/lib/contactForm';

const EMPTY: ContactFields = { name: '', email: '', phone: '', state: '', topic: '', message: '' };
const ORDER: (keyof ContactFields)[] = ['name', 'email', 'phone', 'state', 'topic', 'message'];
const COUNT = new Intl.NumberFormat('en-US');

type Sent = { firstName: string; email: string; confirmed: boolean };

function Field({ id, label, error, hint, children }: { id: string; label: ReactNode; error?: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="contact-field">
      <label htmlFor={id} className="contact-label">{label}</label>
      {children}
      {error ? <p id={`${id}-error`} className="contact-error">{error}</p> : hint ? <p id={`${id}-hint`} className="contact-hint">{hint}</p> : null}
    </div>
  );
}

async function serverMessage(error: unknown): Promise<string | null> {
  const context = (error as { context?: Response } | null)?.context;
  if (!context || typeof context.json !== 'function') return null;
  try { const body = await context.json(); return typeof body?.error === 'string' ? body.error : null; } catch { return null; }
}

/**
 * The closing section of the site footer: a large off-white disc rises over the deep-green band
 * as it comes into view and carries a short form that reaches support@coupondonation.com.
 * The rise is a one-off compositor transition started by an IntersectionObserver (no scroll handlers).
 */
export function ContactClose() {
  const sectionRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const trapRef = useRef<HTMLInputElement>(null);
  const shownAt = useRef(0);
  const geoAsked = useRef(false);
  const [open, setOpen] = useState(false);
  const [fields, setFields] = useState<ContactFields>(EMPTY);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [optIn, setOptIn] = useState(false);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState('');
  const [abroad, setAbroad] = useState(false);
  const [sent, setSent] = useState<Sent | null>(null);
  // The confirmation keeps the form's height, so nothing below the footer jumps when it swaps in.
  const [stageHeight, setStageHeight] = useState<number | undefined>();

  useEffect(() => {
    shownAt.current = Date.now();
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === 'undefined') { setOpen(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      shownAt.current = Date.now();
      setOpen(true);
      observer.disconnect();
    }, { rootMargin: '0px 0px -18% 0px' });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => { if (sent) doneRef.current?.focus({ preventScroll: true }); }, [sent]);

  const set = (key: keyof ContactFields, value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: undefined }));
  };

  // Only people in the United States can be helped; a lookup that says otherwise shows a note
  // but never blocks the form (free IP lookups are often wrong on VPNs and mobile networks).
  const checkRegion = () => {
    if (geoAsked.current) return;
    geoAsked.current = true;
    getUserCountry().then((country) => setAbroad(!!country && country !== 'US')).catch(() => undefined);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (sending) return;
    const found = validateContact(fields);
    setErrors(found);
    setFailure('');
    const first = ORDER.find((key) => found[key]);
    if (first) {
      formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setSending(true);
    const name = fields.name.trim().replace(/\s+/g, ' ');
    const email = fields.email.trim();
    try {
      const { data, error } = await supabase.functions.invoke('public-submit', {
        body: {
          action: 'contact',
          website: trapRef.current?.value || undefined,
          elapsed_ms: Date.now() - shownAt.current,
          name, email,
          phone: fields.phone.trim() ? usPhoneDigits(fields.phone) : null,
          state: fields.state, topic: fields.topic,
          message: fields.message.trim(),
          page: window.location.pathname.slice(0, 300),
        },
      });
      if (error || data?.error) {
        setFailure((await serverMessage(error)) ?? data?.error ?? 'Your message could not be sent. Please try again, or email support@coupondonation.com.');
        return;
      }
      setStageHeight(formRef.current?.offsetHeight);
      if (optIn) void recordUpdatesConsent(email, 'contact');
      setSent({ firstName: name.split(' ')[0], email, confirmed: data?.confirmed !== false });
      setFields(EMPTY);
    } catch {
      setFailure('Your message could not be sent. Check your connection and try again, or email support@coupondonation.com.');
    } finally {
      setSending(false);
    }
  };

  const again = () => {
    setSent(null);
    setStageHeight(undefined);
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[name="name"]')?.focus());
  };

  const described = (key: keyof ContactFields, hint = false) =>
    errors[key] ? `contact-${key}-error` : hint ? `contact-${key}-hint` : undefined;
  const count = fields.message.length;

  return (
    <section ref={sectionRef} id="contact" aria-labelledby="contact-title" data-open={open || undefined} className="contact-close">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 xl:grid xl:grid-cols-12 xl:gap-8">
        <div className="contact-panel xl:col-span-8">
          <div aria-hidden="true" className="contact-disc" />
          <div className="contact-sheet">
            <h2 id="contact-title" className="font-display text-[2.75rem] font-normal leading-[1.02] text-foreground md:text-6xl xl:text-[4.5rem]">
              Write to us.<br />A person will reply.
            </h2>
            <p className="mt-5 max-w-[34rem] text-base leading-relaxed text-muted-foreground md:mt-6 md:text-lg xl:max-w-[40rem]">
              Ask about a donation, a fundraiser or your account, or tell us what we could do better. We serve people in the United States, so we ask which state you live in.
            </p>

            <div className="contact-stage mt-8 md:mt-9" style={sent && stageHeight ? { minHeight: stageHeight } : undefined}>
              {sent ? (
                <div className="contact-done" role="status">
                  <h3 ref={doneRef} tabIndex={-1} className="font-display text-4xl font-normal leading-tight text-foreground outline-none md:text-5xl">Message sent.</h3>
                  <p className="mt-4 max-w-[34rem] text-base leading-relaxed text-muted-foreground md:text-lg">
                    Thanks, {sent.firstName}. Your message is with our support team{sent.confirmed ? <>, and we sent a confirmation to <span className="font-medium text-foreground">{sent.email}</span></> : null}. A person will reply from support@coupondonation.com.
                  </p>
                  <button type="button" onClick={again} className="contact-again mt-6">Send another message</button>
                </div>
              ) : (
                <form ref={formRef} onSubmit={submit} onFocusCapture={checkRegion} noValidate className="contact-form" aria-busy={sending || undefined}>
                  {/* People never see or fill this field; automated senders often do. */}
                  <div className="contact-trap" aria-hidden="true">
                    <label htmlFor="contact-website">Website</label>
                    <input ref={trapRef} id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
                  </div>

                  <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
                    <Field id="contact-name" label="Name" error={errors.name}>
                      <input id="contact-name" name="name" type="text" autoComplete="name" maxLength={120} placeholder="Jordan Lee"
                        value={fields.name} onChange={(e) => set('name', e.target.value)} aria-invalid={!!errors.name || undefined} aria-describedby={described('name')} className="contact-input" />
                    </Field>
                    <Field id="contact-email" label="Email" error={errors.email}>
                      <input id="contact-email" name="email" type="email" inputMode="email" autoComplete="email" maxLength={255} placeholder="you@example.com" spellCheck={false}
                        value={fields.email} onChange={(e) => set('email', e.target.value)} aria-invalid={!!errors.email || undefined} aria-describedby={described('email')} className="contact-input" />
                    </Field>
                    <Field id="contact-phone" label={<>Phone (optional)<span className="sr-only">, US number</span></>} error={errors.phone}>
                      <div className="contact-line">
                        <span aria-hidden="true" className="contact-prefix">+1</span>
                        <input id="contact-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="(555) 555-5555"
                          value={fields.phone} onChange={(e) => set('phone', formatUsPhone(e.target.value))} aria-invalid={!!errors.phone || undefined} aria-describedby={described('phone')} className="contact-input contact-input-bare" />
                      </div>
                    </Field>
                    <Field id="contact-state" label="State" error={errors.state}>
                      <div className="relative">
                        <select id="contact-state" name="state" autoComplete="address-level1" value={fields.state} onChange={(e) => set('state', e.target.value)}
                          aria-invalid={!!errors.state || undefined} aria-describedby={described('state')} className="contact-input contact-select" data-empty={!fields.state || undefined}>
                          <option value="" disabled>Choose your state</option>
                          {US_STATES.map((state) => <option key={state.code} value={state.code}>{state.name}</option>)}
                          <optgroup label="U.S. territories">
                            {US_TERRITORIES.map((territory) => <option key={territory.code} value={territory.code}>{territory.name}</option>)}
                          </optgroup>
                        </select>
                        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      </div>
                    </Field>
                  </div>

                  <fieldset className="contact-field mt-7" aria-describedby={described('topic')}>
                    <legend className="contact-label">What is it about?</legend>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 sm:gap-x-6 md:grid-cols-3">
                      {CONTACT_TOPICS.map((topic) => (
                        <label key={topic.value} className="contact-choice">
                          <input type="radio" name="topic" value={topic.value} checked={fields.topic === topic.value} onChange={() => set('topic', topic.value)}
                            aria-invalid={!!errors.topic || undefined} className="contact-radio" />
                          <span>{topic.label}</span>
                        </label>
                      ))}
                    </div>
                    {errors.topic && <p id="contact-topic-error" className="contact-error">{errors.topic}</p>}
                  </fieldset>

                  <div className="mt-6">
                    <Field id="contact-message" label="Message" error={errors.message}
                      hint={count > MESSAGE_MAX * 0.8 ? `${COUNT.format(count)} of ${COUNT.format(MESSAGE_MAX)} characters` : 'Please leave out card numbers, coupon codes and PINs.'}>
                      <textarea id="contact-message" name="message" rows={4} maxLength={MESSAGE_MAX} placeholder="How can we help?"
                        value={fields.message} onChange={(e) => set('message', e.target.value)} aria-invalid={!!errors.message || undefined} aria-describedby={described('message', true)} className="contact-input contact-textarea" />
                    </Field>
                  </div>

                  {abroad && (
                    <p className="contact-note mt-6">
                      It looks like you may be outside the United States. CouponDonation serves people in the US, so we may not be able to help with requests from elsewhere.
                    </p>
                  )}
                  <div className="mt-6"><UpdatesOptIn id="contact-updates" checked={optIn} onChange={setOptIn} /></div>
                  {failure && <p role="alert" className="contact-error mt-6 text-[0.95rem]">{failure}</p>}

                  <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
                    <Button type="submit" size="lg" disabled={sending} className="h-12 min-w-[11rem] px-7 text-[0.95rem] font-semibold">
                      {sending ? <><Loader2 className="animate-spin" aria-hidden="true" />Sending…</> : 'Send message'}
                    </Button>
                    <p className="max-w-xs text-sm leading-snug text-muted-foreground">
                      We use these details only to reply to you. <Link to="/privacy" className="whitespace-nowrap font-medium text-foreground underline underline-offset-4 hover:text-primary">Privacy policy</Link>
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        <aside aria-label="Other ways to reach us" className="contact-aside hidden xl:col-span-4 xl:flex">
          <dl className="flex flex-col items-end gap-7 text-right">
            <div><dt className="text-sm text-primary-foreground/65">Prefer email?</dt><dd className="mt-1"><a href="mailto:support@coupondonation.com" className="text-lg text-primary-foreground underline-offset-4 hover:underline">support@coupondonation.com</a></dd></div>
            <div><dt className="text-sm text-primary-foreground/65">Prefer to call?</dt><dd className="mt-1"><a href="tel:+13158986745" className="text-lg text-primary-foreground underline-offset-4 hover:underline">+1 (315) 898-6745</a></dd></div>
            <div><dt className="text-sm text-primary-foreground/65">Where we work</dt><dd className="mt-1 text-lg text-primary-foreground">United States</dd></div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
