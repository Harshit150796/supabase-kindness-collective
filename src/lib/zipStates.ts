import { useQueries } from '@tanstack/react-query';

interface ZipLocation {
  city: string;
  stateCode: string;
}

const CACHE_PREFIX = 'ziploc:';

function readCache(zip: string): ZipLocation | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + zip);
    return raw ? (JSON.parse(raw) as ZipLocation) : null;
  } catch {
    return null;
  }
}

async function fetchUsZip(zip: string): Promise<ZipLocation | null> {
  const cached = readCache(zip);
  if (cached) return cached;
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!res.ok) return null;
    const data = await res.json();
    const place = data?.places?.[0];
    if (!place) return null;
    const value: ZipLocation = {
      city: place['place name'],
      stateCode: place['state abbreviation'],
    };
    try {
      localStorage.setItem(CACHE_PREFIX + zip, JSON.stringify(value));
    } catch {
      /* ignore quota */
    }
    return value;
  } catch {
    return null;
  }
}

function normalize(zip?: string | null, country?: string | null) {
  const clean = (zip || '').trim().split('-')[0];
  const isUs = !country || country.toLowerCase() === 'us';
  const valid = isUs && /^\d{5}$/.test(clean);
  return { clean, valid };
}

/**
 * Batch-resolve zip -> {city, stateCode} for many fundraisers at once.
 * Returns a Map keyed by the raw zip_code.
 */
export function useZipStates(
  items: { zip_code?: string | null; country?: string | null }[]
): Map<string, string> {
  const unique = new Map<string, string>(); // clean -> raw
  items.forEach((it) => {
    const { clean, valid } = normalize(it.zip_code, it.country);
    if (valid && it.zip_code && !unique.has(clean)) {
      unique.set(clean, it.zip_code);
    }
  });

  const queries = useQueries({
    queries: Array.from(unique.keys()).map((clean) => ({
      queryKey: ['zip-location', clean],
      queryFn: () => fetchUsZip(clean),
      staleTime: Infinity,
      gcTime: Infinity,
      retry: false,
    })),
  });

  const out = new Map<string, string>();
  Array.from(unique.entries()).forEach(([clean, raw], idx) => {
    const data = queries[idx]?.data as ZipLocation | null | undefined;
    if (data?.stateCode) out.set(raw, data.stateCode);
  });
  return out;
}
