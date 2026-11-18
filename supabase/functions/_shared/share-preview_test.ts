// Link previews for shared fundraisers (_shared/share-preview.ts, share-fundraiser).
import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import {
  cardName, cardUrl, cleanSlug, excerpt, FALLBACK_IMAGE, imageSize, mainPhoto, parseCardName, photoSource, previewHtml, previewText,
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

Deno.test('the stored preview photo is named by photo version and size, and served from the storage CDN', () => {
  const v = version(`${SUPABASE}/storage/v1/object/public/fundraiser-covers/u1/123-ab.webp`);
  const name = cardName(v, { width: 1086, height: 679 });
  assertEquals(name, `${v}-1086x679.jpg`);
  assertEquals(parseCardName(name), { version: v, width: 1086, height: 679 });
  assertEquals(parseCardName('.emptyFolderPlaceholder'), null);
  assertEquals(parseCardName('x-1x1.png'), null);
  assertEquals(cardUrl(SUPABASE, 'f-id', name), `${SUPABASE}/storage/v1/object/public/fundraiser-covers/share-cards/f-id/${name}`);
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

Deno.test('photos come only from our storage or our own file host, whole (never cropped), as JPEG', () => {
  const stored = photoSource(`${SUPABASE}/storage/v1/object/public/fundraiser-covers/u1/123-ab.webp`, SUPABASE)!;
  assertEquals(stored.kind, 'storage');
  assertEquals(stored.whole(82), `${SUPABASE}/storage/v1/render/image/public/fundraiser-covers/u1/123-ab.webp?width=1200&height=1200&resize=contain&quality=82`);
  const example = photoSource('/__l5e/assets-v1/abc/example-1.webp', SUPABASE)!;
  assertEquals(example.whole(82), 'https://coupondonation.com/__l5e/assets-v1/abc/example-1.webp?w=1200&h=1200&fit=contain&format=jpg&quality=82');
  assert(!/resize=cover|fit=cover/.test(stored.whole(82) + example.whole(82)), 'no crop');
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
    image: { url: cardUrl(SUPABASE, 'f-id', cardName(version('p'), { width: 812, height: 508 })), width: 812, height: 508, type: 'image/jpeg', alt: 'B' },
  });
  assertStringIncludes(page, '<meta property="og:url" content="https://share.coupondonation.com/f/help-x">');
  assertStringIncludes(page, '<meta property="og:title" content="Donate to &quot;B&quot; &lt;now&gt;, organized by A">');
  assertStringIncludes(page, '<meta property="og:image:width" content="812">');
  assertStringIncludes(page, '<meta property="og:image:height" content="508">');
  assertStringIncludes(page, `<meta name="twitter:image" content="${SUPABASE}/storage/v1/object/public/fundraiser-covers/share-cards/f-id/`);
  assertStringIncludes(page, '<meta property="og:image:type" content="image/jpeg">');
  assertStringIncludes(page, '<meta name="twitter:card" content="summary_large_image">');
  assertStringIncludes(page, 'location.replace("https://coupondonation.com/f/help-x")');
  assertStringIncludes(page, 'noindex');
  assert(!/http-equiv="refresh"/i.test(page));
  assert(!page.includes('<now>'));
  assertEquals(FALLBACK_IMAGE.url, 'https://coupondonation.com/og-image.png?v=4');
});

Deno.test('a new main photo gets a new image link', () => {
  assert(version('a.webp') !== version('b.webp'));
  assertEquals(version('a.webp'), version('a.webp'));
});
