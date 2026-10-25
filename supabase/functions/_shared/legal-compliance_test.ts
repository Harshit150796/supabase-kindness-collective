import { assert, assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const root = new URL('../../../', import.meta.url);
const read = (path: string) => Deno.readTextFileSync(new URL(path, root));

function* walk(dir: string): Generator<string> {
  for (const entry of Deno.readDirSync(new URL(dir, root))) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory) yield* walk(path);
    else if (/\.(tsx?|txt)$/.test(entry.name) && !entry.name.endsWith('_test.ts')) yield path;
  }
}

const LEGAL_PAGES = ['/terms', '/privacy', '/cookies', '/refunds', '/fundraiser-rules', '/health-data-privacy', '/copyright', '/accessibility'];

Deno.test('every legal page has a route and a footer link', () => {
  const app = read('src/App.tsx');
  const footer = read('src/components/layout/Footer.tsx');
  for (const path of LEGAL_PAGES) {
    assert(app.includes(`path="${path}"`), `route ${path}`);
    assert(footer.includes(`'${path}'`) || footer.includes(`"${path}"`), `footer ${path}`);
  }
});

Deno.test('buttons that create accounts, sign in or pay carry the agreement notice', () => {
  for (const file of ['src/pages/Auth.tsx', 'src/components/apply/AccountDialog.tsx', 'src/components/apply/SignInPrompt.tsx', 'src/components/landing/donate/ReviewStep.tsx']) {
    assert(read(file).includes('<AgreementNotice'), file);
  }
  assert(read('src/pages/Auth.tsx').includes('markAgreement('));
  assert(read('src/components/auth/GoogleSignIn.tsx').includes("markAgreement('google')"));
  assert(read('src/hooks/useAuth.tsx').includes('flushAgreement('));
  const review = read('src/components/apply/steps/ReviewStep.tsx');
  assert(review.includes('data-apply-confirm'));
  assert(read('src/pages/ApplyRecipient.tsx').includes('recordAgreement(userId, "fundraiser-submit"'));
});

Deno.test('the site never claims charity status, tax deductions, verification or retailer partnerships', () => {
  const banned = [
    /verified (families|family|recipients|needs)/i,
    /\bPCI[- ]?(DSS )?complian/i,
    /(?<!not |aren't |isn't |no |never )tax[- ]deductible(?! receipts)/i,
    /participating (retailers|stores|brands|grocers)/i,
    /\ba (registered )?charity that\b/i,
  ];
  const allowed = /is not a registered charity|not a registered (501|charity)|not tax-deductible|(aren|isn)['’]t tax-deductible|tax-deductible\?/i;
  for (const dir of ['src/pages', 'src/components', 'src/data/needs.ts', 'src/data/givePages.ts', 'public/llms.txt', 'index.html', 'supabase/functions']) {
    const files = dir.includes('.') ? [dir] : [...walk(dir)];
    for (const file of files) {
      // Admin screens and the unused legacy story components aren't public copy.
      if (file.includes('/admin/') || file.includes('/story/')) continue;
      for (const line of read(file).split('\n')) {
        if (allowed.test(line)) continue;
        for (const pattern of banned) assert(!pattern.test(line), `${file}: ${line.trim().slice(0, 120)}`);
      }
    }
  }
});

Deno.test('analytics respects Global Privacy Control and the Essential only choice', () => {
  const analytics = read('src/components/VisitorAnalytics.tsx');
  assert(analytics.includes('globalPrivacyControl'));
  assert(analytics.includes('opt_out_capturing'));
  const banner = read('src/components/PrivacyConsentBanner.tsx');
  assert(banner.includes('Essential only'));
});

Deno.test('moving content can be paused', () => {
  assert(read('src/components/landing/HeroSection.tsx').includes('<MotionPauseButton'));
  assert(read('src/components/layout/Footer.tsx').includes('<MotionPauseButton'));
  assert(read('src/index.css').includes('html[data-motion="paused"]'));
  assert(read('src/components/landing/TestimonialsSection.tsx').includes('still'));
});

Deno.test('stock-photo testimonials never show', () => {
  const voices = read('src/components/landing/TestimonialsSection.tsx');
  assert(voices.includes('STOCK_PHOTO.test(voice.image)'));
});

Deno.test('retired functions refuse every request', () => {
  for (const name of ['import-subscribers', 'stripe-account-diagnose', 'backfill-stripe-donations', 'create-stripe-checkout']) {
    const source = read(`supabase/functions/${name}/index.ts`);
    assert(source.includes('410'), name);
    assert(!source.includes('createClient'), name);
  }
});

Deno.test('public functions that send codes or reveal accounts are rate-limited', () => {
  for (const name of ['check-email-exists', 'send-otp', 'verify-otp', 'coupon-chat']) {
    assert(read(`supabase/functions/${name}/index.ts`).includes('../_shared/rate-limit.ts'), name);
  }
  assertEquals(read('supabase/functions/check-email-exists/index.ts').includes('console.log(`Email check'), false);
});
