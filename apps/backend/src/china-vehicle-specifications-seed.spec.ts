import {
  assertSpecifications,
  buildChinaVehicleSpecifications,
} from '../prisma/china-vehicle-specifications.seed';

describe('China factory specification seed', () => {
  const specifications = buildChinaVehicleSpecifications();

  it('imports the pinned OpenEV China specification set', () => {
    expect(specifications).toHaveLength(382);
    expect(new Set(specifications.map((item) => item.makeSlug)).size).toBe(21);
    expect(
      new Set(
        specifications.map(
          (item) => `${item.makeSlug}/${item.modelSlug}`,
        ),
      ).size,
    ).toBe(95);
  });

  it('requires a valid source URL and license for every specification', () => {
    expect(
      specifications.every(
        (item) =>
          /^https?:\/\//.test(item.sourceUrl) &&
          item.sourceLicense === 'CDLA-Permissive-2.0' &&
          item.sources.length > 0,
      ),
    ).toBe(true);
  });

  it('does not convert or invent range standards', () => {
    for (const item of specifications) {
      const cycles = new Set(
        item.ranges.map((range) => range.cycle?.toLowerCase()),
      );
      if (item.rangeCltcKm !== null) expect(cycles.has('cltc')).toBe(true);
      if (item.rangeWltpKm !== null) expect(cycles.has('wltp')).toBe(true);
      if (item.rangeEpaKm !== null) expect(cycles.has('epa')).toBe(true);
      if (item.rangeNedcKm !== null) expect(cycles.has('nedc')).toBe(true);
    }
  });

  it('contains no duplicate or invalid specifications', () => {
    expect(() => assertSpecifications(specifications)).not.toThrow();
  });
});
