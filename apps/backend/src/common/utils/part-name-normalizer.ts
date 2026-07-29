const abbreviationMap: Record<string, string> = {
  перед: 'передний',
  зад: 'задний',
  лев: 'левый',
  прав: 'правый',
  компл: 'комплект',
};

export function normalizePartName(input: string): string {
  const cleaned = input
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('ru-RU')
    .replace(/ё/g, 'е')
    .replace(/[‐‑‒–—―−-]+/g, ' ')
    .replace(/[.,;:!?()[\]{}'"«»„“”]+/g, ' ')
    .replace(/[\\/|_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';

  return cleaned
    .split(' ')
    .map((token) => abbreviationMap[token] ?? token)
    .join(' ');
}

export function getPartNameTokens(input: string): string[] {
  return [...new Set(normalizePartName(input).split(' ').filter(Boolean))].sort(
    (left, right) => left.localeCompare(right, 'ru'),
  );
}

export function getPartNameSearchTokens(input: string): string {
  return getPartNameTokens(input).join(' ');
}

const russianSearchEndings = [
  'иями',
  'ями',
  'ами',
  'ого',
  'ему',
  'ыми',
  'ими',
  'ах',
  'ях',
  'ов',
  'ев',
  'ам',
  'ям',
  'ы',
  'и',
  'а',
  'я',
  'ь',
] as const;

/**
 * Возвращает исходное слово и простую поисковую основу.
 * Это не полноценный морфологический анализатор, а безопасная нормализация
 * распространённых русских окончаний для поиска в PostgreSQL через contains.
 */
export function getPartNameTokenSearchVariants(token: string): string[] {
  const normalized = normalizePartName(token);
  if (!normalized || normalized.includes(' '))
    return normalized ? [normalized] : [];

  const ending = russianSearchEndings.find(
    (candidate) =>
      normalized.endsWith(candidate) &&
      normalized.length - candidate.length >= 3,
  );
  if (!ending) return [normalized];

  const stem = normalized.slice(0, -ending.length);
  return stem === normalized ? [normalized] : [normalized, stem];
}
