import {
  PartCategoryClassification,
  PartTaxonomyRiskLevel,
} from '@prisma/client';
import { recommendCategory } from './part-taxonomy-recommendation';

const facts = (overrides = {}) => ({
  name: 'Ступичные подшипники',
  level: 2,
  childrenCount: 0,
  directItemsCount: 0,
  duplicateCount: 0,
  mappingCount: 0,
  dependencyCount: 0,
  ...overrides,
});

describe('Taxonomy recommendation', () => {
  it('keeps a leaf recommendation advisory', () => {
    const result = recommendCategory(facts());
    expect(result.recommendation).toBe(PartCategoryClassification.CATALOG_ITEM);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
  it('recommends nodes with children as CATEGORY', () =>
    expect(recommendCategory(facts({ childrenCount: 2 })).recommendation).toBe(
      PartCategoryClassification.CATEGORY,
    ));
  it('recommends service text as INVALID', () =>
    expect(recommendCategory(facts({ name: 'Прочее' })).recommendation).toBe(
      PartCategoryClassification.INVALID,
    ));
  it('raises risk for duplicate names', () =>
    expect(recommendCategory(facts({ duplicateCount: 2 })).riskLevel).toBe(
      PartTaxonomyRiskLevel.MEDIUM,
    ));
  it('requires review when items already exist', () =>
    expect(
      recommendCategory(facts({ directItemsCount: 1 })).recommendation,
    ).toBe(PartCategoryClassification.REVIEW));
});
