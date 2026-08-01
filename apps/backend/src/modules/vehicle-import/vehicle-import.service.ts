import { BadRequestException, Injectable } from '@nestjs/common';
import {
  Prisma,
  VehicleGenerationKind,
  VehiclePowertrainType,
} from '@prisma/client';
import { createHash } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';

export type VehicleImportRow = {
  manufacturer: string;
  manufacturerSlug?: string;
  country?: string;
  model: string;
  modelSlug?: string;
  generation?: string;
  generationSlug?: string;
  generationCode?: string;
  startYear?: string | number;
  endYear?: string | number;
  specificationYear?: string | number;
  trim?: string;
  variant?: string;
  powertrainType?: string;
  driveType?: string;
  transmissionType?: string;
  engineDisplacementCc?: string | number;
  enginePowerKw?: string | number;
  motorPowerKw?: string | number;
  batteryGrossKwh?: string | number;
  sourceTitle?: string;
  sourceUrl?: string;
  sourceLicense?: string;
  sourceRetrievedAt?: string;
};

const slugify = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');

const number = (value: unknown): number | null => {
  if (value === undefined || value === null || value === '') return null;
  const result = Number(value);
  return Number.isFinite(result) ? result : null;
};

function csv(text: string): VehicleImportRow[] {
  const delimiter = text.split(/\r?\n/, 1)[0]?.includes('\t')
    ? '\t'
    : text.split(/\r?\n/, 1)[0]?.includes(';')
      ? ';'
      : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = '';
    } else field += char;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [rawHeader, ...data] = rows;
  if (!rawHeader) return [];
  const header = rawHeader.map((item) => item.replace(/^\uFEFF/, '').trim());
  return data.map(
    (values) =>
      Object.fromEntries(
        header.map((name, index) => [name, values[index]?.trim() ?? '']),
      ) as VehicleImportRow,
  );
}

export function parseVehicleImport(
  buffer: Buffer,
  filename: string,
): VehicleImportRow[] {
  const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
  if (filename.toLowerCase().endsWith('.json')) {
    const parsed: unknown = JSON.parse(text);
    const rows = Array.isArray(parsed)
      ? parsed
      : (parsed as { records?: unknown[] })?.records;
    if (!Array.isArray(rows))
      throw new BadRequestException('JSON must be an array or { records: [] }');
    return rows as VehicleImportRow[];
  }
  if (filename.toLowerCase().endsWith('.csv')) return csv(text);
  throw new BadRequestException('Only .csv and .json files are supported');
}

@Injectable()
export class VehicleImportService {
  constructor(private readonly prisma: PrismaService) {}

