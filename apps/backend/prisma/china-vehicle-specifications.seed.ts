import {
  Prisma,
  PrismaClient,
  VehicleGenerationKind,
  VehiclePowertrainType,
} from '@prisma/client';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  CHINA_MANUFACTURER_ALIAS_TO_SLUG,
  CHINA_MANUFACTURER_IDENTITIES,
} from './china-vehicle-curated';
import { chinaSlugify } from './china-vehicle-database.seed';

type SourceRecord = {
  type?: string;
  title?: string;
  url?: string;
  accessed_at?: string;
};

type RatedRange = {
  cycle?: string;
  range_km?: number;
};

type OpenEvVehicle = {
  make: { slug: string; name: string };
  model: { slug: string; name: string };
  year: number;
  trim?: { slug?: string; name?: string };
  variant?: { slug?: string; name?: string; kind?: string };
  unique_code: string;
  vehicle_type?: string;
  powertrain?: {
    drivetrain?: string;
    system_power_kw?: number;
    system_torque_nm?: number;
    motors?: Array<{
      position?: string;
      power_kw?: number;
      torque_nm?: number;
    }>;
  };
  battery?: {
    manufacturer?: string;
    chemistry?: string;
    pack_capacity_kwh_gross?: number;
    pack_capacity_kwh_net?: number;
  };
  charge_ports?: Array<{ connector?: string }>;
  charging?: {
    ac?: { max_power_kw?: number };
    dc?: { max_power_kw?: number };
  };
  range?: { rated?: RatedRange[] };
  availability?: { start_year?: number; end_year?: number };
  body?: {
    style?: string;
    doors?: number;
    seats?: number;
    platform?: string;
  };
  sources: SourceRecord[];
};

type OpenEvSnapshot = {
  release: string;
  license: string;
  generated_at: string;
  vehicles: OpenEvVehicle[];
};

export type VehicleSpecificationSeed = {
  sourceKey: string;
  specHash: string;
  makeSlug: string;
  makeName: string;
  modelSlug: string;
  modelName: string;
  year: number;
  trim: string | null;
  variant: string | null;
  vehicleType: string | null;
  bodyStyle: string | null;
  doors: number | null;
  seats: number | null;
  powertrainType: 'BEV';
  driveType: string | null;
  motorCount: number | null;
  motorPowerKw: number | null;
  motorTorqueNm: number | null;
  motorPositions: string[];
  batteryManufacturer: string | null;
  batteryChemistry: string | null;
  batteryGrossKwh: number | null;
  batteryUsableKwh: number | null;
  ranges: RatedRange[];
  rangeCltcKm: number | null;
  rangeWltpKm: number | null;
  rangeEpaKm: number | null;
  rangeNedcKm: number | null;
  acChargeKw: number | null;
  dcChargeKw: number | null;
  chargeConnectors: string[];
  platform: string | null;
  sourceTitle: string;
  sourceUrl: string;
  sourceRetrievedAt: Date;
  sourceLicense: 'CDLA-Permissive-2.0';
  sources: SourceRecord[];
};

const DATA_FILE = join(
  __dirname,
  'data',
  'china-vehicle-database',
  'open-ev-china-specifications-v1.24.0.json',
);
const DATASET_URL =
  'https://github.com/open-ev-data/open-ev-data-dataset/releases/tag/v1.24.0';
const MAKE_SLUG_MAP: Record<string, string> = {
  gac_aion: 'aion',
  gwm: 'great-wall',
  im_motors: 'im-motors',
  m_hero: 'm-hero',
  rising_auto: 'rising-auto',
};

function readSnapshot(): OpenEvSnapshot {
  return JSON.parse(
    readFileSync(DATA_FILE, 'utf8').replace(/^\uFEFF/, ''),
  ) as OpenEvSnapshot;
}

function validSource(source: SourceRecord): source is Required<
  Pick<SourceRecord, 'title' | 'url' | 'accessed_at'>
> &
  SourceRecord {
  if (!source.title || !source.url || !source.accessed_at) return false;
  try {
    const parsed = new URL(source.url);
    const date = new Date(source.accessed_at);
    return (
      ['http:', 'https:'].includes(parsed.protocol) &&
      !Number.isNaN(date.getTime())
    );
  } catch {
    return false;
  }
}

function oneRange(ranges: RatedRange[], cycle: string): number | null {
  const values = [
    ...new Set(
      ranges
        .filter((item) => item.cycle?.toLowerCase() === cycle)
        .map((item) => item.range_km)
        .filter((value): value is number => Number.isFinite(value)),
    ),
  ];
  return values.length === 1 ? values[0]! : null;
}

