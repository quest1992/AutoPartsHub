import { NumberNormalizationService } from './number-normalization.service';

describe('NumberNormalizationService', () => {
  const service = new NumberNormalizationService();

  it.each([
    '90915-YZZE1',
    '90915 YZZE1',
    '90915.YZZE1',
    '90915_YZZE1',
    '90915yzze1',
  ])('normalizes %s to one canonical number', (value) => {
    expect(service.normalize(value)).toBe('90915YZZE1');
  });
});
