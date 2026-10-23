import { expect, test } from 'bun:test';
import { createGoogleNonce, googleIdentityOptions, googleTokenRequest } from '../../../src/lib/googleIdentity';

test('direct Google sign-in never automatically selects an account', () => {
  const options = googleIdentityOptions('hashed-nonce', () => undefined);
  expect(options.auto_select).toBe(false);
  expect(options.ux_mode).toBe('popup');
});
test('Google receives a hash while the sign-in service receives the raw nonce', async () => {
  const nonce = await createGoogleNonce();
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nonce.raw));
  const expected = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  expect(nonce.hashed).toBe(expected);
  expect(nonce.hashed).not.toBe(nonce.raw);
  expect(googleIdentityOptions(nonce.hashed, () => undefined).nonce).toBe(expected);
  expect(googleTokenRequest('test-credential', nonce.raw)).toEqual({ provider: 'google', token: 'test-credential', nonce: nonce.raw });
});
test('each sign-in button gets a fresh cryptographically random nonce', async () => {
  const first = await createGoogleNonce();
  const second = await createGoogleNonce();
  expect(first.raw).toHaveLength(64);
  expect(second.raw).not.toBe(first.raw);
});
test('missing Google credentials cannot start a session exchange', () => {
  expect(() => googleTokenRequest(undefined, 'raw-nonce')).toThrow();
  expect(() => googleTokenRequest('', 'raw-nonce')).toThrow();
  expect(() => googleTokenRequest('test-credential', '')).toThrow();
});
