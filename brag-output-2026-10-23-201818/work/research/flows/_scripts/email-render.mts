// Renders the repo's own email templates with neutral SAMPLE data (test flag on: "This is a test message.").
import { writeFileSync } from 'node:fs';
import { renderDonationConfirmation } from '../../../../../supabase/functions/_shared/account-emails.ts';
const OUT = '/home/user/supabase-kindness-collective/brag-output-2026-10-23-201818/work/research/flows';
const conf = renderDonationConfirmation({
  amount: 50, at: '2026-10-23T18:00:00Z', donationId: '00000000-0000-4000-8000-000000000000',
  retailers: ['Walmart', 'Target', 'DoorDash'], coins: { kind: 'credited', coins: 500 }, link: { label: 'View your donations', url: 'https://coupondonation.com/dashboard/giving' }, test: true,
});
writeFileSync(`${OUT}/email-1.html`, `<!-- SAMPLE render of renderDonationConfirmation (supabase/functions/_shared/account-emails.ts) with test data; subject: ${conf.subject} -->\n` + conf.html);
console.log('subject:', conf.subject);
console.log(conf.text);