  async import(
    file: { buffer: Buffer; originalname: string },
    dryRun: boolean,
  ) {
    const startedAt = new Date();
    const rows = parseVehicleImport(file.buffer, file.originalname);
    const errors: Array<{ row: number; message: string }> = [];
    const valid = rows.filter((row, index) => {
      if (!row.manufacturer?.trim() || !row.model?.trim()) {
        errors.push({
          row: index + 2,
          message: 'manufacturer and model required',
        });
        return false;
      }
      if (row.specificationYear && (!row.sourceUrl || !row.sourceLicense)) {
        errors.push({
          row: index + 2,
          message: 'specification requires sourceUrl and sourceLicense',
        });
        return false;
      }
      return true;
    });

    const manufacturerRows = new Map<string, VehicleImportRow>();
    const modelRows = new Map<string, VehicleImportRow>();
    const generationRows = new Map<string, VehicleImportRow>();
    const specificationRows = new Map<string, VehicleImportRow>();
    for (const row of valid) {
      const makeSlug = slugify(row.manufacturerSlug || row.manufacturer);
      const modelSlug = slugify(row.modelSlug || row.model);
      manufacturerRows.set(makeSlug, row);
      modelRows.set(`${makeSlug}/${modelSlug}`, row);
      if (row.generation) {
        const generationSlug = slugify(row.generationSlug || row.generation);
        generationRows.set(`${makeSlug}/${modelSlug}/${generationSlug}`, row);
      }
      if (row.specificationYear) {
        const fingerprint = JSON.stringify([
          makeSlug,
          modelSlug,
          row.generationSlug || row.generation || '',
          row.specificationYear,
          row.trim || '',
          row.variant || '',
          row.powertrainType || 'UNKNOWN',
        ]);
        specificationRows.set(
          createHash('sha256').update(fingerprint).digest('hex'),
          row,
        );
      }
    }

    const existing = await this.existingKeys(
      [...manufacturerRows.keys()],
      [...modelRows.keys()],
      [...generationRows.keys()],
      [...specificationRows.keys()],
    );
    const planned = {
      manufacturers: [...manufacturerRows.keys()].filter(
        (key) => !existing.manufacturers.has(key),
      ).length,
      models: [...modelRows.keys()].filter((key) => !existing.models.has(key))
        .length,
      generations: [...generationRows.keys()].filter(
        (key) => !existing.generations.has(key),
      ).length,
      specifications: [...specificationRows.keys()].filter(
        (key) => !existing.specifications.has(key),
      ).length,
    };
    const duplicates =
      manufacturerRows.size +
      modelRows.size +
      generationRows.size +
      specificationRows.size -
      Object.values(planned).reduce((sum, count) => sum + count, 0);

    if (!dryRun && errors.length === 0) {
      await this.retry(() =>
        this.apply(
          manufacturerRows,
          modelRows,
          generationRows,
          specificationRows,
        ),
      );
    }

    return {
      mode: dryRun ? 'dry-run' : 'apply',
      file: file.originalname,
      inputRows: rows.length,
      validRows: valid.length,
      planned,
      newRecords: Object.values(planned).reduce((sum, count) => sum + count, 0),
      skippedDuplicates: duplicates,
      errors,
      progress: errors.length
        ? 'validation-failed'
        : dryRun
          ? 'planned'
          : 'completed',
      durationMs: Date.now() - startedAt.getTime(),
    };
  }

  private async existingKeys(
    makeSlugs: string[],
    modelKeys: string[],
    generationKeys: string[],
    specificationHashes: string[],
  ) {
    const manufacturers = await this.prisma.manufacturer.findMany({
      where: { slug: { in: makeSlugs } },
      select: { id: true, slug: true },
    });
    const makeById = new Map(manufacturers.map((item) => [item.id, item.slug]));
    const models = await this.prisma.vehicleModel.findMany({
      where: { manufacturerId: { in: [...makeById.keys()] } },
      select: { id: true, slug: true, manufacturerId: true },
    });
    const modelById = new Map(
      models.map((item) => [
        item.id,
        `${makeById.get(item.manufacturerId)}/${item.slug}`,
      ]),
    );
    const generations = await this.prisma.vehicleGeneration.findMany({
      where: { vehicleModelId: { in: [...modelById.keys()] } },
      select: { slug: true, vehicleModelId: true },
    });
    const specifications = await this.prisma.vehicleSpecification.findMany({
      where: { specHash: { in: specificationHashes } },
      select: { specHash: true },
    });
    return {
      manufacturers: new Set(manufacturers.map((item) => item.slug)),
      models: new Set(
        models
          .map((item) => `${makeById.get(item.manufacturerId)}/${item.slug}`)
          .filter((item) => modelKeys.includes(item)),
      ),
      generations: new Set(
        generations
          .map((item) => `${modelById.get(item.vehicleModelId)}/${item.slug}`)
          .filter((item) => generationKeys.includes(item)),
      ),
      specifications: new Set(specifications.map((item) => item.specHash)),
    };
  }

