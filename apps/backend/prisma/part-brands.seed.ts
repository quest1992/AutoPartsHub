import {
  PartBrandAliasType,
  PartBrandStatus,
  PartBrandType,
  Prisma,
  PrismaClient,
} from '@prisma/client';

const VPIC_API = 'https://vpic.nhtsa.dot.gov/api/vehicles/GetAllManufacturers';
const VPIC_SOURCE = 'NHTSA vPIC';
const VPIC_LICENSE =
  'Publicly reusable US government data; Data.gov license metadata: unknown-license';
const WIKIDATA_SOURCE = 'Wikidata';
const WIKIDATA_LICENSE = 'CC0 1.0';
const PAGE_SIZE = 100;
const BATCH_SIZE = 100;

type VpicManufacturer = {
  Country: string | null;
  Mfr_CommonName: string | null;
  Mfr_ID: number;
  Mfr_Name: string;
  VehicleTypes: Array<{ IsPrimary: boolean; Name: string }>;
};

type VpicResponse = {
  Count: number;
  Message: string;
  Results: VpicManufacturer[];
};

type EquipmentPlant = {
  Address: string;
  City: string;
  Country: string;
  DOTCode: string;
  Name: string;
  OldDOTCode?: string;
  OldDotCode?: string;
  PostalCode: string;
  StateProvince: string;
  Status: string;
};

type EquipmentType = 1 | 3 | 13 | 16;

export type PartBrandSeed = {
  officialName: string;
  englishName: string | null;
  normalizedName: string;
  slug: string;
  countryOfOrigin: string | null;
  city: string | null;
  foundedYear: number | null;
  parentCompany: string | null;
  officialWebsite: string | null;
  status: PartBrandStatus;
  types: PartBrandType[];
  specializations: string[];
  manufacturingCountries: string[];
  logoUrl: string | null;
  sourceExternalId: string;
  sourceUrl: string;
  sourceName: string;
  sourceLicense: string;
  sourceRetrievedAt: Date;
  aliases: Array<{
    name: string;
    normalizedName: string;
    type: PartBrandAliasType;
  }>;
};

type CuratedBrand = {
  name: string;
  wikidataId: string;
  aliases?: string[];
  country: string;
  foundedYear?: number;
  parentCompany?: string;
  website?: string;
  types: PartBrandType[];
  specializations: string[];
};

