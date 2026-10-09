import { describe, expect, test } from 'bun:test';
import { photoUrl, responsivePhoto } from './responsivePhotos';
import { transformedFundraiserImage } from './fundraiserImages';

const original = 'https://example.supabase.co/storage/v1/object/public/fundraisers/cover.webp';

describe('proportional fundraiser delivery', () => {
  test('responsive Supabase photos request 400px with contain, not server-side cropping', () => {
    const url = new URL(photoUrl(original, 400));
    expect(url.searchParams.get('width')).toBe('400');
    expect(url.searchParams.get('resize')).toBe('contain');
    expect(url.searchParams.has('height')).toBe(false);
    expect(responsivePhoto(original).srcSet.split(', ').every(candidate => candidate.includes('resize=contain'))).toBe(true);
  });
  test('legacy fundraiser transform preserves proportions too', () => {
    const url = new URL(transformedFundraiserImage(original, 400) ?? '');
    expect(url.searchParams.get('width')).toBe('400');
    expect(url.searchParams.get('resize')).toBe('contain');
    expect(url.searchParams.has('height')).toBe(false);
  });
  test('unknown and local hosts are not given unsupported transforms', () => {
    expect(photoUrl('/photo.webp', 400)).toBe('/photo.webp');
    expect(photoUrl('https://example.com/photo.jpg', 400)).toBe('https://example.com/photo.jpg');
  });
});