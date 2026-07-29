import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('taxonomy studio uses the shared admin layout and server pagination', async () => {
  const [listPage, layout] = await Promise.all([
    readFile(new URL('../app/admin/taxonomy-studio/page.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../components/protected-layout.tsx', import.meta.url), 'utf8'),
  ]);
  assert.match(layout, /\/admin\/taxonomy-studio/);
  assert.match(listPage, /getTaxonomyCategories/);
  assert.match(listPage, /limit:25/);
});

test('apply requires a custom confirmation dialog', async () => {
  const detailPage = await readFile(
    new URL('../app/admin/taxonomy-studio/[categoryId]/page.tsx', import.meta.url),
    'utf8',
  );
  assert.match(detailPage, /role="dialog"/);
  assert.doesNotMatch(detailPage, /window\.confirm/);
  assert.match(detailPage, /taxonomyDecisionAction/);
});
