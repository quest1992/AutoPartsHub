import {
  PartCategoryClassification,
  PartTaxonomyRiskLevel,
} from '@prisma/client';
import { normalizePartName } from '../../common/utils/part-name-normalizer';

export type RecommendationFacts = {
  name: string;
  level: number;
  childrenCount: number;
  directItemsCount: number;
  duplicateCount: number;
  mappingCount: number;
  dependencyCount: number;
};

const serviceText =
  /^(прочее|другое|разное|нет|тест|test|n\/a|неизвестно|--+)$/i;
const broadNames = new Set([
  'двигатель',
  'кузов',
  'подвеска',
  'электрика',
  'салон',
  'тормоза',
  'трансмиссия',
]);

export function recommendCategory(facts: RecommendationFacts) {
  const normalized = normalizePartName(facts.name);
  const reasons: string[] = [];
  const warnings: string[] = [];
  let recommendation: PartCategoryClassification =
    PartCategoryClassification.REVIEW;
  let confidence = 0.55;

  if (!normalized || serviceText.test(normalized)) {
    recommendation = PartCategoryClassification.INVALID;
    confidence = 0.96;
    reasons.push('Название похоже на служебный или тестовый текст');
  } else if (facts.childrenCount > 0) {
    recommendation = PartCategoryClassification.CATEGORY;
    confidence = 0.9;
    reasons.push(`Категория содержит дочерние узлы: ${facts.childrenCount}`);
  } else if (facts.directItemsCount > 0) {
    recommendation = PartCategoryClassification.REVIEW;
    confidence = 0.92;
    reasons.push('В категории уже есть позиции каталога');
    warnings.push('Нужно отдельно решить судьбу существующих позиций');
  } else if (broadNames.has(normalized)) {
    recommendation = PartCategoryClassification.CATEGORY;
    confidence = 0.8;
    reasons.push('Название уже используется как общая структурная роль');
  } else {
    recommendation = PartCategoryClassification.CATALOG_ITEM;
    confidence = 0.72;
    reasons.push(
      'Листовой узел без прямых позиций похож на продаваемый тип детали',
    );
    warnings.push(
      'Листовой узел не классифицируется автоматически — требуется решение администратора',
    );
  }

  if (facts.duplicateCount > 0)
    warnings.push(
      `Нормализованное название встречается ещё в ${facts.duplicateCount} ветках`,
    );
  if (facts.mappingCount > 0)
    reasons.push('Для категории уже существует taxonomy mapping');
  if (facts.dependencyCount > 0)
    warnings.push(`Обнаружены прямые зависимости: ${facts.dependencyCount}`);

  const riskLevel =
    facts.directItemsCount > 0 && facts.duplicateCount > 0
      ? PartTaxonomyRiskLevel.CRITICAL
      : facts.directItemsCount > 0 || facts.dependencyCount > 0
        ? PartTaxonomyRiskLevel.HIGH
        : facts.duplicateCount > 0
          ? PartTaxonomyRiskLevel.MEDIUM
          : PartTaxonomyRiskLevel.LOW;

  return { recommendation, confidence, reasons, warnings, riskLevel };
}
