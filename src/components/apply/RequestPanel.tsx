import { AnimatePresence, motion } from "motion/react";
import { ShieldCheck } from "lucide-react";
import { AnimatedAmount } from "@/components/landing/donate/motion";
import { RetailerLogo } from "@/components/landing/donate/GiftLedger";
import { findRetailer } from "@/components/landing/donate/retailers";
import { SPRING } from "@/components/landing/donate/tokens";
import { needLabel } from "@/lib/helpNeeds";
import { BENEFICIARY_OPTIONS } from "./applyOptions";

interface RequestPanelProps {
  title: string;
  beneficiaryType: string;
  needs: string[];
  stores: string[];
  goal: number;
  place: string | null;
  words: number;
  photos: number;
  videos: number;
}

function Row({ label, children, empty }: { label: string; children?: React.ReactNode; empty: string }) {
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-4 border-t border-white/10 py-4 first:border-t-0">
      <dt className="text-sm text-white/60">{label}</dt>
      <dd className="min-w-0 text-[15px] leading-snug text-white">
        {children ?? <span className="text-white/40">{empty}</span>}
      </dd>
    </div>
  );
}

/**
 * The deep-green "Your request" panel beside the application (wide screens): it fills in as the
 * recipient answers, mirroring the donor's "Your gift" panel in the donate flow.
 */
export function RequestPanel({ title, beneficiaryType, needs, stores, goal, place, words, photos, videos }: RequestPanelProps) {
  const who = BENEFICIARY_OPTIONS.find((o) => o.id === beneficiaryType)?.title;
  const retailers = stores.map(findRetailer);
  return (
    <aside aria-label="Your request" data-request-panel className="flex h-full flex-col bg-primary-20 px-10 py-10 text-white xl:px-14 xl:py-12">
      <p className="text-sm text-white/70">Your request</p>
      <AnimatePresence mode="wait" initial={false}>
        <motion.p
          key={title ? "title" : "untitled"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`mt-2 line-clamp-2 font-display text-[1.75rem] leading-[1.1] ${title ? "text-white" : "text-white/35"}`}
        >
          {title || "Your title comes last"}
        </motion.p>
      </AnimatePresence>

      <div className="mt-8">
        <p className="text-sm text-white/70">Goal</p>
        {goal > 0
          ? <AnimatedAmount value={goal} className="mt-1 block font-display text-[4.5rem] leading-[0.95] tabular-nums xl:text-[5.25rem]" />
          : <p className="mt-1 font-display text-[4.5rem] leading-[0.95] text-white/25 xl:text-[5.25rem]">$0</p>}
      </div>

      <dl className="mt-8">
        <Row label="For" empty="Not chosen yet">{who}</Row>
        <Row label="Needs" empty="Not chosen yet">{needs.length ? needs.map(needLabel).join(", ") : undefined}</Row>
        <Row label="Stores" empty="Not chosen yet">
          {retailers.length ? (
            <div>
              <ul className="flex flex-wrap gap-1.5" aria-label="Stores">
                <AnimatePresence initial={false}>
                  {retailers.map((r) => (
                    <motion.li key={r.id} layout initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={SPRING} title={r.name}>
                      <RetailerLogo retailer={r} className="h-9 w-9 p-1" />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
              <p className="mt-2 text-sm text-white/70">{retailers.map((r) => r.name).join(", ")}</p>
            </div>
          ) : undefined}
        </Row>
        <Row label="Location" empty="Add your ZIP code">{place ?? undefined}</Row>
        <Row label="Story" empty="Not written yet">
          {words > 0 || photos > 0 || videos > 0
            ? [
                `${words} ${words === 1 ? "word" : "words"}`,
                `${photos} ${photos === 1 ? "photo" : "photos"}`,
                videos ? `${videos} ${videos === 1 ? "video" : "videos"}` : "",
              ].filter(Boolean).join(", ")
            : undefined}
        </Row>
      </dl>

      <div className="mt-auto pt-10">
        <p className="flex items-start gap-2.5 text-sm leading-relaxed text-white/75">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Free to apply. Help arrives as store coupons, never cash. Your answers are saved on this device as you go.</span>
        </p>
      </div>
    </aside>
  );
}
