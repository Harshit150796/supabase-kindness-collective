import { prefetchApply } from "@/lib/applyRoute";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { canopyTopPx, PHONE_BREAKPOINT } from "@/lib/heroBackdrop";
import { useMotionPreference } from "@/hooks/useMotionPreference";

const ROTATING_WORDS = ["transparent", "trackable", "real-time"];
const WORD_MS = 3000;

/** True once the homepage opening has started to uncover the page (or when there is none). */
function openingUncovered() {
  if (typeof document === "undefined") return true;
  const root = document.documentElement;
  return !root.classList.contains("cd-intro") || root.classList.contains("cd-iris");
}

/**
 * The hero's headline and two actions (founder-chosen "two halves meet"), centred just above the
 * tree's canopy: "CouponDonation is" with a serif word that slides in (green, blue, then light), and
 * one capsule split in two, Donate now in logo green and Apply as Recipient in logo blue. Sizes are
 * fixed (no scaling with the window); only the position follows the canopy, whose top comes from the
 * tree camera (canopyTopPx), so the buttons always rest right on top of the tree. The moon and sun
 * move right of them (orbX). When the scene arrives the halves slide in and meet, a heart pops into
 * the seam, then every 9s they breathe apart and back. Nothing ever hides them.
 */
export function HeroHeadline({ play = true }: { play?: boolean }) {
  const [idx, setIdx] = useState(0);
  // The halves meet in view: under the opening's cover they wait for it to lift.
  const [uncovered, setUncovered] = useState(openingUncovered);

  useEffect(() => {
    if (uncovered) return;
    const lift = () => setUncovered(true);
    window.addEventListener("cd:intro-iris", lift, { once: true });
    window.addEventListener("cd:intro-end", lift, { once: true });
    return () => { window.removeEventListener("cd:intro-iris", lift); window.removeEventListener("cd:intro-end", lift); };
  }, [uncovered]);

  // The word keeps changing unless the visitor paused animations.
  const still = useMotionPreference() === 'gentle';
  useEffect(() => {
    if (still) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % ROTATING_WORDS.length), WORD_MS);
    return () => clearInterval(id);
  }, [still]);

  const prev = (idx + ROTATING_WORDS.length - 1) % ROTATING_WORDS.length;

  // Keep the buttons resting on the canopy: its top follows the hero's size through the camera.
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const place = () => {
      const { clientWidth: w, clientHeight: h } = el;
      if (w && h) el.style.setProperty("--canopy", `${canopyTopPx(w, h, window.innerWidth < PHONE_BREAKPOINT).toFixed(1)}px`);
    };
    place();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(place);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} data-play={(play && uncovered) || undefined} className="hero-headline antialiased">
      <h1 className="sr-only">CouponDonation — Turn Donations Into Grocery Coupons for Families in Need</h1>
      <div className="hero-cta container mx-auto px-4 lg:px-8">
        <div className="hero-cta-box">
          <p className="hero-kicker">
            <span className="hero-kicker-lead font-sans">CouponDonation is</span>
            <span className="hero-kicker-word font-display" aria-live="off">
              {ROTATING_WORDS.map((word, index) => (
                <span
                  key={word}
                  data-word={index}
                  data-state={index === idx ? "on" : index === prev ? "out" : "next"}
                  aria-hidden={index !== idx}
                >
                  {word}
                </span>
              ))}
            </span>
          </p>
          <div className="hero-pair">
            <Link to="/donate" className="hero-half hero-half-give">Donate now</Link>
            <span className="hero-seam" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 20.5s-8-4.9-8-10.6A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 8 2.6c0 5.7-8 10.6-8 10.6z" />
              </svg>
            </span>
            <Link to="/apply" className="hero-half hero-half-ask" onPointerEnter={prefetchApply} onTouchStart={prefetchApply} onFocus={prefetchApply}>Apply as Recipient</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
