import { normalizePhone } from './phone-normalizer';
describe('normalizePhone', () => {
  it('removes spaces, brackets and hyphens', () =>
    expect(normalizePhone('+992 (900) 12-34-56')).toBe('+992900123456'));
  it('preserves a leading plus only', () =>
    expect(normalizePhone('992-900+12')).toBe('99290012'));
  it('returns null for empty input', () =>
    expect(normalizePhone('  ')).toBeNull());
  it('makes equivalent phone forms equal', () =>
    expect(normalizePhone('+992 900-123-456')).toBe(
      normalizePhone('+992(900)123456'),
    ));
});
