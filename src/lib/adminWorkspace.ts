/** Only non-sensitive list preferences may be stored in personal saved views. */
export const VIEW_KEYS = ['q', 'status', 'sort', 'dir', 'page', 'role', 'scope', 'view', 'tab', 'kind', 'period'] as const;
export function safeViewParams(params: URLSearchParams) {
  const safe = new URLSearchParams();
  for (const key of VIEW_KEYS) {
    const value = params.get(key);
    // Search text can contain donor emails; never persist it.
    if (value && key !== 'q') safe.set(key, value.slice(0, 100));
  }
  return safe.toString();
}
export async function fetchRpcPages<T>(load: (offset: number, limit: number) => Promise<T[]>, size = 200): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += size) {
    const page = await load(offset, size);
    rows.push(...page);
    if (page.length < size) return rows;
  }
}