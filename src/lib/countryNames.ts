const COUNTRY_NAMES: Record<string, string> = {
  us: 'United States',
  ca: 'Canada',
  gb: 'United Kingdom',
  uk: 'United Kingdom',
  in: 'India',
  au: 'Australia',
  de: 'Germany',
  fr: 'France',
  es: 'Spain',
  it: 'Italy',
  nl: 'Netherlands',
  se: 'Sweden',
  no: 'Norway',
  dk: 'Denmark',
  fi: 'Finland',
  ie: 'Ireland',
  nz: 'New Zealand',
  mx: 'Mexico',
  br: 'Brazil',
  ar: 'Argentina',
  jp: 'Japan',
  kr: 'South Korea',
  cn: 'China',
  sg: 'Singapore',
  ae: 'United Arab Emirates',
  sa: 'Saudi Arabia',
  za: 'South Africa',
  ng: 'Nigeria',
  ke: 'Kenya',
  eg: 'Egypt',
  pk: 'Pakistan',
  bd: 'Bangladesh',
  ph: 'Philippines',
  id: 'Indonesia',
  th: 'Thailand',
  vn: 'Vietnam',
  my: 'Malaysia',
  ch: 'Switzerland',
  at: 'Austria',
  be: 'Belgium',
  pt: 'Portugal',
  pl: 'Poland',
  tr: 'Turkey',
  gr: 'Greece',
  il: 'Israel',
};

export function formatCountry(code?: string | null): string | null {
  if (!code) return null;
  const trimmed = code.trim();
  if (!trimmed) return null;
  // If already looks like a full name (has space or >3 chars and not all caps-code)
  if (trimmed.length > 3 || /\s/.test(trimmed)) return trimmed;
  const key = trimmed.toLowerCase();
  return COUNTRY_NAMES[key] ?? trimmed.toUpperCase();
}