function normalizedSpecHash(
  spec: Omit<VehicleSpecificationSeed, 'specHash'>,
): string {
  return createHash('sha256')
    .update(
      JSON.stringify({
        makeSlug: spec.makeSlug,
        modelSlug: spec.modelSlug,
        year: spec.year,
        trim: spec.trim,
        variant: spec.variant,
        powertrainType: spec.powertrainType,
        driveType: spec.driveType,
        motorCount: spec.motorCount,
        motorPowerKw: spec.motorPowerKw,
        motorTorqueNm: spec.motorTorqueNm,
        batteryManufacturer: spec.batteryManufacturer,
        batteryChemistry: spec.batteryChemistry,
        batteryGrossKwh: spec.batteryGrossKwh,
        batteryUsableKwh: spec.batteryUsableKwh,
        ranges: spec.ranges,
        acChargeKw: spec.acChargeKw,
        dcChargeKw: spec.dcChargeKw,
        chargeConnectors: spec.chargeConnectors,
        platform: spec.platform,
      }),
    )
    .digest('hex');
}

export function buildChinaVehicleSpecifications(): VehicleSpecificationSeed[] {
  const snapshot = readSnapshot();
  if (
    snapshot.release !== 'v1.24.0' ||
    snapshot.license !== 'CDLA-Permissive-2.0'
  ) {
    throw new Error('Unexpected OpenEV snapshot version or license');
  }

  const specifications = snapshot.vehicles.map((vehicle) => {
    const sources = vehicle.sources.filter(validSource);
    if (sources.length === 0) {
      throw new Error(
        `Specification has no verifiable source URL: ${vehicle.unique_code}`,
      );
    }
    const primary = sources.find((item) => item.type === 'oem') ?? sources[0]!;
    const makeSlug =
      MAKE_SLUG_MAP[vehicle.make.slug] ??
      CHINA_MANUFACTURER_ALIAS_TO_SLUG.get(
        vehicle.make.name.toLocaleLowerCase(),
      ) ??
      chinaSlugify(vehicle.make.slug);
    const modelSlug = chinaSlugify(vehicle.model.slug || vehicle.model.name);
    const ranges = (vehicle.range?.rated ?? []).filter(
      (item) =>
        typeof item.cycle === 'string' &&
        Number.isFinite(item.range_km) &&
        item.range_km! > 0,
    );
    const motors = vehicle.powertrain?.motors ?? [];
    const partial: Omit<VehicleSpecificationSeed, 'specHash'> = {
      sourceKey: `open-ev-data:${vehicle.unique_code}`,
      makeSlug,
      makeName: vehicle.make.name,
      modelSlug,
      modelName: vehicle.model.name,
      year: vehicle.year,
      trim: vehicle.trim?.name ?? null,
      variant: vehicle.variant?.name ?? null,
      vehicleType: vehicle.vehicle_type ?? null,
      bodyStyle: vehicle.body?.style ?? null,
      doors: vehicle.body?.doors ?? null,
      seats: vehicle.body?.seats ?? null,
      powertrainType: 'BEV',
      driveType: vehicle.powertrain?.drivetrain?.toUpperCase() ?? null,
      motorCount: motors.length || null,
      motorPowerKw: vehicle.powertrain?.system_power_kw ?? null,
      motorTorqueNm: vehicle.powertrain?.system_torque_nm ?? null,
      motorPositions: [
        ...new Set(
          motors
            .map((motor) => motor.position?.toUpperCase())
            .filter((value): value is string => Boolean(value)),
        ),
      ].sort(),
      batteryManufacturer: vehicle.battery?.manufacturer ?? null,
      batteryChemistry: vehicle.battery?.chemistry?.toUpperCase() ?? null,
      batteryGrossKwh: vehicle.battery?.pack_capacity_kwh_gross ?? null,
      batteryUsableKwh: vehicle.battery?.pack_capacity_kwh_net ?? null,
      ranges,
      rangeCltcKm: oneRange(ranges, 'cltc'),
      rangeWltpKm: oneRange(ranges, 'wltp'),
      rangeEpaKm: oneRange(ranges, 'epa'),
      rangeNedcKm: oneRange(ranges, 'nedc'),
      acChargeKw: vehicle.charging?.ac?.max_power_kw ?? null,
      dcChargeKw: vehicle.charging?.dc?.max_power_kw ?? null,
      chargeConnectors: [
        ...new Set(
          (vehicle.charge_ports ?? [])
            .map((port) => port.connector?.toUpperCase())
            .filter((value): value is string => Boolean(value)),
        ),
      ].sort(),
      platform: vehicle.body?.platform ?? null,
      sourceTitle: primary.title,
      sourceUrl: primary.url,
      sourceRetrievedAt: new Date(primary.accessed_at),
      sourceLicense: 'CDLA-Permissive-2.0',
      sources,
    };
    return { ...partial, specHash: normalizedSpecHash(partial) };
  });

  assertSpecifications(specifications);
  return specifications.sort((a, b) => a.sourceKey.localeCompare(b.sourceKey));
}