const CURATED_BRANDS: CuratedBrand[] = [
  {
    name: 'Toyota Genuine Parts',
    wikidataId: 'Q53268',
    aliases: ['Toyota Genuine Parts & Accessories', 'Toyota OEM'],
    country: 'JP',
    foundedYear: 1937,
    website: 'https://www.toyota.com/',
    types: ['OEM'],
    specializations: ['genuine service parts'],
  },
  {
    name: 'BYD Genuine Parts',
    wikidataId: 'Q26070',
    aliases: ['BYD OEM'],
    country: 'CN',
    foundedYear: 1995,
    website: 'https://www.bydglobal.com/',
    types: ['OEM', 'EV'],
    specializations: ['genuine service parts', 'electric vehicles'],
  },
  {
    name: 'Geely Genuine Parts',
    wikidataId: 'Q185091',
    aliases: ['Geely OEM'],
    country: 'CN',
    foundedYear: 1986,
    website: 'https://global.geely.com/',
    types: ['OEM', 'EV'],
    specializations: ['genuine service parts', 'electric vehicles'],
  },
  {
    name: 'Bosch',
    wikidataId: 'Q234021',
    aliases: ['Robert Bosch', 'Robert Bosch GmbH'],
    country: 'DE',
    foundedYear: 1886,
    website: 'https://www.bosch.com/',
    types: ['OEM', 'OES', 'AFTERMARKET', 'PREMIUM'],
    specializations: [
      'electrical',
      'sensors',
      'spark plugs',
      'filters',
      'braking',
    ],
  },
  {
    name: 'SKF',
    wikidataId: 'Q222235',
    aliases: ['AB SKF', 'Svenska Kullagerfabriken'],
    country: 'SE',
    foundedYear: 1907,
    website: 'https://www.skf.com/',
    types: ['OEM', 'OES', 'AFTERMARKET', 'PREMIUM'],
    specializations: ['bearings', 'wheel hubs', 'seals'],
  },
  {
    name: 'Denso',
    wikidataId: 'Q902396',
    aliases: ['DENSO Corporation', 'Nippondenso'],
    country: 'JP',
    foundedYear: 1949,
    website: 'https://www.denso.com/',
    types: ['OEM', 'OES', 'AFTERMARKET', 'EV'],
    specializations: [
      'electrical',
      'thermal systems',
      'fuel systems',
      'sensors',
    ],
  },
  {
    name: 'Valeo',
    wikidataId: 'Q691910',
    aliases: ['Valeo SA'],
    country: 'FR',
    foundedYear: 1923,
    website: 'https://www.valeo.com/',
    types: ['OEM', 'OES', 'AFTERMARKET', 'EV'],
    specializations: ['lighting', 'thermal systems', 'clutch', 'wipers'],
  },
  {
    name: 'ZF',
    wikidataId: 'Q319922',
    aliases: ['ZF Friedrichshafen', 'ZF Friedrichshafen AG'],
    country: 'DE',
    foundedYear: 1915,
    website: 'https://www.zf.com/',
    types: ['OEM', 'OES', 'AFTERMARKET', 'PREMIUM', 'EV'],
    specializations: ['transmission', 'steering', 'chassis', 'electronics'],
  },
  {
    name: 'Continental',
    wikidataId: 'Q207661',
    aliases: ['Continental AG'],
    country: 'DE',
    foundedYear: 1871,
    website: 'https://www.continental.com/',
    types: ['OEM', 'OES', 'AFTERMARKET', 'PREMIUM', 'EV'],
    specializations: ['tires', 'braking', 'electronics', 'sensors'],
  },
  {
    name: 'MAHLE',
    wikidataId: 'Q679714',
    aliases: ['Mahle GmbH'],
    country: 'DE',
    foundedYear: 1920,
    website: 'https://www.mahle.com/',
    types: ['OEM', 'OES', 'AFTERMARKET', 'PREMIUM'],
    specializations: ['engine components', 'filters', 'thermal systems'],
  },
  {
    name: 'Brembo',
    wikidataId: 'Q899389',
    aliases: ['Brembo S.p.A.'],
    country: 'IT',
    foundedYear: 1961,
    website: 'https://www.brembo.com/',
    types: ['OEM', 'OES', 'AFTERMARKET', 'PREMIUM', 'PERFORMANCE'],
    specializations: ['braking'],
  },
  {
    name: 'Aisin',
    wikidataId: 'Q407056',
    aliases: ['Aisin Seiki', 'Aisin Corporation'],
    country: 'JP',
    foundedYear: 1949,
    website: 'https://www.aisin.com/',
    types: ['OEM', 'OES', 'AFTERMARKET', 'EV'],
    specializations: [
      'transmission',
      'drivetrain',
      'braking',
      'thermal systems',
    ],
  },
  {
    name: 'NGK',
    wikidataId: 'Q695381',
    aliases: ['NGK Spark Plug', 'Niterra'],
    country: 'JP',
    foundedYear: 1936,
    website: 'https://www.ngkntk.com/',
    types: ['OEM', 'OES', 'AFTERMARKET', 'PREMIUM'],
    specializations: ['spark plugs', 'ignition coils', 'sensors'],
  },
  {
    name: 'Hitachi Astemo',
    wikidataId: 'Q105018996',
    aliases: ['Astemo'],
    country: 'JP',
    foundedYear: 2021,
    website: 'https://www.hitachiastemo.com/',
    types: ['OEM', 'OES', 'EV', 'MOTORCYCLE'],
    specializations: [
      'powertrain',
      'chassis',
      'electronics',
      'motorcycle systems',
    ],
  },
  {
    name: 'Forvia',
    wikidataId: 'Q113483909',
    aliases: ['FORVIA', 'Faurecia Hella'],
    country: 'FR',
    foundedYear: 2022,
    website: 'https://www.forvia.com/',
    types: ['OEM', 'OES', 'EV'],
    specializations: ['seating', 'lighting', 'electronics', 'exhaust'],
  },
  {
    name: 'BorgWarner',
    wikidataId: 'Q894481',
    aliases: ['BorgWarner Inc.'],
    country: 'US',
    foundedYear: 1928,
    website: 'https://www.borgwarner.com/',
    types: ['OEM', 'OES', 'AFTERMARKET', 'EV'],
    specializations: ['turbochargers', 'transmission', 'electric drivetrain'],
  },
  {
    name: 'Dana',
    wikidataId: 'Q5214468',
    aliases: ['Dana Incorporated', 'Dana Holding Corporation'],
    country: 'US',
    foundedYear: 1904,
    website: 'https://www.dana.com/',
    types: ['OEM', 'OES', 'AFTERMARKET', 'TRUCK', 'EV'],
    specializations: ['axles', 'driveshafts', 'sealing', 'electric drivetrain'],
  },
  {
    name: 'HL Mando',
    wikidataId: 'Q485725',
    aliases: ['Mando', 'Mando Corporation'],
    country: 'KR',
    foundedYear: 1962,
    website: 'https://www.hlmando.com/',
    types: ['OEM', 'OES', 'EV'],
    specializations: ['braking', 'steering', 'suspension', 'ADAS'],
  },
  {
    name: 'Hyundai Mobis',
    wikidataId: 'Q1617722',
    aliases: ['Mobis'],
    country: 'KR',
    foundedYear: 1977,
    website: 'https://www.mobis.com/',
    types: ['OEM', 'OES', 'AFTERMARKET', 'EV'],
    specializations: ['modules', 'electronics', 'lighting', 'service parts'],
  },
  {
    name: 'Yazaki',
    wikidataId: 'Q1143649',
    aliases: ['Yazaki Corporation'],
    country: 'JP',
    foundedYear: 1941,
    website: 'https://www.yazaki-group.com/',
    types: ['OEM', 'OES', 'EV'],
    specializations: ['wiring harnesses', 'connectors', 'electronics'],
  },
  {
    name: 'Aptiv',
    wikidataId: 'Q4782427',
    aliases: ['Aptiv PLC', 'Delphi Automotive'],
    country: 'IE',
    foundedYear: 1994,
    website: 'https://www.aptiv.com/',
    types: ['OEM', 'OES', 'EV'],
    specializations: ['electronics', 'connectors', 'ADAS', 'software'],
  },
  {
    name: 'Lear',
    wikidataId: 'Q1477891',
    aliases: ['Lear Corporation'],
    country: 'US',
    foundedYear: 1917,
    website: 'https://www.lear.com/',
    types: ['OEM', 'OES', 'EV'],
    specializations: ['seating', 'electrical distribution', 'electronics'],
  },
  {
    name: 'Magna',
    wikidataId: 'Q950908',
    aliases: ['Magna International'],
    country: 'CA',
    foundedYear: 1957,
    website: 'https://www.magna.com/',
    types: ['OEM', 'OES', 'EV'],
    specializations: ['body', 'chassis', 'powertrain', 'electronics'],
  },
];

