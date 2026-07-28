export function formatMoney(
  value: string | number,
  currency = 'TJS',
): string {
  const amount = Number(value);
  const formatted = new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
  return `${formatted} ${currency || 'TJS'}`;
}

export function formatPerson(
  user?: { firstName?: string | null; lastName?: string | null } | null,
): string {
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || '—';
}
