// Link previews for shared fundraisers (_shared/share-preview.ts, share-fundraiser).
import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import {
  cleanSlug, cropFor, excerpt, FALLBACK_IMAGE, imageSize, mainPhoto, photoSource, previewHtml, previewText, servedSize, SHARE_HOST,
  shareUrl, version,
} from './share-preview.ts';

// 37×23 test images in every format the site stores.
const SAMPLES: Record<string, string> = {
  webpLossy: 'UklGRkIAAABXRUJQVlA4IDYAAAAwAwCdASolABcAPtFmrFCoJaQipWgBABoJZwDPZBBF2G4AAP7ni/QfGV39etLc259OYpgAAAA=',
  webpLossless: 'UklGRh4AAABXRUJQVlA4TBEAAAAvJIAFAAdQvKKUp/+BiOh/AAA=',
  webpExtended: 'UklGRngAAABXRUJQVlA4WAoAAAAYAAAAJAAAFgAAQUxQSAoAAAABB1DAiAhERP8DVlA4IDYAAAAwAwCdASolABcAPtFmrFCoJaQipWgBABoJZwDPZBBF2G4AAP7ni/QfGV39etLc259OYpgAAABFWElGCgAAAE1NACoAAAAIAAA=',
  jpegExif: '/9j/4AAQSkZJRgABAQAAAQABAAD/4QBMRXhpZgAATU0AKgAAAAgAAQEOAAIAAAApAAAAGgAAAAB4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4AAD/2wBDACgcHiMeGSgjISMtKygwPGRBPDc3PHtYXUlkkYCZlo+AjIqgtObDoKrarYqMyP/L2u71////m8H////6/+b9//j/2wBDASstLTw1PHZBQXb4pYyl+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj/wAARCAAXACUDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwCvRRRUGAUUUUAFFFFABRRRQAUUUUAFFFFAH//Z',
  jpegProgressive: '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDACgcHiMeGSgjISMtKygwPGRBPDc3PHtYXUlkkYCZlo+AjIqgtObDoKrarYqMyP/L2u71////m8H////6/+b9//j/2wBDASstLTw1PHZBQXb4pYyl+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj4+Pj/wgARCAAXACUDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAP/xAAWAQEBAQAAAAAAAAAAAAAAAAAAAgP/2gAMAwEAAhADEAAAAZicwAAAAP/EABQQAQAAAAAAAAAAAAAAAAAAADD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAACD/2gAIAQMBAT8BX//EABQRAQAAAAAAAAAAAAAAAAAAACD/2gAIAQIBAT8BX//EABQQAQAAAAAAAAAAAAAAAAAAADD/2gAIAQEABj8Cf//EABQQAQAAAAAAAAAAAAAAAAAAADD/2gAIAQEAAT8hf//aAAwDAQACAAMAAAAQDDDDDD//xAAUEQEAAAAAAAAAAAAAAAAAAAAg/9oACAEDAQE/EF//xAAUEQEAAAAAAAAAAAAAAAAAAAAg/9oACAECAQE/EF//xAAUEAEAAAAAAAAAAAAAAAAAAAAw/9oACAEBAAE/EH//2Q==',
  png: 'iVBORw0KGgoAAAANSUhEUgAAACUAAAAXCAIAAAADThHyAAAAM0lEQVR4XmPUqLBhoCNgoqNdIDBqH3XBaHhSF4yGJ3XBaHhSF4yGJ3XBaHhSF4yGJ3UBAJX7AQodv63BAAAAAElFTkSuQmCC',
};
const bytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const SUPABASE = 'https://vbnbacowuoeeojjdrzzp.supabase.co';

Deno.test('reads the size of JPEG, PNG and every kind of WebP', () => {
  for (const [name, b64] of Object.entries(SAMPLES)) assertEquals(imageSize(bytes(b64)), { width: 37, height: 23 }, name);
  assertEquals(imageSize(new Uint8Array([1, 2, 3])), null);
  assertEquals(imageSize(bytes(SAMPLES.jpegExif).subarray(0, 40)), null);
});

Deno.test('crops to 4:3 and 16:9, never past the photo or 1200px wide', () => {
  assertEquals(cropFor({ width: 974, height: 609 }, 'og'), { width: 812, height: 609 });
  assertEquals(cropFor({ width: 974, height: 609 }, 'wide'), { width: 974, height: 548 });
  assertEquals(cropFor({ width: 1600, height: 1200 }, 'og'), { width: 1200, height: 900 });
  assertEquals(cropFor({ width: 1200, height: 1600 }, 'wide'), { width: 1200, height: 675 });
  assertEquals(cropFor(null, 'og'), { width: 1200, height: 900 });
  // Too narrow for a large 4:3 card: 1.91:1 keeps it at least 600×315.
  assertEquals(cropFor({ width: 667, height: 417 }, 'og'), { width: 667, height: 349 });
  // Too small either way: stays 4:3.
  assertEquals(cropFor({ width: 400, height: 300 }, 'og'), { width: 400, height: 300 });
  const site = photoSource('/__l5e/assets-v1/abc/example-1.webp', SUPABASE)!;
  assertEquals(servedSize(site, { width: 582, height: 329 }, 'og'), { width: 1200, height: 900 });
});

