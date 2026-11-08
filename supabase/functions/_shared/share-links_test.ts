// Share buttons hand out share.coupondonation.com/f/<slug> (link previews with the fundraiser's own photo and
// title); the website widget, QR codes and "Public page" open coupondonation.com/f/<slug> directly.
import { assert, assertStringIncludes } from 'jsr:@std/assert@1';

const read = (p: string) => Deno.readTextFileSync(new URL(`../../../${p}`, import.meta.url));

Deno.test('share buttons use the share link; widget, QR codes and Public page use the page itself', () => {
  const lib = read('src/lib/fundraiserSharing.ts');
  assertStringIncludes(lib, '"https://share.coupondonation.com"');
  assertStringIncludes(lib, 'const SITE = "https://coupondonation.com";');
  assert(!/supabase\.co/.test(lib), 'never share a raw backend address');

  const sheet = read('src/components/fundraiser/campaign/ShareSheet.tsx');
  assertStringIncludes(sheet, 'return fundraiserShareUrl(slug, slug);');
  assert(!/create-qr-code[^`]*data=\$\{e\(url\)\}/.test(sheet), 'QR codes open the page, not the share link');

  const modal = read('src/components/apply/ShareModal.tsx');
  assertStringIncludes(modal, '<iframe src="${pageUrl}?embed=true"');
  assert(!/create-qr-code[^`]*encodeURIComponent\(shareUrl\)/.test(modal), 'QR codes open the page, not the share link');

  const dashboard = read('src/pages/FundraiserDashboard.tsx');
  assertStringIncludes(dashboard, 'const shareUrl = fundraiserShareUrl(');
  assertStringIncludes(dashboard, 'window.open(pageUrl, "_blank", "noopener")');
  assertStringIncludes(dashboard, 'pageUrl={pageUrl}');

  assertStringIncludes(read('src/pages/MyFundraisers.tsx'), 'shareFundraiser(f.title, fundraiserShareUrl(f.unique_slug, f.id))');
});
