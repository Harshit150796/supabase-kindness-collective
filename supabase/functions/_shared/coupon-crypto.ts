// Application-level authenticated encryption for spendable coupon secrets (codes, PINs, card numbers, CVVs).
// AES-256-GCM, random 96-bit IV per value, key derived by HKDF-SHA256 from COUPON_SECRET_KEY_V<n> (edge secret, never in the DB).
// Format: v1:k<n>:<iv b64url>:<ciphertext+tag b64url>. AAD binds each value to its field name.
export const SECRET_FIELDS = ['code', 'pin', 'number', 'cvv', 'name', 'zip'] as const;
export type SecretField = typeof SECRET_FIELDS[number];

const b64u = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));

export class KeyMissingError extends Error { constructor() { super('Encryption key not configured'); } }

/** Raw secret from env (base64 or plain), at least 32 bytes. `getEnv` is injectable for tests. */
async function deriveKey(raw: string): Promise<CryptoKey> {
  let bytes: Uint8Array;
  try { bytes = Uint8Array.from(atob(raw.trim()), (c) => c.charCodeAt(0)); } catch { bytes = new TextEncoder().encode(raw.trim()); }
  if (bytes.length < 32) throw new KeyMissingError();
  const base = await crypto.subtle.importKey('raw', bytes, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: new TextEncoder().encode('coupondonation'), info: new TextEncoder().encode('coupon-secrets') },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}

export class CouponCrypto {
  private cache = new Map<string, CryptoKey>();
  constructor(private getEnv: (name: string) => string | undefined = (n) => Deno.env.get(n)) {}
  /** Highest configured key id ("k1", "k2"...), or null when no key exists (fail closed). */
  currentKid(): string | null {
    for (let n = 9; n >= 1; n--) if ((this.getEnv(`COUPON_SECRET_KEY_V${n}`) ?? '').trim().length >= 32) return `k${n}`;
    return null;
  }
  private async key(kid: string) {
    if (!this.cache.has(kid)) {
      const raw = this.getEnv(`COUPON_SECRET_KEY_V${kid.slice(1)}`);
      if (!raw) throw new KeyMissingError();
      this.cache.set(kid, await deriveKey(raw));
    }
    return this.cache.get(kid)!;
  }
  async encrypt(field: SecretField, plain: string): Promise<string> {
    const kid = this.currentKid();
    if (!kid) throw new KeyMissingError();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(field) }, await this.key(kid), new TextEncoder().encode(plain)));
    return `v1:${kid}:${b64u(iv)}:${b64u(ct)}`;
  }
  async decrypt(field: SecretField, blob: string): Promise<string> {
    const [v, kid, iv, ct] = blob.split(':');
    if (v !== 'v1' || !/^k\d+$/.test(kid) || !iv || !ct) throw new Error('Unreadable secret');
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64u(iv), additionalData: new TextEncoder().encode(field) }, await this.key(kid), unb64u(ct));
    return new TextDecoder().decode(pt);
  }
  async decryptAll(cipher: Record<string, string> | null): Promise<Partial<Record<SecretField, string>>> {
    const out: Partial<Record<SecretField, string>> = {};
    if (!cipher) return out;
    for (const f of SECRET_FIELDS) if (typeof cipher[f] === 'string') out[f] = await this.decrypt(f, cipher[f]);
    return out;
  }
}
