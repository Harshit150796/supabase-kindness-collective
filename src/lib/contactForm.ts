import { US_STATES, US_TERRITORIES } from '@/data/usStates';
import { isUsPhone } from './phone';

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

// The US phone rule lives in ./phone (shared with account phone numbers).
export { usPhoneDigits, formatUsPhone, isUsPhone } from './phone';

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