  private async apply(
    manufacturerRows: Map<string, VehicleImportRow>,
    modelRows: Map<string, VehicleImportRow>,
    generationRows: Map<string, VehicleImportRow>,
    specificationRows: Map<string, VehicleImportRow>,
  ) {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.manufacturer.createMany({
          data: [...manufacturerRows].map(([slug, row]) => ({
            name: row.manufacturer.trim(),
            englishName: row.manufacturer.trim(),
            slug,
            country: row.country || null,
            isActive: true,
          })),
          skipDuplicates: true,
        });
        const manufacturers = await tx.manufacturer.findMany({
          where: { slug: { in: [...manufacturerRows.keys()] } },
          select: { id: true, slug: true },
        });
        const makeIds = new Map(
          manufacturers.map((item) => [item.slug, item.id]),
        );
        await tx.vehicleModel.createMany({
          data: [...modelRows].map(([key, row]) => {
            const [makeSlug, slug] = key.split('/');
            return {
              manufacturerId: makeIds.get(makeSlug)!,
              name: row.model.trim(),
              slug,
              startYear: number(row.startYear),
              endYear: number(row.endYear),
              isActive: true,
            };
          }),
          skipDuplicates: true,
        });
        const models = await tx.vehicleModel.findMany({
          where: { manufacturerId: { in: [...makeIds.values()] } },
          select: { id: true, slug: true, manufacturerId: true },
        });
        const makeById = new Map([...makeIds].map(([slug, id]) => [id, slug]));
        const modelIds = new Map(
          models.map((item) => [
            `${makeById.get(item.manufacturerId)}/${item.slug}`,
            item.id,
          ]),
        );
        await tx.vehicleGeneration.createMany({
          data: [...generationRows].map(([key, row]) => {
            const parts = key.split('/');
            return {
              vehicleModelId: modelIds.get(`${parts[0]}/${parts[1]}`)!,
              name: row.generation!.trim(),
              displayName: row.generation!.trim(),
              slug: parts[2],
              code: row.generationCode || null,
              startYear: number(row.startYear),
              endYear: number(row.endYear),
              kind: VehicleGenerationKind.GENERATION,
              sourceRefs: row.sourceUrl ? [row.sourceUrl] : [],
              isActive: true,
            };
          }),
          skipDuplicates: true,
        });
        const generations = await tx.vehicleGeneration.findMany({
          where: { vehicleModelId: { in: [...modelIds.values()] } },
          select: { id: true, slug: true, vehicleModelId: true },
        });
        const modelById = new Map([...modelIds].map(([key, id]) => [id, key]));
        const generationIds = new Map(
          generations.map((item) => [
            `${modelById.get(item.vehicleModelId)}/${item.slug}`,
            item.id,
          ]),
        );
        await tx.vehicleSpecification.createMany({
          data: [...specificationRows].map(([specHash, row]) => {
            const makeSlug = slugify(row.manufacturerSlug || row.manufacturer);
            const modelSlug = slugify(row.modelSlug || row.model);
            const generationSlug = row.generation
              ? slugify(row.generationSlug || row.generation)
              : null;
            const sourceRetrievedAt = new Date(
              row.sourceRetrievedAt || new Date().toISOString(),
            );
            return {
              vehicleModelId: modelIds.get(`${makeSlug}/${modelSlug}`)!,
              generationId: generationSlug
                ? generationIds.get(
                    `${makeSlug}/${modelSlug}/${generationSlug}`,
                  )
                : null,
              sourceKey: `vehicle-import:${specHash}`,
              specHash,
              year: number(row.specificationYear)!,
              trim: row.trim || null,
              variant: row.variant || null,
              powertrainType: this.powertrain(row.powertrainType),
              driveType: row.driveType || null,
              transmissionType: row.transmissionType || null,
              engineDisplacementCc: number(row.engineDisplacementCc),
              enginePowerKw: number(row.enginePowerKw),
              motorPowerKw: number(row.motorPowerKw),
              batteryGrossKwh: number(row.batteryGrossKwh),
              rangeData: {},
              sourceTitle: row.sourceTitle || 'Vehicle import',
              sourceUrl: row.sourceUrl!,
              sourceRetrievedAt,
              sourceLicense: row.sourceLicense!,
              sources: [{ url: row.sourceUrl, license: row.sourceLicense }],
              isActive: true,
            };
          }),
          skipDuplicates: true,
        });
      },
      { timeout: 120_000 },
    );
  }

  private powertrain(value?: string): VehiclePowertrainType {
    const candidate = value?.toUpperCase() || 'UNKNOWN';
    return Object.values(VehiclePowertrainType).includes(
      candidate as VehiclePowertrainType,
    )
      ? (candidate as VehiclePowertrainType)
      : VehiclePowertrainType.UNKNOWN;
  }

  private async retry<T>(
    operation: () => Promise<T>,
    attempts = 3,
  ): Promise<T> {
    let last: unknown;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        last = error;
        if (
          !(error instanceof Prisma.PrismaClientKnownRequestError) ||
          !['P2034', 'P1001', 'P1002'].includes(error.code) ||
          attempt === attempts
        )
          throw error;
      }
    }
    throw last;
  }
}
