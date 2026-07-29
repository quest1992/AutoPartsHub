export function normalizePhone(value?: string | null): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  const prefix = trimmed.startsWith('+') ? '+' : '';
  return `${prefix}${trimmed.replace(/\D/g, '')}`;
}
