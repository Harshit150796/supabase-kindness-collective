const COUNTRY_NAMES: Record<string, string> = {
  us: 'United States',
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
