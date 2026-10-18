import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const ROTATING_WORDS = ["transparent", "trackable", "real-time"];
const WORD_MS = 3000;

/** True once the homepage opening has started to uncover the page (or when there is none). */
function openingUncovered() {
  if (typeof document === "undefined") return true;
  const root = document.documentElement;
  return !root.classList.contains("cd-intro") || root.classList.contains("cd-iris");
}

/**
 * The hero's headline and two actions, centred above the tree (founder-chosen "two halves meet"):
 * "CouponDonation is" with a serif word that slides in (green, blue, then light), and one capsule
 * split in two, Donate now in logo green and Apply as Recipient in logo blue. When the scene
 * arrives (`play`) the halves slide in from either side and meet; a small heart pops into the
 * seam and beats now and then while the halves breathe apart and back. Nothing ever hides them.
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

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % ROTATING_WORDS.length), WORD_MS);
    return () => clearInterval(id);
  }, []);

  const prev = (idx + ROTATING_WORDS.length - 1) % ROTATING_WORDS.length;

  return (
    <div
      data-play={(play && uncovered) || undefined}
      className="hero-headline absolute top-4 md:top-7 left-1/2 -translate-x-1/2 z-30 w-[94%] max-w-2xl text-center pointer-events-auto transform-gpu antialiased"
    >
      <h1 className="sr-only">CouponDonation — Turn Donations Into Grocery Coupons for Verified Families</h1>
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
        <Link to="/apply" className="hero-half hero-half-ask">Apply as Recipient</Link>
      </div>
    </div>
  );
}
