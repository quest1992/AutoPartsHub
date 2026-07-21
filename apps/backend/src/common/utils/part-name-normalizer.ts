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
