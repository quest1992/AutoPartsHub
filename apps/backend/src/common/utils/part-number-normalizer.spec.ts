import { normalizePartNumber } from './part-number-normalizer';

describe('part number normalizer', () => {
  it.each([
    ['  04465-0K240  ', '044650K240'],
    ['04465 0K240', '044650K240'],
    ['04465_0k240', '044650K240'],
    ['abc/123.45', 'ABC12345'],
    ['---', ''],
  ])('normalizes %p', (input, expected) => {
    expect(normalizePartNumber(input)).toBe(expected);
  });
});