export function normalizeName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Â®|®|™/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .toLocaleLowerCase();
}

export function brandSlug(value: string): string {
  return (
    normalizeName(value)
      .replace(/[^\p{Script=Latin}\p{N}]+/gu, '-')
      .replace(/^-+|-+$/g, '') || 'brand'
  );
}

function normalizeWebsite(value: string | null): string | null {
  if (!value) return null;
  const url = new URL(value);
  return `${url.hostname.replace(/^www\./, '').toLowerCase()}${url.pathname.replace(/\/+$/, '')}`;
}

function normalizeCountry(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const raw = value.trim().toUpperCase().replace(/\s+/g, ' ');
  if (/\d/.test(raw)) return null;
  const aliases: Record<string, string | null> = {
    US: 'UNITED STATES',
    USA: 'UNITED STATES',
    'UNITED STATES (USA)': 'UNITED STATES',
    'UNITES STATES': 'UNITED STATES',
    UK: 'UNITED KINGDOM',
    'UNITED KINGDOM (UK)': 'UNITED KINGDOM',
    ENGLAND: 'UNITED KINGDOM',
    SCOTLAND: 'UNITED KINGDOM',
    'N. IRELAND': 'UNITED KINGDOM',
    CN: 'CHINA',
    'P. R. CHINA': 'CHINA',
    'P.R. CHINA': 'CHINA',
    KR: 'SOUTH KOREA',
    KOREA: 'SOUTH KOREA',
    'KOREA (ROK)': 'SOUTH KOREA',
    DE: 'GERMANY',
    'WEST GERMANY': 'GERMANY',
    FR: 'FRANCE',
    IT: 'ITALY',
    IN: 'INDIA',
    BR: 'BRAZIL',
    BRASIL: 'BRAZIL',
    AU: 'AUSTRALIA',
    AUSTRAILIA: 'AUSTRALIA',
    BE: 'BELGIUM',
    CZ: 'CZECH REPUBLIC',
    ES: 'SPAIN',
    ID: 'INDONESIA',
    LA: 'LAOS',
    MA: 'MOROCCO',
    MX: 'MEXICO',
    PL: 'POLAND',
    RU: 'RUSSIA',
    SE: 'SWEDEN',
    SK: 'SLOVAKIA',
    TH: 'THAILAND',
    TR: 'TURKEY',
    VN: 'VIETNAM',
    'THE NETHERLANDS': 'NETHERLANDS',
    HOLLAND: 'NETHERLANDS',
    'TAIWAN R.O.C.': 'TAIWAN',
    'TAIWAN ROC': 'TAIWAN',
    'TAIWAN, ROC': 'TAIWAN',
    'REPUBLIC OF SOUTH AFRICA': 'SOUTH AFRICA',
    'SOUTH AFRICIA': 'SOUTH AFRICA',
    'PHILIPPINE IS': 'PHILIPPINES',
    'PEURTO RICO': 'PUERTO RICO',
    'MYANMAR (BURMA)': 'MYANMAR',
    'GRAND DUCHY OF LUXEMBOURG': 'LUXEMBOURG',
    AFRICA: null,
    EUROPE: null,
    NIGATA: null,
    'NOVA SCOTIA': null,
    PRAHOVA: null,
    QUEBEC: null,
    STONE: null,
    SEANDAVIAN: null,
  };
  return Object.prototype.hasOwnProperty.call(aliases, raw)
    ? (aliases[raw] ?? null)
    : raw;
}

