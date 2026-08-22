// Lightweight client-side geo detection.
// Fail-open: on error/timeout we return null so the guard does NOT block
// legitimate US users if the lookup services are unreachable.

const CACHE_KEY = "geo_country";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let inMemory: { country: string | null; ts: number } | null = null;
let inflight: Promise<string | null> | null = null;

type Cached = { country: string | null; ts: number };

function readCache(): Cached | null {
  if (inMemory && Date.now() - inMemory.ts < CACHE_TTL_MS) return inMemory;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cached;
    if (Date.now() - parsed.ts >= CACHE_TTL_MS) return null;
    inMemory = parsed;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(country: string | null) {
  const entry: Cached = { country, ts: Date.now() };
  inMemory = entry;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    /* ignore */
  }
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function lookup(): Promise<string | null> {
  try {
    const res = await fetchWithTimeout("https://ipapi.co/json/", 3000);
    if (res.ok) {
      const data = await res.json();
      const code = (data?.country_code || data?.country || "").toString().toUpperCase();
      if (code && code.length === 2) return code;
    }
  } catch {
    /* fall through to secondary */
  }
  try {
    const res = await fetchWithTimeout("https://api.country.is/", 3000);
    if (res.ok) {
      const data = await res.json();
      const code = (data?.country || "").toString().toUpperCase();
      if (code && code.length === 2) return code;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function getUserCountry(): Promise<string | null> {
  const cached = readCache();
  if (cached) return cached.country;
  if (inflight) return inflight;
  inflight = (async () => {
    const country = await lookup();
    // Only cache US / failed lookups. A bad non-US answer from a free IP
    // database (common on VPN exit ranges) must not stick for the session.
    if (country === null || country === "US") writeCache(country);
    inflight = null;
    return country;
  })();
  return inflight;
}
