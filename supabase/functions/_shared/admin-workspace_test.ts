import { assertEquals } from 'jsr:@std/assert@1';
import { fetchRpcPages, safeViewParams } from '../../../src/lib/adminWorkspace.ts';

Deno.test('donor exports include all 451 matching records rather than the first 200', async () => {
  const source = Array.from({ length: 451 }, (_, id) => ({ id }));
  const result = await fetchRpcPages((offset, limit) => Promise.resolve(source.slice(offset, offset + limit)));
  assertEquals(result.length, 451);
  assertEquals(result[450].id, 450);
});
Deno.test('saved views exclude donor search and record identifiers', () => {
  const result = new URLSearchParams(safeViewParams(new URLSearchParams('q=private@example.com&id=secret&record=secret&status=active&sort=title')));
  assertEquals(result.has('q'), false);
  assertEquals(result.has('id'), false);
  assertEquals(result.has('record'), false);
  assertEquals(result.get('status'), 'active');
  assertEquals(result.get('sort'), 'title');
});