function inferSpecializations(name: string): string[] {
  const rules: Array<[RegExp, string]> = [
    [/\b(tire|tyre|rubber)\b/i, 'tires'],
    [/\bglass|glazing\b/i, 'automotive glass'],
    [/\bbrake|braking\b/i, 'braking'],
    [/\blamp|light|lighting\b/i, 'lighting'],
    [/\bhose|hydraulic\b/i, 'hoses and hydraulics'],
    [/\bwheel\b/i, 'wheels'],
    [/\bbattery\b/i, 'batteries'],
    [/\bseat|seating\b/i, 'seating'],
    [/\belectric|electronic|cable\b/i, 'electrical'],
    [/\bfilter\b/i, 'filters'],
    [/\bauto parts?|automotive\b/i, 'general automotive components'],
  ];
  return rules
    .filter(([pattern]) => pattern.test(name))
    .map(([, value]) => value);
}

function inferTypes(item: VpicManufacturer): PartBrandType[] {
  const types = new Set<PartBrandType>([PartBrandType.INDUSTRIAL]);
  const vehicleTypes = item.VehicleTypes.map((type) => type.Name.toLowerCase());
  if (vehicleTypes.some((type) => type.includes('motorcycle')))
    types.add(PartBrandType.MOTORCYCLE);
  if (vehicleTypes.some((type) => type.includes('truck')))
    types.add(PartBrandType.TRUCK);
  if (vehicleTypes.some((type) => type.includes('bus')))
    types.add(PartBrandType.BUS);
  return [...types];
}

