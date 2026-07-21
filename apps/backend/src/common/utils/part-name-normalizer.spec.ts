import {
  getPartNameSearchTokens,
  getPartNameTokens,
  normalizePartName,
} from './part-name-normalizer';

describe('part name normalizer', () => {
  it.each([
    [' trims and lower-cases ', 'trims and lower cases'],
    ['Колодки   тормозные', 'колодки тормозные'],
    ['Фара Ёлочная', 'фара елочная'],
    ['Колодки-тормозные — передние', 'колодки тормозные передние'],
    ['Фильтр (масляный), "компл."', 'фильтр масляный комплект'],
    ['перед. зад. лев. прав.', 'передний задний левый правый'],
    ['   ', ''],
    ['Тормозные колодки', 'тормозные колодки'],
  ])('normalizes %p', (input, expected) => {
    expect(normalizePartName(input)).toBe(expected);
  });

  it('sorts and de-duplicates search tokens', () => {
    expect(getPartNameTokens('Тормозные колодки передние колодки')).toEqual([
      'колодки',
      'передние',
      'тормозные',
    ]);
    expect(getPartNameSearchTokens('передние колодки тормозные')).toBe(
      'колодки передние тормозные',
    );
  });
});
