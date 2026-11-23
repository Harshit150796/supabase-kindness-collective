import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Mail, MessageSquare, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fundraiserShareUrl } from "@/lib/fundraiserSharing";
import { prepareShareCard } from "@/lib/sharePreview";
import { liveShareMessage } from "../../../supabase/functions/_shared/share-message.ts";

const SUPPORT = "support@coupondonation.com";
export const HELLO_SUBJECT = "Hi CouponDonation";
export const HELLO_BODY = "Hi CouponDonation, please keep me posted about my fundraiser.";

interface ShareScreenProps {
  fundraiserId: string | null;
  slug: string | null;
  title: string;
  beneficiary: string;
  /** Store names, as they asked for them. */
  stores: string[];
  /** The address our emails go to, when we know it. */
  email?: string | null;
  onGoToFundraiser: () => void;
}

/**
 * Right after someone submits a fundraiser (founder request, Nov 22, 2026). Two things that work better on the
 * site than in an email, where links to our site were landing in Spam for new people:
 *  1. Text it to 5 people now: the same ready message as the "Your fundraiser is live" email (liveShareMessage),
 *     with Copy, Text it, WhatsApp and the phone's own share menu.
 *  2. A one-tap hello to support@ from their own email. In our Gmail tests, once someone had written to us,
 *     our emails with links reached their inbox instead of Spam.
 */
export const ShareScreen = ({ fundraiserId, slug, title, beneficiary, stores, email, onGoToFundraiser }: ShareScreenProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [helloOpened, setHelloOpened] = useState(false);
  const url = fundraiserShareUrl(slug, fundraiserId ?? "");
  const { chat } = liveShareMessage({ title, stores, beneficiary }, url);
  const lead = chat.slice(0, chat.length - url.length).trimEnd();
  const e = encodeURIComponent;
  const canShare = typeof navigator !== "undefined" && "share" in navigator;
  // On a computer, mailto: often opens nothing, so the hello opens Gmail's compose window instead.
  const onComputer = useMemo(() => typeof window !== "undefined" && window.matchMedia?.("(hover: hover) and (pointer: fine)").matches, []);
  const mailto = `mailto:${SUPPORT}?subject=${e(HELLO_SUBJECT)}&body=${e(HELLO_BODY)}`;
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${e(SUPPORT)}&su=${e(HELLO_SUBJECT)}&body=${e(HELLO_BODY)}`;

  // Ready the link preview (their photo and title) before the first message goes out.
  useEffect(() => { prepareShareCard(slug); }, [slug]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(chat);
      setCopied(true);
      toast({ title: "Message copied", description: "Paste it into a text to someone you know." });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Couldn't copy", description: "Press and hold the message to copy it." });
    }
  };
  const more = async () => {
    try { await navigator.share({ title, text: chat }); } catch { /* dismissed */ }
  };

  const action =
    "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  const quiet = `${action} border border-border bg-background text-foreground hover:bg-secondary`;

  return (
    <main className="min-h-dvh bg-background px-4 pb-12 pt-10 sm:pt-16">
      <div className="mx-auto w-full max-w-md">
        <h1 className="font-display text-4xl leading-[1.05] text-foreground sm:text-5xl">Text it to 5 people now</h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          The first gifts almost always come from people who know you. Send this to five people, one at a time.
        </p>

        <div className="mt-6 rounded-2xl bg-secondary/70 p-4 text-[15px] leading-relaxed text-foreground" aria-label="Your message">
          <p className="whitespace-pre-wrap select-text">{lead}</p>
          <p className="mt-2 break-all font-medium text-verify">{url}</p>
        </div>

        <div className="mt-4 grid gap-2">
          <a href={`sms:?&body=${e(chat)}`} className={`${action} bg-primary text-primary-foreground hover:bg-primary/90`}>
            <MessageSquare className="h-4 w-4" aria-hidden />Text it
          </a>
          <div className={`grid gap-2 ${canShare ? "grid-cols-3" : "grid-cols-2"}`}>
            <button type="button" onClick={copy} className={quiet}>
              {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}{copied ? "Copied" : "Copy"}
            </button>
            <a href={`https://wa.me/?text=${e(chat)}`} target="_blank" rel="noopener noreferrer" className={quiet}>WhatsApp</a>
            {canShare && (
              <button type="button" onClick={more} className={quiet}>
                <Share2 className="h-4 w-4" aria-hidden />More
              </button>
            )}
          </div>
        </div>

        <section className="mt-10 rounded-2xl border border-border p-5" aria-labelledby="hello-heading">
          <h2 id="hello-heading" className="font-display text-2xl font-normal leading-tight text-foreground">Get gift alerts in your inbox, not Spam</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            Send us a quick hello{email ? <> from <span className="font-medium text-foreground">{email}</span></> : " from your email"}. It helps our emails about your gifts reach your inbox.
          </p>
          <a
            href={onComputer ? gmail : mailto}
            target={onComputer ? "_blank" : undefined}
            rel={onComputer ? "noopener noreferrer" : undefined}
            onClick={() => setHelloOpened(true)}
            className={`${action} mt-4 w-full bg-verify text-verify-foreground hover:bg-verify/90`}
          >
            <Mail className="h-4 w-4" aria-hidden />Say hi to CouponDonation
          </a>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground" aria-live="polite">
            {helloOpened
              ? "Now tap Send in your email. That’s all."
              : `It opens your email with “${HELLO_BODY}” ready to send.`}
          </p>
          {onComputer && (
            <p className="mt-1 text-sm text-muted-foreground">
              Not on Gmail? <a href={mailto} onClick={() => setHelloOpened(true)} className="font-medium text-verify underline underline-offset-2">Use your email app</a>.
            </p>
          )}
        </section>

        <button type="button" onClick={onGoToFundraiser} className={`${quiet} mt-8 w-full`}>
          Go to my fundraiser
        </button>
      </div>
    </main>
  );
};