function alias(
  name: string,
  type: PartBrandAliasType = PartBrandAliasType.ALTERNATIVE_NAME,
) {
  return { name, normalizedName: normalizeName(name), type };
}

export function mapVpicManufacturer(
  item: VpicManufacturer,
  retrievedAt: Date,
): PartBrandSeed {
  const officialName = item.Mfr_Name.trim().replace(/\s+/g, ' ');
  const commonName = item.Mfr_CommonName?.trim() || null;
  return {
    officialName,
    englishName: commonName ?? officialName,
    normalizedName: normalizeName(commonName ?? officialName),
    slug: brandSlug(commonName ?? officialName),
    countryOfOrigin: normalizeCountry(item.Country),
    city: null,
    foundedYear: null,
    parentCompany: null,
    officialWebsite: null,
    status: PartBrandStatus.UNKNOWN,
    types: inferTypes(item),
    specializations: inferSpecializations(officialName),
    manufacturingCountries: [],
    logoUrl: null,
    sourceExternalId: String(item.Mfr_ID),
    sourceUrl: `${VPIC_API}?ManufacturerType=Fabricating%20Manufacturer%20of%20Motor%20Vehicle%20Equipment&format=json`,
    sourceName: VPIC_SOURCE,
    sourceLicense: VPIC_LICENSE,
    sourceRetrievedAt: retrievedAt,
    aliases:
      commonName && normalizeName(commonName) !== normalizeName(officialName)
        ? [alias(officialName, PartBrandAliasType.TRADE_NAME)]
        : [],
  };
}

function mapEquipmentPlant(
  item: EquipmentPlant,
  equipmentType: EquipmentType,
  retrievedAt: Date,
): PartBrandSeed {
  const officialName = item.Name.trim().replace(/\s+/g, ' ');
  const specializations: Record<EquipmentType, string> = {
    1: 'tires',
    3: 'brake hoses',
    13: 'automotive glass',
    16: 'tire retreading',
  };
  const types: PartBrandType[] = [PartBrandType.INDUSTRIAL];
  if (equipmentType === 16) types.push(PartBrandType.AFTERMARKET);
  const oldCode = item.OldDOTCode ?? item.OldDotCode;
  return {
    officialName,
    englishName: officialName,
    normalizedName: normalizeName(officialName),
    slug: brandSlug(officialName),
    countryOfOrigin: normalizeCountry(item.Country),
    city: item.City?.trim() || null,
    foundedYear: null,
    parentCompany: null,
    officialWebsite: null,
    status:
      item.Status?.toLowerCase() === 'active'
        ? PartBrandStatus.ACTIVE
        : item.Status?.toLowerCase() === 'closed'
          ? PartBrandStatus.INACTIVE
          : PartBrandStatus.UNKNOWN,
    types,
    specializations: [specializations[equipmentType]],
    manufacturingCountries: normalizeCountry(item.Country)
      ? [normalizeCountry(item.Country)!]
      : [],
    logoUrl: null,
    sourceExternalId: `${equipmentType}:${item.DOTCode || normalizeName(officialName)}`,
    sourceUrl: `${VPIC_API.replace('/GetAllManufacturers', '/GetEquipmentPlantCodes')}?year=2026&equipmentType=${equipmentType}&reportType=All&format=json`,
    sourceName: VPIC_SOURCE,
    sourceLicense: VPIC_LICENSE,
    sourceRetrievedAt: retrievedAt,
    aliases: oldCode?.trim()
      ? [alias(oldCode.trim(), PartBrandAliasType.PREVIOUS_NAME)]
      : [],
  };
}

