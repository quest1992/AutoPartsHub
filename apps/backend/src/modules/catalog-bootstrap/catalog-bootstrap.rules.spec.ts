import { PartPosition, PartSide } from '@prisma/client';
import {
  isUnsafeAutoCreateCategory,
  suggestCatalogItem,
} from './catalog-bootstrap.rules';

describe('catalog bootstrap suggestions', () => {
  it.each([
    [
      'Радиаторы охлаждения',
      'Радиатор охлаждения',
      PartSide.NONE,
      PartPosition.NONE,
    ],
    [
      'Передние тормозные колодки',
      'Тормозные колодки',
      PartSide.NONE,
      PartPosition.FRONT,
    ],
    [
      'Задние тормозные колодки',
      'Тормозные колодки',
      PartSide.NONE,
      PartPosition.REAR,
    ],
    [
      'Передние ступичные подшипники',
      'Ступичный подшипник',
      PartSide.NONE,
      PartPosition.FRONT,
    ],
    ['Передние фары', 'Фара', PartSide.NONE, PartPosition.FRONT],
    ['Задние правые фонари', 'Фонарь', PartSide.RIGHT, PartPosition.REAR],
    ['Левое крыло', 'Крыло', PartSide.LEFT, PartPosition.NONE],
  ])(
    'converts %s to canonical fields',
    (categoryName, suggestedName, suggestedSide, suggestedPosition) => {
      expect(suggestCatalogItem(categoryName)).toEqual(
        expect.objectContaining({
          suggestedName,
          suggestedSide,
          suggestedPosition,
        }),
      );
    },
  );

  it('warns about likely non-part sections', () => {
    expect(
      suggestCatalogItem('Комплектующие зарядных станций').warning,
    ).toContain('может быть разделом');
  });

  it.each([
    'В список входят категории, а не товары',
    'Комплектующие зарядных станций',
    'Оборудование для ремонта',
    'Прочее',
    'Расходные материалы',
  ])('rejects unsafe automatic category %s', (name) => {
    expect(isUnsafeAutoCreateCategory(name)).toBe(true);
  });

  it('marks only known canonical rules as safe for automatic creation', () => {
    expect(suggestCatalogItem('Передние фары').canonicalMatched).toBe(true);
    expect(suggestCatalogItem('Неизвестные детали').canonicalMatched).toBe(
      false,
    );
  });
});
