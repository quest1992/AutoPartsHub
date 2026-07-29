import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

function source(relativePath: string): string {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');
}

test('admin routes inherit the shared protected layout', () => {
  const layout = source('app/admin/layout.tsx');

  assert.match(layout, /ProtectedLayout/);
  assert.match(layout, /<ProtectedLayout>\{children\}<\/ProtectedLayout>/);
});

test('shop catalog suggestions preserve their URL and inherit the shared layout', () => {
  const layout = source('app/catalog-suggestions/layout.tsx');
  const page = source('app/catalog-suggestions/page.tsx');

  assert.match(layout, /ProtectedLayout/);
  assert.doesNotMatch(page, /ProtectedLayout/);
});

test('admin catalog suggestions do not duplicate the layout inside pages', () => {
  const listPage = source('app/admin/catalog-suggestions/page.tsx');
  const detailPage = source('app/admin/catalog-suggestions/[id]/page.tsx');

  assert.doesNotMatch(listPage, /ProtectedLayout/);
  assert.doesNotMatch(detailPage, /ProtectedLayout/);
});