function mapCuratedBrand(item: CuratedBrand, retrievedAt: Date): PartBrandSeed {
  return {
    officialName: item.name,
    englishName: item.name,
    normalizedName: normalizeName(item.name),
    slug: brandSlug(item.name),
    countryOfOrigin: item.country,
    city: null,
    foundedYear: item.foundedYear ?? null,
    parentCompany: item.parentCompany ?? null,
    officialWebsite: item.website ?? null,
    status: PartBrandStatus.ACTIVE,
    types: item.types,
    specializations: item.specializations,
    manufacturingCountries: [],
    logoUrl: null,
    sourceExternalId: item.wikidataId,
    sourceUrl: `https://www.wikidata.org/wiki/${item.wikidataId}`,
    sourceName: WIKIDATA_SOURCE,
    sourceLicense: WIKIDATA_LICENSE,
    sourceRetrievedAt: retrievedAt,
    aliases: (item.aliases ?? []).map((name) =>
      alias(
        name,
        name.length <= 5
          ? PartBrandAliasType.ABBREVIATION
          : PartBrandAliasType.ALTERNATIVE_NAME,
      ),
    ),
  };
}

async function fetchVpicPage(page: number): Promise<VpicResponse> {
  const url = new URL(VPIC_API);
  url.searchParams.set(
    'ManufacturerType',
    'Fabricating Manufacturer of Motor Vehicle Equipment',
  );
  url.searchParams.set('format', 'json');
  url.searchParams.set('page', String(page));
  const response = await fetch(url, {
    headers: { 'user-agent': 'AutoPartsHub/1.0 (parts brand seed)' },
  });
  if (!response.ok)
    throw new Error(`vPIC page ${page}: HTTP ${response.status}`);
  return (await response.json()) as VpicResponse;
}

export async function fetchVpicManufacturers(): Promise<VpicManufacturer[]> {
  const result: VpicManufacturer[] = [];
  for (let page = 1; ; page += 1) {
    const response = await fetchVpicPage(page);
    if (!Array.isArray(response.Results)) {
      throw new Error(`vPIC page ${page}: malformed response`);
    }
    result.push(...response.Results);
    if (response.Results.length < PAGE_SIZE) break;
  }
  return result;
}

async function fetchEquipmentPlants(): Promise<
  Array<{ equipmentType: EquipmentType; plant: EquipmentPlant }>
> {
  const equipmentTypes: EquipmentType[] = [1, 3, 13, 16];
  const results = await Promise.all(
    equipmentTypes.map(async (equipmentType) => {
      const url = new URL(
        VPIC_API.replace('/GetAllManufacturers', '/GetEquipmentPlantCodes'),
      );
      url.searchParams.set('year', '2026');
      url.searchParams.set('equipmentType', String(equipmentType));
      url.searchParams.set('reportType', 'All');
      url.searchParams.set('format', 'json');
      const response = await fetch(url, {
        headers: { 'user-agent': 'AutoPartsHub/1.0 (parts brand seed)' },
      });
      if (!response.ok) {
        throw new Error(
          `vPIC equipment type ${equipmentType}: HTTP ${response.status}`,
        );
      }
      const body = (await response.json()) as { Results: EquipmentPlant[] };
      if (!Array.isArray(body.Results)) {
        throw new Error(
          `vPIC equipment type ${equipmentType}: malformed response`,
        );
      }
      return body.Results.map((plant) => ({ equipmentType, plant }));
    }),
  );
  return results.flat();
}

