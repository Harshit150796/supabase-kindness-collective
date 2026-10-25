// Simple per-key request limits for public edge functions, kept in public.request_rate_limits
// (row-level security on, no policies: only the service role reads or writes it). Keys are hashed,
// so the table never holds raw IP or email addresses. If the table is missing or a query fails, the
// limit fails open: a limit must never lock real people out of signing up.

// deno-lint-ignore no-explicit-any
type Admin = any;

// The address Cloudflare saw (it overwrites cf-connecting-ip, so callers can't fake it), then the
// proxy's own headers. A raw X-Forwarded-For can carry a made-up first entry. IPv6 addresses count
// per /64 network: one home or phone usually gets a whole /64, so hopping inside it buys nothing.
export function clientIp(req: Request): string {
  const h = req.headers;
  const raw = (h.get("cf-connecting-ip") ?? h.get("x-real-ip") ?? (h.get("x-forwarded-for") ?? "").split(",")[0]).trim();
  return raw ? ipKey(raw) : "unknown";
}

/** IPv4 as it is; IPv6 cut to its /64 network; IPv4-mapped IPv6 back to plain IPv4. */
export function ipKey(ip: string): string {
  const s = ip.trim().toLowerCase().replace(/^\[|\]$/g, "").split("%")[0];
  if (!s.includes(":")) return s;
  const mapped = s.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (mapped) return mapped[1];
  const compressed = s.includes("::");
  const [head, tail = ""] = s.split("::");
  const h = head ? head.split(":") : [];
  const t = compressed && tail ? tail.split(":") : [];
  const groups = compressed ? [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill("0"), ...t] : h;
  return groups.slice(0, 4).map((g) => (parseInt(g, 16) || 0).toString(16)).join(":") + "::/64";
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

/**
 * True when the key has used up its allowance; otherwise records this request and returns false.
 * The count and the insert happen in one locked database call (rate_limit_take), so requests sent
 * in parallel can't all slip under the limit. If that call isn't available, it counts and records
 * in two steps as before.
 */
export async function overLimit(admin: Admin, bucket: string, key: string, max: number, windowMs: number): Promise<boolean> {
  try {
    const keyHash = await sha256(`${bucket}:${key.toLowerCase()}`);
    const { data, error } = await admin.rpc("rate_limit_take", {
      _bucket: bucket, _key_hash: keyHash, _max: max, _window_seconds: Math.round(windowMs / 1000),
    });
    if (!error && typeof data === "boolean") {
      if (Math.random() < 0.02) {
        await admin.from("request_rate_limits").delete().lt("created_at", new Date(Date.now() - 86_400_000).toISOString());
      }
      return !data;
    }
  } catch {
    /* fall back below */
  }
  if ((await recentCount(admin, bucket, key, windowMs)) >= max) return true;
  await recordEvent(admin, bucket, key);
  return false;
}

export const HOUR = 3_600_000;
export const QUARTER_HOUR = 900_000;
