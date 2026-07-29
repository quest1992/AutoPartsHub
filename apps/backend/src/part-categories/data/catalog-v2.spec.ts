import {
  catalogV2,
  catalogV2ForbiddenPositionWords,
  flattenCatalogV2,
  getCatalogV2Stats,
  validateCatalogV2,
} from './catalog-v2';

describe('Catalog v2', () => {
  it('contains the required 18 roots in the specified order', () => {
    expect(catalogV2.map((item) => item.name)).toEqual([
      'Двигатель',
      'Электрооборудование',
      'Электромобили и гибриды',
      'Трансмиссия',
      'Подвеска',
      'Тормозная система',
      'Рулевое управление',
      'Климатическая система',
      'Топливная система',
      'Впуск и выпуск',
      'Освещение',
      'Кузов',
      'Стёкла',
      'Салон',
      'Стеклоочистители',
      'Колёса',
      'Крепёж и расходные материалы',
      'Технические жидкости',
    ]);
  });

  it('has valid unique slugs, descriptions and no more than three levels', () => {
    expect(validateCatalogV2()).toEqual([]);
    expect(getCatalogV2Stats()).toMatchObject({ roots: 18, maxDepth: 3 });
  });

  it('does not use position words as category name tokens', () => {
    const forbiddenStems = catalogV2ForbiddenPositionWords.map((word) =>
      word.replace(/(?:ий|ый)$/u, ''),
    );
    for (const row of flattenCatalogV2()) {
      const words = row.name.toLocaleLowerCase('ru-RU').split(/\W+/u);
      expect(
        forbiddenStems.some((stem) =>
          words.some((word) => word.startsWith(stem)),
        ),
      ).toBe(false);
    }
  });

  it('contains the required EV and hybrid part types', () => {
    const names = new Set(
      flattenCatalogV2()
        .filter((row) => row.key.startsWith('catalog-v2-ev-hybrid/'))
        .map((row) => row.name),
    );
    [
      'Контроллер BMS',
      'Инвертор тягового привода',
      'Бортовое зарядное устройство OBC',
      'Преобразователь DC/DC',
      'Контактор высоковольтной батареи',
      'Высоковольтная батарея',
      'Модуль высоковольтной батареи',
      'Зарядный порт',
      'Высоковольтный кабель',
      'Тяговый электродвигатель',
      'Редуктор электропривода',
    ].forEach((name) => expect(names.has(name)).toBe(true));
  });
});