function mergeBrand(base: PartBrandSeed, extra: PartBrandSeed): PartBrandSeed {
  const aliases = [
    ...base.aliases,
    ...extra.aliases,
    alias(base.officialName),
  ].filter((item) => item.normalizedName !== extra.normalizedName);
  return {
    ...base,
    ...extra,
    types: [...new Set([...base.types, ...extra.types])],
    specializations: [
      ...new Set([...base.specializations, ...extra.specializations]),
    ],
    aliases: [
      ...new Map(aliases.map((item) => [item.normalizedName, item])).values(),
    ],
  };
}

export function buildDataset(
  vpic: VpicManufacturer[],
  plants: Array<{ equipmentType: EquipmentType; plant: EquipmentPlant }> = [],
  retrievedAt = new Date(),
): PartBrandSeed[] {
  const byName = new Map<string, PartBrandSeed>();
  for (const record of vpic.map((item) =>
    mapVpicManufacturer(item, retrievedAt),
  )) {
    const existing = byName.get(record.normalizedName);
    byName.set(
      record.normalizedName,
      existing ? mergeBrand(existing, record) : record,
    );
  }
  for (const record of plants.map(({ plant, equipmentType }) =>
    mapEquipmentPlant(plant, equipmentType, retrievedAt),
  )) {
    const existing = byName.get(record.normalizedName);
    byName.set(
      record.normalizedName,
      existing ? mergeBrand(existing, record) : record,
    );
  }
  for (const curated of CURATED_BRANDS.map((item) =>
    mapCuratedBrand(item, retrievedAt),
  )) {
    const existing = byName.get(curated.normalizedName);
    byName.set(
      curated.normalizedName,
      existing ? mergeBrand(existing, curated) : curated,
    );
  }

  const usedSlugs = new Set<string>();
  return [...byName.values()]
    .sort((a, b) => a.normalizedName.localeCompare(b.normalizedName))
    .map((item) => {
      let slug = item.slug;
      if (usedSlugs.has(slug))
        slug = `${slug}-${item.sourceName.toLowerCase().replace(/\W/g, '')}-${item.sourceExternalId.toLowerCase()}`;
      usedSlugs.add(slug);
      return { ...item, slug };
    });
}

export function buildCuratedDataset(retrievedAt = new Date()): PartBrandSeed[] {
  return buildDataset([], [], retrievedAt);
}

export function validateDataset(dataset: PartBrandSeed[]) {
  const duplicates = (values: string[]) =>
    values.filter((value, index) => values.indexOf(value) !== index);
  const errors: string[] = [];
  if (duplicates(dataset.map((item) => item.slug)).length)
    errors.push('duplicate slugs');
  if (duplicates(dataset.map((item) => item.normalizedName)).length)
    errors.push('duplicate normalized names');
  for (const item of dataset) {
    if (!item.sourceName || !item.sourceLicense || !item.sourceUrl)
      errors.push(`missing provenance: ${item.officialName}`);
    try {
      new URL(item.sourceUrl);
    } catch {
      errors.push(`invalid source URL: ${item.officialName}`);
    }
    if (item.officialWebsite) {
      try {
        new URL(item.officialWebsite);
      } catch {
        errors.push(`invalid website: ${item.officialName}`);
      }
    }
  }
  if (errors.length)
    throw new Error(
      `Part brand dataset failed validation:\n${errors.join('\n')}`,
    );
}

