/** Show a person's name with a capital first letter on each word ("sophie" → "Sophie"); the rest stays as typed. Display only — never saved. */
export function displayName<T extends string | null | undefined>(name: T): T {
  if (!name) return name;
  return name.trim().replace(/\s+/g, ' ').replace(/(^|[\s\-'’])(\p{Ll})/gu, (_, p: string, c: string) => p + c.toUpperCase()) as T;
}