Deno.test('photo order matches the site: primary, then gallery order, then the old cover', () => {
  const images = [
    { image_url: 'b', display_order: 2 },
    { image_url: 'a', display_order: 1 },
    { image_url: 'p', display_order: 9, is_primary: true },
  ];
  assertEquals(mainPhoto({ cover_photo_url: 'cover', fundraiser_images: images }), 'p');
  assertEquals(mainPhoto({ cover_photo_url: 'cover', fundraiser_images: images.slice(0, 2) }), 'a');
  assertEquals(mainPhoto({ cover_photo_url: 'cover', fundraiser_images: [] }), 'cover');
  assertEquals(mainPhoto({ cover_photo_url: null, fundraiser_images: null }), null);
});

Deno.test('photos come only from our storage or our own file host, as JPEG crops', () => {
  const stored = photoSource(`${SUPABASE}/storage/v1/object/public/fundraiser-covers/u1/123-ab.webp`, SUPABASE)!;
  assertEquals(stored.kind, 'storage');
  assertEquals(stored.render({ width: 812, height: 609 }), `${SUPABASE}/storage/v1/render/image/public/fundraiser-covers/u1/123-ab.webp?width=812&height=609&resize=cover&quality=82`);
  const example = photoSource('/__l5e/assets-v1/abc/example-1.webp', SUPABASE)!;
  assertEquals(example.render({ width: 1200, height: 900 }), 'https://coupondonation.com/__l5e/assets-v1/abc/example-1.webp?w=1200&h=900&fit=cover&format=jpg');
  assertEquals(photoSource('https://coupondonation.com/__l5e/assets-v1/abc/x.webp', SUPABASE)?.kind, 'site');
  assertEquals(photoSource('https://evil.example/x.jpg', SUPABASE), null);
  assertEquals(photoSource(`${SUPABASE}/storage/v1/object/public/../secret`, SUPABASE), null);
  assertEquals(photoSource('/__l5e/../index.html', SUPABASE), null);
  assertEquals(photoSource(null, SUPABASE), null);
});

Deno.test('text follows GoFundMe: Donate to …, organized by …; story start; … needs your support for …', () => {
  const f = { title: 'Help Feed My Family This Month', story: 'My elderly mother, the woman who spent much of her life loving, caring for, and sacrificing for her family, is now facing one of the hardest battles.', is_example: false };
  const t = previewText(f, 'Laura B.');
  assertEquals(t.pageTitle, 'Fundraiser by Laura B. : Help Feed My Family This Month');
  assertEquals(t.title, 'Donate to Help Feed My Family This Month, organized by Laura B.');
  assertEquals(t.description, 'My elderly mother, the woman who spent much of her life loving, caring for, and sacrificing for her family, is now… Laura B. needs your support for Help Feed My Family This Month');
  assertEquals(previewText(f, null).title, 'Donate to Help Feed My Family This Month');
  assertEquals(previewText({ ...f, story: null }, 'Laura B.').description, 'Laura B. needs your support for Help Feed My Family This Month');
});

Deno.test('example campaigns say so and never ask for donations', () => {
  const t = previewText({ title: 'Help Ella go the distance', story: 'Ella runs.', is_example: true }, 'Someone');
  assert(!t.title.startsWith('Donate'));
  assertStringIncludes(t.title, 'example campaign');
  assertStringIncludes(t.description, 'Giving is closed on example campaigns.');
});

Deno.test('story text is plain: markdown, links and extra spaces removed', () => {
  assertEquals(excerpt('**Hi** [there](https://x.y)  \n\n see https://a.b/c #now'), 'Hi there see now');
  assertEquals(excerpt('word '.repeat(60)).endsWith('word…'), true);
  assert(excerpt('a'.repeat(300)).length <= 121);
});

Deno.test('slugs keep only lowercase letters, digits and dashes', () => {
  assertEquals(cleanSlug(' Help-Feed-my-family-LLGQNZ "><script> '), 'help-feed-my-family-llgqnzscript');
  assertEquals(cleanSlug(null), '');
  assertEquals(cleanSlug('x'.repeat(200)).length, 120);
});

Deno.test('preview page: escaped tags, og:url is the shared link, no meta refresh, people are sent on', () => {
  const page = previewHtml({
    url: shareUrl('help-x'), destination: 'https://coupondonation.com/f/help-x',
    pageTitle: 'Fundraiser by A : B', title: 'Donate to "B" <now>, organized by A', description: 'Story & more',
    image: { url: `${SHARE_HOST}/f/help-x/photo.jpg?v=${version('p')}`, width: 812, height: 609, type: 'image/jpeg', alt: 'B' },
    wideImage: { url: `${SHARE_HOST}/f/help-x/photo-wide.jpg?v=${version('p')}`, width: 974, height: 548 },
  });
  assertStringIncludes(page, '<meta property="og:url" content="https://share.coupondonation.com/f/help-x">');
  assertStringIncludes(page, '<meta property="og:title" content="Donate to &quot;B&quot; &lt;now&gt;, organized by A">');
  assertStringIncludes(page, '<meta property="og:image:width" content="812">');
  assertStringIncludes(page, '<meta property="og:image:type" content="image/jpeg">');
  assertStringIncludes(page, '<meta name="twitter:card" content="summary_large_image">');
  assertStringIncludes(page, 'photo-wide.jpg');
  assertStringIncludes(page, 'location.replace("https://coupondonation.com/f/help-x")');
  assertStringIncludes(page, 'noindex');
  assert(!/http-equiv="refresh"/i.test(page));
  assert(!page.includes('<now>'));
  assertEquals(FALLBACK_IMAGE.url, 'https://coupondonation.com/og-image.png');
});

Deno.test('a new main photo gets a new image link', () => {
  assert(version('a.webp') !== version('b.webp'));
  assertEquals(version('a.webp'), version('a.webp'));
});