async function databaseComparison(
  prisma: PrismaClient,
  dataset: PartBrandSeed[],
) {
  let existing: Array<{ normalizedName: string }>;
  try {
    existing = await prisma.partBrand.findMany({
      select: { normalizedName: true },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2021'
    ) {
      existing = [];
    } else {
      throw error;
    }
  }
  const names = new Set(existing.map((item) => item.normalizedName));
  return {
    newBrands: dataset.filter((item) => !names.has(item.normalizedName)).length,
    updates: dataset.filter((item) => names.has(item.normalizedName)).length,
  };
}

function report(
  dataset: PartBrandSeed[],
  comparison: { newBrands: number; updates: number },
  curatedOnly: boolean,
) {
  const countType = (type: PartBrandType) =>
    dataset.filter((item) => item.types.includes(type)).length;
  console.log(
    JSON.stringify(
      {
        mode: process.argv.includes('--apply') ? 'apply' : 'plan',
        dataset: curatedOnly ? 'curated' : 'world',
        foundBrands: dataset.length,
        ...comparison,
        aliases: dataset.reduce((sum, item) => sum + item.aliases.length, 0),
        countries: new Set(
          dataset.map((item) => item.countryOfOrigin).filter(Boolean),
        ).size,
        specializations: new Set(
          dataset.flatMap((item) => item.specializations),
        ).size,
        types: {
          OEM: countType(PartBrandType.OEM),
          AFTERMARKET: countType(PartBrandType.AFTERMARKET),
          EV: countType(PartBrandType.EV),
          PREMIUM: countType(PartBrandType.PREMIUM),
        },
        sources: curatedOnly
          ? [{ name: WIKIDATA_SOURCE, license: WIKIDATA_LICENSE }]
          : [
              { name: VPIC_SOURCE, license: VPIC_LICENSE },
              { name: WIKIDATA_SOURCE, license: WIKIDATA_LICENSE },
            ],
      },
      null,
      2,
    ),
  );
}

async function applyDataset(prisma: PrismaClient, dataset: PartBrandSeed[]) {
  for (let start = 0; start < dataset.length; start += BATCH_SIZE) {
    for (const item of dataset.slice(start, start + BATCH_SIZE)) {
      const normalizedWebsite = normalizeWebsite(item.officialWebsite);
      const data = {
        officialName: item.officialName,
        englishName: item.englishName,
        slug: item.slug,
        countryOfOrigin: item.countryOfOrigin,
        city: item.city,
        foundedYear: item.foundedYear,
        parentCompany: item.parentCompany,
        officialWebsite: item.officialWebsite,
        normalizedWebsite,
        status: item.status,
        types: item.types,
        specializations: item.specializations,
        manufacturingCountries: item.manufacturingCountries,
        logoUrl: item.logoUrl,
        sourceExternalId: item.sourceExternalId,
        sourceUrl: item.sourceUrl,
        sourceName: item.sourceName,
        sourceLicense: item.sourceLicense,
        sourceRetrievedAt: item.sourceRetrievedAt,
        isActive: true,
      } satisfies Prisma.PartBrandUpdateInput;
      const brand = await prisma.partBrand.upsert({
        where: { normalizedName: item.normalizedName },
        create: { normalizedName: item.normalizedName, ...data },
        update: data,
        select: { id: true },
      });
      for (const itemAlias of item.aliases) {
        await prisma.partBrandAlias.upsert({
          where: {
            partBrandId_normalizedName: {
              partBrandId: brand.id,
              normalizedName: itemAlias.normalizedName,
            },
          },
          create: { partBrandId: brand.id, ...itemAlias },
          update: { name: itemAlias.name, type: itemAlias.type },
        });
      }
    }
  }
}

async function main() {
  const curatedOnly = process.argv.includes('--curated-only');
  const dataset = curatedOnly
    ? buildCuratedDataset()
    : await Promise.all([
        fetchVpicManufacturers(),
        fetchEquipmentPlants(),
      ]).then(([vpic, plants]) => buildDataset(vpic, plants));
  validateDataset(dataset);
  const prisma = new PrismaClient();
  try {
    const comparison = await databaseComparison(prisma, dataset);
    report(dataset, comparison, curatedOnly);
    if (!process.argv.includes('--apply')) {
      console.log('Dry run complete. No database records were changed.');
      return;
    }
    await applyDataset(prisma, dataset);
    console.log(
      `${curatedOnly ? 'Curated' : 'World'} parts brands seed applied successfully.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
