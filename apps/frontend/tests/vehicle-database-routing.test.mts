import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('vehicle database pages inherit the admin layout and expose registry navigation', () => {
  const adminLayout = read('app/admin/layout.tsx');
  const indexPage = read('app/admin/vehicles/page.tsx');
  const navigation = read('components/protected-layout.tsx');

  assert.match(adminLayout, /ProtectedLayout/);
  assert.match(indexPage, /body-types/);
  assert.match(indexPage, /market-regions/);
  assert.match(navigation, /\/admin\/vehicles/);
});

test('registry page protects controls and renders loading, empty and API error states', () => {
  const page = read('app/admin/vehicles/[resource]/page.tsx');

  assert.match(page, /hasRole\('SUPER_ADMIN'\).*hasPermission\('CATALOG_MANAGE'\)/);
  assert.match(page, /\{canEdit&&<form/);
  assert.match(page, /Записи не найдены/);
  assert.match(page, /Не удалось загрузить данные/);
  assert.match(page, /setTimeout\(\(\)=>setDebouncedSearch\(search\.trim\(\)\),350\)/);
});
