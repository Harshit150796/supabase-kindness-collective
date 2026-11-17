// Fundraiser pages open fast (index.html data-fundraiser-fast-start, src/lib/fundraiserPageQuery.ts): the shell
// asks for the fundraiser and preloads the exact photo addresses the gallery will request, so nothing loads twice.
import { assert, assertEquals, assertStringIncludes } from 'jsr:@std/assert@1';
import { photoUrl } from '../../../src/lib/responsivePhotos.ts';
import { FUNDRAISER_PAGE_SELECT } from '../../../src/lib/fundraiserPageQuery.ts';

const read = (p: string) => Deno.readTextFileSync(new URL(`../../../${p}`, import.meta.url));
const html = read('index.html');
const script = html.slice(html.indexOf('<script data-fundraiser-fast-start>'), html.indexOf('</script>', html.indexOf('<script data-fundraiser-fast-start>')));
const fn = (name: string) => {
  const m = new RegExp(`var ${name}=(function\\([^)]*\\)\\{[\\s\\S]*?\\});\\n`).exec(script);
  assert(m, name);
  return m[1];
};

Deno.test('the fast start only runs on fundraiser pages, before the app, and fails quietly', () => {
  assert(script.length > 0 && html.indexOf('<script data-fundraiser-fast-start>') < html.indexOf('src="/src/main.tsx"'));
  assertStringIncludes(script, 'var m=/^\\/f\\/([A-Za-z0-9-]{1,120})\\/?$/.exec(location.pathname);if(!m)return;');
  assertStringIncludes(script, '}catch(e){}})();');
  for (const placeholder of ['__CD_FUNDRAISER_CHUNKS__', '__CD_SUPABASE__', '__CD_FUNDRAISER_SELECT__']) assertStringIncludes(script, `"${placeholder}"`);
  // In development the placeholders stay strings and nothing is fetched.
  assertStringIncludes(script, 'if(!cfg||typeof cfg!=="object"||select.indexOf("fundraiser_images")<0)return;');
  const vite = read('vite.config.ts');
  for (const placeholder of ['__CD_FUNDRAISER_CHUNKS__', '__CD_SUPABASE__', '__CD_FUNDRAISER_SELECT__']) assertStringIncludes(vite, `'"${placeholder}"'`);
  assertStringIncludes(vite, 'urls("/src/pages/PublicFundraiser.tsx")');
});

Deno.test('the page and the fast start ask the same question, photos included', () => {
  assert(FUNDRAISER_PAGE_SELECT.includes('fundraiser_images(id,image_url,display_order,is_primary)'));
  const page = read('src/pages/PublicFundraiser.tsx');
  assertStringIncludes(page, 'takeEarlyFundraiser(slug)');
  assertStringIncludes(page, '.select(FUNDRAISER_PAGE_SELECT)');
  assert(!page.includes('fetchImages(data.id)'), 'photos come with the fundraiser, not after it');
});

Deno.test('preloaded photo addresses are exactly the ones the gallery requests', () => {
  const photo = new Function(`return ${fn('photo').replace('stored(u)', '(u.indexOf("/storage/v1/object/public/")>=0||u.indexOf("/storage/v1/render/image/public/")>=0)')}`)() as (u: string, w: number) => string;
  const cover = new Function(`return ${fn('cover')}`)() as (u: string, w: number) => string;
  const stored = 'https://vbnbacowuoeeojjdrzzp.supabase.co/storage/v1/object/public/fundraiser-covers/fb98/1794953680506-t5dnb8.webp';
  for (const w of [400, 800, 1200]) assertEquals(photo(stored, w), photoUrl(stored, w));
  assertEquals(photo('/__l5e/assets-v1/abc/example-1.webp', 800), photoUrl('/__l5e/assets-v1/abc/example-1.webp', 800));
  // transformedFundraiserImage (src/lib/fundraiserImages.tsx), the old single-cover layout.
  assertEquals(cover(stored, 768), 'https://vbnbacowuoeeojjdrzzp.supabase.co/storage/v1/render/image/public/fundraiser-covers/fb98/1794953680506-t5dnb8.webp?width=768&quality=76&resize=contain');
  const images = read('src/lib/fundraiserImages.tsx');
  assertStringIncludes(images, 'return `${rendered}?width=${width}&quality=${quality}&resize=contain`;');
  const gallery = read('src/components/fundraiser/FundraiserGallery.tsx');
  assertStringIncludes(gallery, 'sizes="(max-width: 1023px) calc(100vw - 2rem), 760px"');
  assertStringIncludes(script, 'sizes="(max-width: 1023px) calc(100vw - 2rem), 760px"');
  assertStringIncludes(read('src/components/ResponsivePhoto.tsx'), '<source media="(max-width: 767px)" srcSet={`${photoUrl(src, 400)} 400w, ${photoUrl(src, 800)} 800w`}');
});
