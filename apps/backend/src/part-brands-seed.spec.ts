import {
  brandSlug,
  buildCuratedDataset,
  buildDataset,
  mapVpicManufacturer,
  normalizeName,
  validateDataset,
} from '../prisma/part-brands.seed';

describe('world parts brands seed', () => {
  const source = {
    Country: 'GERMANY',
    Mfr_CommonName: 'Example Parts',
    Mfr_ID: 42,
    Mfr_Name: 'EXAMPLE PARTS GMBH',
    VehicleTypes: [],
  };

  it('normalizes names and produces deterministic slugs', () => {
    expect(normalizeName('  ZF Friedrichshafen AG ')).toBe(
      'zf friedrichshafen ag',
    );
    expect(brandSlug('Brembo S.p.A.')).toBe('brembo-s-p-a');
  });

  it('keeps official and common names without inventing metadata', () => {
    const item = mapVpicManufacturer(source, new Date('2026-07-29'));
    expect(item.officialName).toBe('EXAMPLE PARTS GMBH');
    expect(item.englishName).toBe('Example Parts');
    expect(item.aliases[0].name).toBe('EXAMPLE PARTS GMBH');
    expect(item.foundedYear).toBeNull();
    expect(item.officialWebsite).toBeNull();
  });

  it('deduplicates normalized names and validates provenance', () => {
    const dataset = buildDataset([source, { ...source, Mfr_ID: 43 }]);
    expect(
      dataset.filter((item) => item.normalizedName === 'example parts'),
    ).toHaveLength(1);
    expect(() => validateDataset(dataset)).not.toThrow();
  });

  it('builds the small curated seller-facing brand list', () => {
    const dataset = buildCuratedDataset(new Date('2026-08-08'));
    expect(dataset).toHaveLength(23);
    expect(dataset.map((item) => item.officialName)).toEqual(
      expect.arrayContaining([
        'Toyota Genuine Parts',
        'BYD Genuine Parts',
        'Geely Genuine Parts',
        'Bosch',
        'Denso',
        'NGK',
        'Brembo',
        'SKF',
        'MAHLE',
        'Valeo',
        'ZF',
        'Aisin',
      ]),
    );
    expect(() => validateDataset(dataset)).not.toThrow();
  });
});
