/** Detects image type and any embedded metadata (EXIF / XMP / GPS / text chunks). No external libs. */
export type MetaCheck = { type: 'jpeg' | 'png' | 'webp' | null; metadata: string[] };

const ascii = (b: Uint8Array, o: number, n: number) => String.fromCharCode(...b.subarray(o, o + n));

export function inspectImage(b: Uint8Array): MetaCheck {
  const found: string[] = [];
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 4 <= b.length) {
      if (b[i] !== 0xff) break;
      const m = b[i + 1];
      if (m === 0xda || m === 0xd9) break; // start of scan / end
      const len = (b[i + 2] << 8) | b[i + 3];
      if (m === 0xe1) {
        const head = ascii(b, i + 4, 30);
        found.push(head.startsWith('Exif') ? 'EXIF' : head.includes('ns.adobe.com/xap') ? 'XMP' : 'APP1');
      }
      if (m === 0xed) found.push('IPTC');
      i += 2 + len;
    }
    if (ascii(b, 0, Math.min(b.length, 65536)).includes('GPS')) found.push('GPS-string');
    return { type: 'jpeg', metadata: found };
  }
  if (b.length > 8 && b[0] === 0x89 && ascii(b, 1, 3) === 'PNG') {
    let i = 8;
    while (i + 8 <= b.length) {
      const len = ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
      const t = ascii(b, i + 4, 4);
      if (['eXIf', 'tEXt', 'iTXt', 'zTXt'].includes(t)) found.push(t);
      if (t === 'IEND') break;
      i += 12 + len;
    }
    return { type: 'png', metadata: found };
  }
  if (b.length > 12 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP') {
    let i = 12;
    while (i + 8 <= b.length) {
      const t = ascii(b, i, 4);
      const len = (b[i + 4] | (b[i + 5] << 8) | (b[i + 6] << 16) | (b[i + 7] << 24)) >>> 0;
      if (t === 'EXIF' || t === 'XMP ') found.push(t.trim());
      i += 8 + len + (len % 2);
    }
    return { type: 'webp', metadata: found };
  }
  return { type: null, metadata: [] };
}
