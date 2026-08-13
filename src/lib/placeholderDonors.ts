// Rotating placeholder donors — used to keep the Top Donors panel populated
// until we have enough real donations to fill all 5 slots. Deterministic per
// UTC day so every visitor sees the same names and the set changes at midnight.

import type { TopDonor } from "@/hooks/useTopDonors";

const NAME_POOL = [
  "Sarah M.", "David P.", "Priya S.", "Miguel R.", "Jennifer L.",
  "Michael K.", "Anna S.", "James W.", "Lisa K.", "John D.",
  "Emily R.", "Carlos T.", "Aisha N.", "Robert H.", "Sophia G.",
  "Daniel O.", "Grace L.", "Kevin B.", "Rachel F.", "Omar A.",
  "Hannah W.", "Ethan C.", "Maya P.", "Noah B.", "Olivia J.",
  "Liam S.", "Ava M.", "Lucas T.", "Isabella D.", "Mason V.",
  "Zoe K.", "Nathan H.", "Chloe R.", "Benjamin F.", "Layla A.",
  "Samuel P.", "Nora G.", "Elijah W.", "Ruby L.", "Jacob N.",
];

const ANON_LABEL = "Anonymous";

// Simple deterministic PRNG (mulberry32).
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function daySeed() {
  return Math.floor(Date.now() / 86_400_000);
}

/**
 * Deterministic daily set of placeholder donors. Always includes at least one
 * "Anonymous" entry. Totals + gift counts are seeded so they don't jitter on
 * re-render but rotate day to day.
 */
export function getDailyPlaceholderDonors(count = 3): TopDonor[] {
  const rand = mulberry32(daySeed());

  // Shuffle a copy of the name pool.
  const shuffled = [...NAME_POOL];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const picks: { name: string; anon: boolean }[] = [];
  // Always include at least one Anonymous. Sometimes two.
  const anonCount = rand() > 0.5 ? 2 : 1;
  for (let i = 0; i < anonCount; i++) picks.push({ name: ANON_LABEL, anon: true });
  for (let i = 0; picks.length < count; i++) {
    picks.push({ name: shuffled[i], anon: false });
  }

  // Insert anons at random positions so they aren't always first.
  for (let i = picks.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [picks[i], picks[j]] = [picks[j], picks[i]];
  }

  const donors: TopDonor[] = picks.map(({ name, anon }) => {
    // Amount in $45–$480, gift count 1–4.
    const total = Math.round(45 + rand() * 435);
    const donations_count = 1 + Math.floor(rand() * 4);
    return {
      display_name: name,
      is_anonymous: anon,
      total,
      donations_count,
      is_placeholder: true,
    };
  });

  // Sort by total desc so ranking looks natural.
  donors.sort((a, b) => b.total - a.total);
  return donors;
}
