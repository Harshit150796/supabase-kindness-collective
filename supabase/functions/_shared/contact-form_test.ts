import { assert, assertEquals, assertFalse } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  CONTACT_TOPIC_VALUES, US_REGIONS, cleanLine, cleanMessage, formatUsPhone, greetingName, normalizeUsPhone,
  renderContactConfirmation, renderSupportEmail, type ContactMessage,
} from './contact-message.ts';

/** The migration that creates contact_messages, whatever its generated file name. */
async function contactMigration(): Promise<string> {
  for await (const entry of Deno.readDir('supabase/migrations')) {
    if (!entry.name.endsWith('.sql')) continue;
    const sql = await Deno.readTextFile(`supabase/migrations/${entry.name}`);
    if (sql.includes('CREATE TABLE IF NOT EXISTS public.contact_messages')) return sql;
  }
  throw new Error('contact_messages migration not found');
}

const MESSAGE: ContactMessage = {
  id: '00000000-0000-4000-8000-000000000001', name: 'Jordan <b>Lee</b>', email: 'jordan@example.com', phone: '+13155550123',
  state: 'OH', topic: 'donation', message: 'Where did my donation go?\n\nI gave on Monday <script>x</script>.', page: '/faq',
  createdAt: '2026-10-11T18:00:00Z', signedIn: false,
};

Deno.test('the form, the server and the database accept the same US regions and topics', async () => {
  const states = await Deno.readTextFile('src/data/usStates.ts');
  const client = [...states.matchAll(/code: '([A-Z]{2})', name: '([^']+)'/g)].map(([, code, name]) => [code, name]);
  assertEquals(new Map(client), new Map(Object.entries(US_REGIONS)));
  assertEquals(client.length, 56); // 50 states, DC and 5 inhabited territories

  const form = await Deno.readTextFile('src/lib/contactForm.ts');
  const topics = [...form.matchAll(/\{ value: '([a-z]+)', label:/g)].map(([, value]) => value);
  assertEquals(topics, CONTACT_TOPIC_VALUES);

  const migration = await contactMigration();
  for (const topic of CONTACT_TOPIC_VALUES) assert(migration.includes(`'${topic}'`), topic);
});

Deno.test('US phone numbers are normalised, and anything else is refused', () => {
  assertEquals(normalizeUsPhone('(315) 555-0123'), '+13155550123');
  assertEquals(normalizeUsPhone('+1 315 555 0123'), '+13155550123');
  assertEquals(normalizeUsPhone(''), null);
  assertEquals(normalizeUsPhone(null), null);
  assertEquals(normalizeUsPhone('0155550123'), 'invalid'); // area code cannot start with 0
  assertEquals(normalizeUsPhone('3151550123'), 'invalid'); // exchange cannot start with 1
  assertEquals(normalizeUsPhone('+44 20 7946 0958'), 'invalid');
  assertEquals(formatUsPhone('+13155550123'), '+1 (315) 555-0123');
});

Deno.test('messages keep their paragraphs; names lose markup and line breaks', () => {
  assertEquals(cleanMessage('One\r\n\r\n\r\n\r\nTwo\u0007'), 'One\n\nTwo');
  assertEquals(cleanLine('Jordan\n<b>Lee</b>'), 'Jordan Lee');
  assertEquals(greetingName('jordan lee'), 'jordan');
  assertEquals(greetingName('Visit http://spam.example'), 'Visit');
  assertEquals(greetingName('http://spam.example now'), null);
  assertEquals(greetingName('12345'), null);
});

Deno.test('support gets the whole message, escaped, with a link to the admin panel', () => {
  const email = renderSupportEmail(MESSAGE);
  assert(email.subject.startsWith('New message: A donation from Jordan Lee (OH)'));
  assert(email.html.includes('Where did my donation go?<br><br>'));
  assertFalse(email.html.includes('<script>'));
  assert(email.html.includes('&lt;script&gt;'));
  assert(email.html.includes('/admin/contact?id=00000000-0000-4000-8000-000000000001'));
  assert(email.text.includes('Phone: +1 (315) 555-0123'));
  assert(email.text.includes('State: Ohio (OH)'));
});

Deno.test('the confirmation never repeats what was written and names support@coupondonation.com', () => {
  const email = renderContactConfirmation(MESSAGE);
  assertEquals(email.subject, 'We received your message');
  assertFalse(email.html.includes('Where did my donation go'));
  assertFalse(email.text.includes('Where did my donation go'));
  assert(email.html.includes('support@coupondonation.com'));
  assert(email.text.includes('support@coupondonation.com'));
  assert(email.html.includes('Hi Jordan'));
  assert(email.text.includes('coupon codes and PINs'));
});

Deno.test('contact messages go through public-submit, are stored, and reach support@ with the sender as Reply-To', async () => {
  const fn = await Deno.readTextFile('supabase/functions/public-submit/index.ts');
  assert(fn.includes("action: z.literal('contact')"));
  assert(fn.includes("if (b.website || (b.elapsed_ms ?? MIN_FILL_MS) < MIN_FILL_MS)"));
  assert(fn.includes("admin.from('contact_messages').insert("));
  assert(fn.includes('sendEmail(SUPPORT_EMAIL, email, renderSupportEmail(record))'));
  assert(fn.includes('sendEmail(email, SUPPORT_EMAIL, renderContactConfirmation(record))'));
  assert(fn.includes('PER_IP_PER_HOUR') && fn.includes('PER_EMAIL_PER_DAY'));

  const sql = await contactMigration();
  assert(sql.includes('ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY'));
  assert(sql.includes('USING (public.is_admin_any(auth.uid()))'));
  assertFalse(/GRANT (INSERT|UPDATE|DELETE|ALL)[^;]*contact_messages TO (anon|authenticated)/.test(sql));
  assert(sql.includes('IF NOT public.is_admin_staff(auth.uid())') && sql.includes('PERFORM public.log_admin_action('));
});

Deno.test('the closing section sits in the footer and opens without scroll handlers', async () => {
  const footer = await Deno.readTextFile('src/components/layout/Footer.tsx');
  const section = await Deno.readTextFile('src/components/layout/ContactClose.tsx');
  const css = await Deno.readTextFile('src/index.css');
  assert(footer.includes('{contact && <ContactClose />}'));
  assert(section.includes('new IntersectionObserver(') && !section.includes("addEventListener('scroll'"));
  assert(section.includes("supabase.functions.invoke('public-submit'"));
  assert(section.includes('name="state"') && section.includes('US_TERRITORIES') && section.includes('autoComplete="tel"'));
  assert(css.includes('.contact-close[data-open] .contact-panel{transform:none}'));
  assert(css.indexOf('.contact-close{') < css.indexOf('/* ---------- Site menu'));
});

Deno.test('the team reads contact messages in the admin panel', async () => {
  const app = await Deno.readTextFile('src/App.tsx');
  const layout = await Deno.readTextFile('src/components/admin/AdminLayout.tsx');
  const page = await Deno.readTextFile('src/pages/admin/AdminContactMessages.tsx');
  assert(app.includes('<Route path="/admin/contact" element={<GeoGuard mode="strict"><ProtectedRoute allowedRoles={TEAM}><AdminContactMessages />'));
  assert(layout.includes("{ label: 'Contact messages', path: '/admin/contact', icon: Inbox, countsNew: true }"));
  assert(page.includes("table: 'contact_messages'") && page.includes('<DataTable'));
  assert(page.includes("rpc('admin_set_contact_message_status'"));
});
