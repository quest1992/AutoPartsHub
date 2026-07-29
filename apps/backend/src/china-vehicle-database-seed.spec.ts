import {
  assertChinaDataset,
  buildChinaVehicleDataset,
  chinaSlugify,
} from '../prisma/china-vehicle-database.seed';

describe('China vehicle database seed', () => {
  const dataset = buildChinaVehicleDataset();

  it('creates stable ASCII slugs', () => {
    expect(chinaSlugify('Lynk & Co 09')).toBe('lynk-and-co-09');
  });

  it('includes the required China brands after canonical deduplication', () => {
    const slugs = new Set(dataset.manufacturers.map((item) => item.slug));
    for (const slug of [
      'faw',
      'saic',
      'dongfeng',
      'changan',
      'baic',
      'gac',
      'jac',
      'chery',
      'great-wall',
      'geely',
      'nio',
      'xpeng',
      'li-auto',
      'leapmotor',
      'zeekr',
      'xiaomi-auto',
      'avatr',
      'aito',
      'voyah',
      'im-motors',
      'deepal',
      'onvo',
      'yangwang',
      'fangchengbao',
      'denza',
      'luxeed',
      'stelato',
      'firefly',
      'arcfox',
      'rising-auto',
      'icar',
      'jetour',
      'exeed',
      'omoda',
      'jaecoo',
    ]) {
      expect(slugs.has(slug)).toBe(true);
    }
  });

  it('contains no duplicate slugs, broken links, or invented generations', () => {
    expect(() => assertChinaDataset(dataset)).not.toThrow();
    expect(
      dataset.generations.every(
        (item) =>
          item.kind === 'MODEL_YEAR' &&
          item.startYear === item.endYear &&
          item.code === `MY${item.startYear}`,
      ),
    ).toBe(true);
  });

  it('uses verifiable source references on every record', () => {
    expect(
      dataset.manufacturers.every((item) => item.sourceRefs.length > 0),
    ).toBe(true);
    expect(dataset.models.every((item) => item.sourceRefs.length > 0)).toBe(
      true,
    );
    expect(
      dataset.generations.every((item) => item.sourceRefs.length > 0),
    ).toBe(true);
  });
});
