import { US_STATES, US_TERRITORIES } from '@/data/usStates';

/** What a message is about. The server (`_shared/contact-message.ts`) accepts exactly these values. */
export const CONTACT_TOPICS = [
  { value: 'donation', label: 'A donation' },
  { value: 'fundraiser', label: 'A fundraiser' },
  { value: 'recipient', label: 'Getting help' },
  { value: 'account', label: 'My account' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'other', label: 'Something else' },
] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number]['value'];
export const contactTopicLabel = (value?: string | null) => CONTACT_TOPICS.find((topic) => topic.value === value)?.label ?? 'Something else';

export const MESSAGE_MIN = 10;
export const MESSAGE_MAX = 2000;

const REGIONS = new Set([...US_STATES, ...US_TERRITORIES].map((region) => region.code));

/** The ten national digits of a US number, without a leading country code 1. */
export function usPhoneDigits(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits.slice(0, 10);
}

/** Formats as the person types: 3155550123 → (315) 555-0123. */
export function formatUsPhone(raw: string): string {
  const d = usPhoneDigits(raw);
  if (d.length < 4) return d.length ? `(${d}` : '';
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** North American numbering: area code and exchange both start with 2–9. */
export function isUsPhone(raw: string): boolean {
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(usPhoneDigits(raw));
}

export type ContactFields = { name: string; email: string; phone: string; state: string; topic: string; message: string };
export type ContactErrors = Partial<Record<keyof ContactFields, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateContact(fields: ContactFields): ContactErrors {
  const errors: ContactErrors = {};
  const name = fields.name.trim();
  const message = fields.message.trim();
  if (name.length < 2) errors.name = 'Enter your name.';
  if (!EMAIL.test(fields.email.trim())) errors.email = 'Enter an email address like name@example.com.';
  if (fields.phone.trim() && !isUsPhone(fields.phone)) errors.phone = 'Enter a 10-digit US number, or leave this blank.';
  if (!REGIONS.has(fields.state)) errors.state = 'Choose the state you live in.';
  if (!CONTACT_TOPICS.some((topic) => topic.value === fields.topic)) errors.topic = 'Choose what your message is about.';
  if (message.length < MESSAGE_MIN) errors.message = `Write at least ${MESSAGE_MIN} characters so we can help.`;
  else if (message.length > MESSAGE_MAX) errors.message = `Keep your message under ${MESSAGE_MAX} characters.`;
  return errors;
}