function assertUnique(values: string[], label: string) {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`Duplicate ${label}: ${value}`);
    seen.add(value);
  }
}

export function assertSpecifications(
  specifications: VehicleSpecificationSeed[],
) {
  assertUnique(
    specifications.map((item) => item.sourceKey),
    'specification source key',
  );
  assertUnique(
    specifications.map((item) => item.specHash),
    'factory specification',
  );
  for (const item of specifications) {
    if (item.year < 2000 || item.year > 2100) {
      throw new Error(`Invalid specification year: ${item.sourceKey}`);
    }
    if (item.powertrainType !== 'BEV') {
      throw new Error(`Unsupported powertrain: ${item.sourceKey}`);
    }
    if (!validSource({
      title: item.sourceTitle,
      url: item.sourceUrl,
      accessed_at: item.sourceRetrievedAt.toISOString(),
    })) {
      throw new Error(`Invalid specification source: ${item.sourceKey}`);
    }
    for (const value of [
      item.batteryGrossKwh,
      item.batteryUsableKwh,
      item.acChargeKw,
      item.dcChargeKw,
      item.rangeCltcKm,
      item.rangeWltpKm,
      item.rangeEpaKm,
      item.rangeNedcKm,
    ]) {
      if (value !== null && value <= 0) {
        throw new Error(`Invalid positive value: ${item.sourceKey}`);
      }
    }
  }
}

function uniqueModelKeys(specifications: VehicleSpecificationSeed[]) {
  return new Set(
    specifications.map((item) => `${item.makeSlug}/${item.modelSlug}`),
  );
}

async function comparison(
  prisma: PrismaClient,
  specifications: VehicleSpecificationSeed[],
) {
  const makeSlugs = [...new Set(specifications.map((item) => item.makeSlug))];
  const existingMakes = await prisma.manufacturer.findMany({
    where: { slug: { in: makeSlugs } },
    select: { id: true, slug: true },
  });
  const ids = existingMakes.map((item) => item.id);
  const existingModels = await prisma.vehicleModel.findMany({
    where: { manufacturerId: { in: ids } },
    select: {
      slug: true,
      manufacturer: { select: { slug: true } },
    },
  });
  let existingSpecificationKeys = new Set<string>();
  try {
    const rows = await prisma.vehicleSpecification.findMany({
      where: {
        sourceKey: { in: specifications.map((item) => item.sourceKey) },
      },
      select: { sourceKey: true },
    });
    existingSpecificationKeys = new Set(rows.map((item) => item.sourceKey));
  } catch (error) {
    if (
      !(error instanceof Prisma.PrismaClientKnownRequestError) ||
      error.code !== 'P2021'
    ) {
      throw error;
    }
  }
  const existingModelKeys = new Set(
    existingModels.map(
      (item) => `${item.manufacturer.slug}/${item.slug}`,
    ),
  );
  return {
    manufacturersToCreate: makeSlugs.length - existingMakes.length,
    manufacturersToUpdate: existingMakes.length,
    modelsToCreate: [...uniqueModelKeys(specifications)].filter(
      (key) => !existingModelKeys.has(key),
    ).length,
    modelsToUpdate: [...uniqueModelKeys(specifications)].filter((key) =>
      existingModelKeys.has(key),
    ).length,
    newSpecifications: specifications.filter(
      (item) => !existingSpecificationKeys.has(item.sourceKey),
    ).length,
    existingSpecifications: existingSpecificationKeys.size,
  };
}

function reportFacts(specifications: VehicleSpecificationSeed[]) {
  const counts = (type: string) =>
    specifications.filter((item) => item.powertrainType === type).length;
  return {
    specifications: specifications.length,
    BEV: counts('BEV'),
    PHEV: counts('PHEV'),
    EREV: counts('EREV'),
    HEV: counts('HEV'),
    ICE: counts('ICE'),
    batteryManufacturers: [
      ...new Set(
        specifications
          .map((item) => item.batteryManufacturer)
          .filter((value): value is string => Boolean(value)),
      ),
    ].sort(),
    platforms: [
      ...new Set(
        specifications
          .map((item) => item.platform)
          .filter((value): value is string => Boolean(value)),
      ),
    ].sort(),
    engineTypes: [],
  };
}

