import {
  assertDataset,
  buildVehicleSeedDataset,
  slugify,
} from '../prisma/vehicle-database.seed';

describe('world vehicle database seed', () => {
  const dataset = buildVehicleSeedDataset();

  it('normalizes stable ASCII slugs', () => {
    expect(slugify('Škoda Auto')).toBe('skoda-auto');
  });

  it('meets the requested coverage thresholds', () => {
    expect(dataset.manufacturers.length).toBeGreaterThanOrEqual(120);
    expect(dataset.models.length).toBeGreaterThanOrEqual(10_000);
    expect(dataset.generations.length).toBeGreaterThanOrEqual(25_000);
  });

  it('contains no duplicate slugs or broken parent references', () => {
    expect(() => assertDataset(dataset)).not.toThrow();
  });

  it('keeps model-year records explicit', () => {
    expect(
      dataset.generations.every(
        (item) =>
          item.name.endsWith(' model year') &&
          item.code === `MY${item.startYear}` &&
          item.startYear === item.endYear,
      ),
    ).toBe(true);
  });
});
