import { PartPosition, PartSide } from '@prisma/client';
import { normalizePartName } from '../../common/utils/part-name-normalizer';

const canonicalNames: Record<string, string> = {
  'радиаторы охлаждения': 'Радиатор охлаждения',
  'тормозные колодки': 'Тормозные колодки',
  'ступичные подшипники': 'Ступичный подшипник',
  амортизаторы: 'Амортизатор',
  фары: 'Фара',
  фонари: 'Фонарь',
  бамперы: 'Бампер',
  крылья: 'Крыло',
  капоты: 'Капот',
  двери: 'Дверь',
  стекла: 'Стекло',
  генераторы: 'Генератор',
  генератор: 'Генератор',
  стартеры: 'Стартер',
  стартер: 'Стартер',
  'рулевые рейки': 'Рулевая рейка',
  шрусы: 'ШРУС',
  ступицы: 'Ступица',
  'шаровые опоры': 'Шаровая опора',
  сайлентблоки: 'Сайлентблок',
  'рычаги подвески': 'Рычаг подвески',
  'водяные насосы': 'Помпа',
  термостаты: 'Термостат',
  свечи: 'Свеча',
  'катушки зажигания': 'Катушка зажигания',
  'воздушные фильтры': 'Воздушный фильтр',
  'масляные фильтры': 'Масляный фильтр',
  'салонные фильтры': 'Салонный фильтр',
  'топливные фильтры': 'Топливный фильтр',
  'ремни навесного оборудования': 'Ремень генератора',
  'ремни генератора': 'Ремень генератора',
  'цепи грм': 'Цепь ГРМ',
  'натяжители грм': 'Натяжитель',
  'натяжители ремней': 'Натяжитель',
  'радиаторы кондиционера': 'Радиатор кондиционера',
  'испарители кондиционера': 'Испаритель кондиционера',
  'компрессоры кондиционера': 'Компрессор кондиционера',
};

const positionWords = {
  front: /(^|\s)(передний|передняя|переднее|передние|передних)(?=\s|$)/giu,
  rear: /(^|\s)(задний|задняя|заднее|задние|задних)(?=\s|$)/giu,
};
const sideWords = {
  left: /(^|\s)(левый|левая|левое|левые|левых)(?=\s|$)/giu,
  right: /(^|\s)(правый|правая|правое|правые|правых)(?=\s|$)/giu,
};

export type CatalogBootstrapSuggestion = {
  suggestedName: string;
  suggestedSide: PartSide;
  suggestedPosition: PartPosition;
  warning: string | null;
  canonicalMatched: boolean;
};

const unsafeCategoryWords =
  /список|категори|товар|артикул|бренд|оборудован|инструмент|материал|аксессуар|прочее|разное|комплектующ/iu;

export function isUnsafeAutoCreateCategory(categoryName: string): boolean {
  return unsafeCategoryWords.test(normalizePartName(categoryName));
}

function sentenceCase(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized
    ? normalized.charAt(0).toLocaleUpperCase('ru-RU') + normalized.slice(1)
    : normalized;
}

export function suggestCatalogItem(
  categoryName: string,
): CatalogBootstrapSuggestion {
  const front = positionWords.front.test(categoryName);
  positionWords.front.lastIndex = 0;
  const rear = positionWords.rear.test(categoryName);
  positionWords.rear.lastIndex = 0;
  const left = sideWords.left.test(categoryName);
  sideWords.left.lastIndex = 0;
  const right = sideWords.right.test(categoryName);
  sideWords.right.lastIndex = 0;

  const cleaned = categoryName
    .replace(positionWords.front, ' ')
    .replace(positionWords.rear, ' ')
    .replace(sideWords.left, ' ')
    .replace(sideWords.right, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const normalized = normalizePartName(cleaned);
  const canonicalMatched = Boolean(canonicalNames[normalized]);
  const suggestedName = canonicalNames[normalized] ?? sentenceCase(cleaned);

  const warnings: string[] = [];
  if (front && rear)
    warnings.push('Одновременно указаны передняя и задняя позиции');
  if (left && right)
    warnings.push('Одновременно указаны левая и правая стороны');
  if (isUnsafeAutoCreateCategory(categoryName)) {
    warnings.push('Категория может быть разделом, а не канонической деталью');
  }
  if (!canonicalNames[normalized] && cleaned === categoryName) {
    warnings.push(
      'Название не преобразовано автоматически — проверьте вручную',
    );
  }

  return {
    suggestedName,
    suggestedSide: left
      ? PartSide.LEFT
      : right
        ? PartSide.RIGHT
        : PartSide.NONE,
    suggestedPosition: front
      ? PartPosition.FRONT
      : rear
        ? PartPosition.REAR
        : PartPosition.NONE,
    warning: warnings.length ? warnings.join('. ') : null,
    canonicalMatched,
  };
}