async function printPlan(
  prisma: PrismaClient,
  specifications: VehicleSpecificationSeed[],
) {
  console.log(
    JSON.stringify(
      {
        mode: process.argv.includes('--apply') ? 'apply' : 'plan',
        ...(await comparison(prisma, specifications)),
        ...reportFacts(specifications),
        source: {
          dataset: 'OpenEV Data v1.24.0',
          url: DATASET_URL,
          license: 'CDLA-Permissive-2.0',
        },
      },
      null,
      2,
    ),
  );
}

function identityForSlug(slug: string) {
  return CHINA_MANUFACTURER_IDENTITIES.find((item) => item.slug === slug);
}

async function applySpecifications(
  prisma: PrismaClient,
  specifications: VehicleSpecificationSeed[],
) {
  const makeGroups = new Map<string, VehicleSpecificationSeed[]>();
  for (const specification of specifications) {
    const group = makeGroups.get(specification.makeSlug) ?? [];
    group.push(specification);
    makeGroups.set(specification.makeSlug, group);
  }

  for (const [slug, group] of makeGroups) {
    const identity = identityForSlug(slug);
    const existing = await prisma.manufacturer.findUnique({
      where: { slug },
      select: { id: true, sourceRefs: true },
    });
    const refs = [
      DATASET_URL,
      ...new Set(group.flatMap((item) => item.sources.map((source) => source.url!))),
    ];
    if (existing) {
      await prisma.manufacturer.update({
        where: { id: existing.id },
        data: {
          ...(identity?.name && { englishName: identity.name }),
          sourceRefs: [...new Set([...existing.sourceRefs, ...refs])],
          isActive: true,
        },
      });
    } else {
      await prisma.manufacturer.create({
        data: {
          name: identity?.name ?? group[0]!.makeName,
          englishName: identity?.name ?? group[0]!.makeName,
          slug,
          country: 'CN',
          manufacturerType: identity?.manufacturerType ?? 'OTHER',
          sourceRefs: refs,
          isActive: true,
        },
      });
    }
  }

  const manufacturers = await prisma.manufacturer.findMany({
    where: { slug: { in: [...makeGroups.keys()] } },
    select: { id: true, slug: true },
  });
  const makeIds = new Map(manufacturers.map((item) => [item.slug, item.id]));
  const modelGroups = new Map<string, VehicleSpecificationSeed[]>();
  for (const specification of specifications) {
    const key = `${specification.makeSlug}/${specification.modelSlug}`;
    const group = modelGroups.get(key) ?? [];
    group.push(specification);
    modelGroups.set(key, group);
  }

  for (const [key, group] of modelGroups) {
    const first = group[0]!;
    const manufacturerId = makeIds.get(first.makeSlug)!;
    const existing = await prisma.vehicleModel.findUnique({
      where: {
        manufacturerId_slug: {
          manufacturerId,
          slug: first.modelSlug,
        },
      },
      select: { id: true, sourceRefs: true, startYear: true, endYear: true },
    });
    const startYear = Math.min(...group.map((item) => item.year));
    const endYear = Math.max(...group.map((item) => item.year));
    const bodyStyles = [...new Set(group.map((item) => item.bodyStyle).filter(Boolean))];
    const doors = [...new Set(group.map((item) => item.doors).filter(Number.isInteger))];
    const seats = [...new Set(group.map((item) => item.seats).filter(Number.isInteger))];
    const platforms = [...new Set(group.map((item) => item.platform).filter(Boolean))];
    const refs = [
      DATASET_URL,
      ...new Set(group.flatMap((item) => item.sources.map((source) => source.url!))),
    ];
    const updateData = {
      startYear:
        existing?.startYear === null || existing?.startYear === undefined
          ? startYear
          : Math.min(existing.startYear, startYear),
      endYear:
        existing?.endYear === null || existing?.endYear === undefined
          ? endYear
          : Math.max(existing.endYear, endYear),
      powertrainType: VehiclePowertrainType.BEV,
      ...(bodyStyles.length === 1 && { bodyStyle: bodyStyles[0] as string }),
      ...(doors.length === 1 && { doors: doors[0] as number }),
      ...(seats.length === 1 && { seats: seats[0] as number }),
      ...(platforms.length === 1 && { platform: platforms[0] as string }),
      sourceRefs: [...new Set([...(existing?.sourceRefs ?? []), ...refs])],
      isActive: true,
    } satisfies Prisma.VehicleModelUpdateInput;
    if (existing) {
      await prisma.vehicleModel.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      await prisma.vehicleModel.create({
        data: {
          manufacturerId,
          name: first.modelName,
          slug: first.modelSlug,
          vehicleType: first.vehicleType,
          ...updateData,
        },
      });
    }
    void key;
  }

  const models = await prisma.vehicleModel.findMany({
    where: { manufacturerId: { in: [...makeIds.values()] } },
    select: { id: true, slug: true, manufacturerId: true },
  });
  const makeById = new Map(manufacturers.map((item) => [item.id, item.slug]));
  const modelIds = new Map(
    models.map((item) => [
      `${makeById.get(item.manufacturerId)}/${item.slug}`,
      item.id,
    ]),
  );

  await prisma.vehicleGeneration.createMany({
    data: [
      ...new Map(
        specifications.map((item) => {
          const vehicleModelId = modelIds.get(
            `${item.makeSlug}/${item.modelSlug}`,
          )!;
          const key = `${vehicleModelId}/${item.year}`;
          return [
            key,
            {
              vehicleModelId,
              name: `${item.year} model year`,
              displayName: `${item.year} model year`,
              slug: `model-year-${item.year}`,
              code: `MY${item.year}`,
              startYear: item.year,
              endYear: item.year,
              kind: VehicleGenerationKind.MODEL_YEAR,
              isFacelift: false,
              sourceRefs: [item.sourceUrl, DATASET_URL],
              notes: 'Verified OpenEV Data factory specification model year',
              isActive: true,
            },
          ];
        }),
      ).values(),
    ],
    skipDuplicates: true,
  });

  const generations = await prisma.vehicleGeneration.findMany({
    where: {
      vehicleModelId: { in: [...modelIds.values()] },
      kind: VehicleGenerationKind.MODEL_YEAR,
    },
    select: { id: true, slug: true, vehicleModelId: true },
  });
  const generationIds = new Map(
    generations.map((item) => [
      `${item.vehicleModelId}/${item.slug}`,
      item.id,
    ]),
  );

  for (const item of specifications) {
    const vehicleModelId = modelIds.get(`${item.makeSlug}/${item.modelSlug}`)!;
    const generationId = generationIds.get(
      `${vehicleModelId}/model-year-${item.year}`,
    );
    await prisma.vehicleSpecification.upsert({
      where: { sourceKey: item.sourceKey },
      create: {
        vehicleModelId,
        generationId,
        sourceKey: item.sourceKey,
        specHash: item.specHash,
        year: item.year,
        trim: item.trim,
        variant: item.variant,
        powertrainType: VehiclePowertrainType.BEV,
        driveType: item.driveType,
        motorCount: item.motorCount,
        motorPowerKw: item.motorPowerKw,
        motorTorqueNm: item.motorTorqueNm,
        motorPositions: item.motorPositions,
        batteryManufacturer: item.batteryManufacturer,
        batteryChemistry: item.batteryChemistry,
        batteryGrossKwh: item.batteryGrossKwh,
        batteryUsableKwh: item.batteryUsableKwh,
        rangeCltcKm: item.rangeCltcKm,
        rangeWltpKm: item.rangeWltpKm,
        rangeEpaKm: item.rangeEpaKm,
        rangeNedcKm: item.rangeNedcKm,
        rangeData: item.ranges as Prisma.InputJsonValue,
        acChargeKw: item.acChargeKw,
        dcChargeKw: item.dcChargeKw,
        chargeConnectors: item.chargeConnectors,
        platform: item.platform,
        doors: item.doors,
        seats: item.seats,
        sourceTitle: item.sourceTitle,
        sourceUrl: item.sourceUrl,
        sourceRetrievedAt: item.sourceRetrievedAt,
        sourceLicense: item.sourceLicense,
        sources: item.sources as Prisma.InputJsonValue,
        isActive: true,
      },
      update: {
        generationId,
        sourceRetrievedAt: item.sourceRetrievedAt,
        sources: item.sources as Prisma.InputJsonValue,
        isActive: true,
      },
    });
  }
}

async function main() {
  const specifications = buildChinaVehicleSpecifications();
  const prisma = new PrismaClient();
  try {
    await printPlan(prisma, specifications);
    if (!process.argv.includes('--apply')) {
      console.log('Dry run complete. No database records were changed.');
      return;
    }
    await applySpecifications(prisma, specifications);
    console.log('China factory specifications applied successfully.');
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
