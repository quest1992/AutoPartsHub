import assert from 'node:assert/strict';
import test from 'node:test';
import { partNumberManufacturerValue } from '../lib/part-number-manager.ts';

test('legacy PartNumber without manufacturer uses an empty select value', () => {
  assert.equal(partNumberManufacturerValue({ manufacturer: null }), '');
});

test('PartNumber with manufacturer uses its id', () => {
  assert.equal(
    partNumberManufacturerValue({ manufacturer: { id: 'manufacturer-id' } }),
    'manufacturer-id',
  );
});
