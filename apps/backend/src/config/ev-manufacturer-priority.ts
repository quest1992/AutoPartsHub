export const EV_MANUFACTURER_PRIORITY: readonly (readonly string[])[] = [
  ['BYD'],
  ['GAC'],
  ['Dongfeng'],
  ['Leapmotor'],
  ['Neta'],
  ['Changan'],
  ['Zeekr'],
  ['Weltmeister'],
  ['Toyota'],
  ['Hongqi'],
  ['Avatr'],
  ['Geely'],
  ['Tesla'],
  ['XPeng', 'XPENG'],
  ['Wuling'],
  ['BMW'],
  ['Volkswagen', 'Volkswagen AG', 'VW'],
  ['Xiaomi'],
  ['Li Auto', 'LiXiang', 'Li Xiang'],
  ['Chery'],
  ['Buick'],
  ['Nissan'],
  ['Arcfox'],
  ['Beijing'],
  ['Aiways'],
  ['Audi'],
  ['FAW'],
  ['Honda'],
  ['JAC'],
  ['Mercedes-Benz', 'Mercedes Benz'],
  ['Skyworth'],
  ['Voyah'],
  ['Hyundai'],
  ['Kia'],
  ['Leopaard'],
  ['Mazda'],
  ['Huawei'],
  ['Rising Auto'],
  ['Roewe'],
  ['BAIC', 'BAIC Group'],
  ['Bestune'],
  ['Changhe'],
  ['Chevrolet'],
  ['Foton'],
  ['Ford'],
  ['HiPhi'],
  ['Lexus'],
  ['Marvel'],
  ['Radar'],
  ['Rolls-Royce'],
] as const;

const CORPORATE_SUFFIXES = new Set([
  'ag',
  'group',
  'motor',
  'motors',
  'automobile',
  'automobiles',
  'company',
  'co',
  'ltd',
  'limited',
  'inc',
  'corp',
  'corporation',
]);

export function normalizeManufacturerName(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((token) => token && !CORPORATE_SUFFIXES.has(token))
    .join('');
}

export const EV_MANUFACTURER_PRIORITY_RANK = new Map(
  EV_MANUFACTURER_PRIORITY.flatMap((names, index) =>
    names.map((name) => [normalizeManufacturerName(name), index] as const),
  ),
);
export function getEvManufacturerPriorityRank(
  ...names: Array<string | null | undefined>
) {
  const ranks = names
    .filter((name): name is string => Boolean(name))
    .map((name) =>
      EV_MANUFACTURER_PRIORITY_RANK.get(normalizeManufacturerName(name)),
    )
    .filter((rank): rank is number => rank !== undefined);

  return ranks.length ? Math.min(...ranks) : null;
}

export function matchesManufacturerSearch(
  names: Array<string | null | undefined>,
  search: string,
) {
  const normalizedSearch = normalizeManufacturerName(search);
  if (!normalizedSearch) return true;

  const priorityRank = getEvManufacturerPriorityRank(...names);
  const aliasPriorityRank = EV_MANUFACTURER_PRIORITY_RANK.get(normalizedSearch);

  if (
    priorityRank !== null &&
    aliasPriorityRank !== undefined &&
    priorityRank === aliasPriorityRank
  ) {
    return true;
  }

  return names.some((name) => {
    if (!name) return false;
    const normalizedName = normalizeManufacturerName(name);
    return (
      normalizedName.includes(normalizedSearch) ||
      normalizedSearch.includes(normalizedName)
    );
  });
}
