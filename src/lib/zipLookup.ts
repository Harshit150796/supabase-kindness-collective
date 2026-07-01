import { useQuery } from '@tanstack/react-query';

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

function writeCache(zip: string, value: ZipLocation) {
  try {
    localStorage.setItem(CACHE_PREFIX + zip, JSON.stringify(value));
  } catch {
    /* ignore quota */
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
    writeCache(zip, value);
    return value;
  } catch {
    return null;
  }
}

export function useZipLocation(zip?: string | null, country?: string | null) {
  const clean = (zip || '').trim().split('-')[0];
  const isUs = !country || country.toLowerCase() === 'us';
  const valid = isUs && /^\d{5}$/.test(clean);

  const query = useQuery({
    queryKey: ['zip-location', clean],
    queryFn: () => fetchUsZip(clean),
    enabled: valid,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });

  if (valid && query.data) {
    return `${query.data.city}, ${query.data.stateCode}`;
  }
  return clean || null;
}
