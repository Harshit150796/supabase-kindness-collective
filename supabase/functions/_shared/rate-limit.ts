// Simple per-key request limits for public edge functions, kept in public.request_rate_limits
// (row-level security on, no policies: only the service role reads or writes it). Keys are hashed,
// so the table never holds raw IP or email addresses. If the table is missing or a query fails, the
// limit fails open: a limit must never lock real people out of signing up.

// deno-lint-ignore no-explicit-any
type Admin = any;

export function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
}

async function sha256(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** How many events were recorded for this bucket and key within the window. */
export async function recentCount(admin: Admin, bucket: string, key: string, windowMs: number): Promise<number> {
  try {
    const keyHash = await sha256(`${bucket}:${key.toLowerCase()}`);
    const since = new Date(Date.now() - windowMs).toISOString();
    const { count, error } = await admin
      .from("request_rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("bucket", bucket)
      .eq("key_hash", keyHash)
      .gte("created_at", since);
    return error ? 0 : count ?? 0;
  } catch {
    return 0;
  }
}

/** Records one event for this bucket and key; now and then clears rows older than a day. */
export async function recordEvent(admin: Admin, bucket: string, key: string): Promise<void> {
  try {
    const keyHash = await sha256(`${bucket}:${key.toLowerCase()}`);
    await admin.from("request_rate_limits").insert({ bucket, key_hash: keyHash });
    if (Math.random() < 0.02) {
      await admin.from("request_rate_limits").delete().lt("created_at", new Date(Date.now() - 86_400_000).toISOString());
    }
  } catch {
    /* fail open */
  }
}

/** True when the key has used up its allowance; otherwise records this request and returns false. */
export async function overLimit(admin: Admin, bucket: string, key: string, max: number, windowMs: number): Promise<boolean> {
  if ((await recentCount(admin, bucket, key, windowMs)) >= max) return true;
  await recordEvent(admin, bucket, key);
  return false;
}

export const HOUR = 3_600_000;
export const QUARTER_HOUR = 900_000;
