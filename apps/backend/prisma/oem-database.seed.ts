import {
  OemImportBatchStatus,
  OemPartBrandRelationType,
  OemPartStatus,
  OemSourceType,
  Prisma,
  PrismaClient,
} from '@prisma/client';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { normalizePartName } from '../src/common/utils/part-name-normalizer';
import { normalizePartNumber } from '../src/common/utils/part-number-normalizer';

type CsvRow = {
  manufacturer: string;
  oem_number: string;
  description: string;
  brand: string;
  category: string;
  model: string;
  generation: string;
  year_from: string;
  year_to: string;
  external_part_number: string;
  source_url: string;
};

export const EMBEDDED_OEM_DATA: CsvRow[] = [];
export const BUILTIN_OEM_SOURCE_COUNT = 2;

function option(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv
    .find((arg) => arg.startsWith(prefix))
    ?.slice(prefix.length);
}

export function normalizeOemNumber(value: string) {
  return normalizePartNumber(value.replace(/[\u200B-\u200D\uFEFF]/g, ''));
}

function delimiter(line: string) {
  const candidates = [',', ';', '\t'];
  return candidates.sort(
    (a, b) => line.split(b).length - line.split(a).length,
  )[0];
}

function parseLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === separator && !quoted) {
      result.push(value.trim());
      value = '';
    } else value += char;
  }
  result.push(value.trim());
  return result;
}

export function parseOemCsv(content: string): CsvRow[] {
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim());
  if (!lines.length) return [];
  const separator = delimiter(lines[0]);
  const headers = parseLine(lines[0], separator);
  const required = [
    'manufacturer',
    'oem_number',
    'description',
    'brand',
    'category',
    'model',
    'generation',
    'year_from',
    'year_to',
    'external_part_number',
    'source_url',
  ];
  if (required.some((header) => !headers.includes(header))) {
    throw new Error(`CSV must contain: ${required.join(', ')}`);
  }
  return lines.slice(1).map((line) => {
    const values = parseLine(line, separator);
    return Object.fromEntries(
      headers.map((header, i) => [header, values[i] ?? '']),
    ) as CsvRow;
  });
}

export function validateRows(rows: CsvRow[]) {
  const errors: Array<{ row: number; errors: string[] }> = [];
  const seen = new Set<string>();
  rows.forEach((row, index) => {
    const rowErrors: string[] = [];
    const normalized = normalizeOemNumber(row.oem_number);
    if (!row.manufacturer) rowErrors.push('manufacturer is required');
    if (!normalized) rowErrors.push('oem_number is invalid');
    if (!row.source_url) rowErrors.push('source_url is required');
    else {
      try {
        new URL(row.source_url);
      } catch {
        rowErrors.push('source_url is invalid');
      }
    }
    const key = `${row.manufacturer.toLowerCase()}/${normalized}`;
    if (seen.has(key))
      rowErrors.push('duplicate manufacturer + normalized OEM');
    seen.add(key);
    const from = row.year_from ? Number(row.year_from) : null;
    const to = row.year_to ? Number(row.year_to) : null;
    if (
      (from !== null && !Number.isInteger(from)) ||
      (to !== null && !Number.isInteger(to))
    ) {
      rowErrors.push('years must be integers');
    }
    if (from !== null && to !== null && from > to)
      rowErrors.push('year_from exceeds year_to');
    if (rowErrors.length) errors.push({ row: index + 2, errors: rowErrors });
  });
  return errors;
}

export function hasDirectedCycle(edges: Array<[string, string]>) {
  const graph = new Map<string, string[]>();
  for (const [from, to] of edges) {
    graph.set(from, [...(graph.get(from) ?? []), to]);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (node: string): boolean => {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    for (const next of graph.get(node) ?? []) {
      if (visit(next)) return true;
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  };
  return [...graph.keys()].some(visit);
}

async function compareReferences(prisma: PrismaClient, rows: CsvRow[]) {
  const [manufacturers, brands, catalogItems, models] = await Promise.all([
    prisma.manufacturer.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
    }),
    prisma.partBrand.findMany({
      where: { isActive: true },
      select: { id: true, officialName: true, slug: true },
    }),
    prisma.partCatalogItem.findMany({
      where: { isActive: true, category: { isActive: true } },
      select: { id: true, name: true, internalCode: true },
    }),
    prisma.vehicleModel.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, manufacturerId: true },
    }),
  ]);
  const manufacturerMap = new Map(
    manufacturers.flatMap((item) => [
      [item.name.toLowerCase(), item],
      [item.slug.toLowerCase(), item],
    ]),
  );
  const brandMap = new Map(
    brands.flatMap((item) => [
      [item.officialName.toLowerCase(), item],
      [item.slug.toLowerCase(), item],
    ]),
  );
  const catalogMap = new Map(
    catalogItems.flatMap((item) => [
      [item.name.toLowerCase(), item],
      [item.internalCode.toLowerCase(), item],
    ]),
  );
  const modelMap = new Map(
    models.flatMap((item) => [
      [`${item.manufacturerId}/${item.name.toLowerCase()}`, item],
      [`${item.manufacturerId}/${item.slug.toLowerCase()}`, item],
    ]),
  );
  return { manufacturerMap, brandMap, catalogMap, modelMap };
}

async function applyRows(
  prisma: PrismaClient,
  rows: CsvRow[],
  fileName: string,
  checksum: string,
) {
  const license = option('license');
  const sourceName = option('source-name') ?? 'OEM CSV import';
  const redistributable = option('redistributable') === 'true';
  if (!license || !redistributable) {
    throw new Error(
      'Apply requires --license=<license> and --redistributable=true',
    );
  }
  const refs = await compareReferences(prisma, rows);
  const force = process.argv.includes('--force');
  const source = await prisma.oemSource.upsert({
    where: {
      name_url: {
        name: sourceName,
        url: rows[0]?.source_url ?? 'manual://empty',
      },
    },
    create: {
      name: sourceName,
      url: rows[0]?.source_url ?? 'manual://empty',
      sourceType: OemSourceType.CSV_IMPORT,
      license,
      usageNotes: 'Imported through controlled OEM CSV pipeline',
      isRedistributable: true,
      retrievedAt: new Date(),
    },
    update: {
      license,
      isRedistributable: true,
      retrievedAt: new Date(),
      isActive: true,
    },
  });
  const previous = await prisma.oemImportBatch.findUnique({
    where: { checksum_sourceId: { checksum, sourceId: source.id } },
  });
  if (previous && !force)
    throw new Error('This file checksum was already imported; use --force');

  const batch = previous
    ? await prisma.oemImportBatch.update({
        where: { id: previous.id },
        data: { status: OemImportBatchStatus.RUNNING, startedAt: new Date() },
      })
    : await prisma.oemImportBatch.create({
        data: {
          sourceId: source.id,
          fileName,
          checksum,
          status: OemImportBatchStatus.RUNNING,
          totalRows: rows.length,
          reportJson: {},
          startedAt: new Date(),
        },
      });
  let createdRows = 0;
  let updatedRows = 0;
  try {
    await prisma.$transaction(async (tx) => {
      for (const row of rows) {
        const manufacturer = refs.manufacturerMap.get(
          row.manufacturer.toLowerCase(),
        );
        if (!manufacturer)
          throw new Error(`Unknown manufacturer: ${row.manufacturer}`);
        const normalizedNumber = normalizeOemNumber(row.oem_number);
        const existing = await tx.oemPart.findUnique({
          where: {
            manufacturerId_normalizedNumber: {
              manufacturerId: manufacturer.id,
              normalizedNumber,
            },
          },
        });
        const part = await tx.oemPart.upsert({
          where: {
            manufacturerId_normalizedNumber: {
              manufacturerId: manufacturer.id,
              normalizedNumber,
            },
          },
          create: {
            number: row.oem_number,
            normalizedNumber,
            displayNumber: row.oem_number,
            description: row.description || undefined,
            descriptionNormalized: row.description
              ? normalizePartName(row.description)
              : undefined,
            status: OemPartStatus.UNKNOWN,
            manufacturerId: manufacturer.id,
            sourceId: source.id,
            sourceKey: `${manufacturer.slug}:${normalizedNumber}`,
            metadata: {},
          },
          update: {
            description: row.description || undefined,
            descriptionNormalized: row.description
              ? normalizePartName(row.description)
              : undefined,
            sourceId: source.id,
          },
        });
        existing ? updatedRows++ : createdRows++;
        if (row.category) {
          const catalog = refs.catalogMap.get(row.category.toLowerCase());
          if (!catalog)
            throw new Error(`Unknown Catalog v2 item: ${row.category}`);
          await tx.oemPartCategory.upsert({
            where: {
              oemPartId_catalogItemId: {
                oemPartId: part.id,
                catalogItemId: catalog.id,
              },
            },
            create: {
              oemPartId: part.id,
              catalogItemId: catalog.id,
              confidence: 50,
              sourceId: source.id,
            },
            update: { confidence: 50, sourceId: source.id },
          });
        }
        if (row.brand) {
          const brand = refs.brandMap.get(row.brand.toLowerCase());
          if (!brand) throw new Error(`Unknown PartBrand: ${row.brand}`);
          await tx.oemPartBrand.upsert({
            where: {
              oemPartId_partBrandId_relationType: {
                oemPartId: part.id,
                partBrandId: brand.id,
                relationType: OemPartBrandRelationType.UNKNOWN,
              },
            },
            create: {
              oemPartId: part.id,
              partBrandId: brand.id,
              relationType: OemPartBrandRelationType.UNKNOWN,
              confidence: 50,
              sourceId: source.id,
            },
            update: { confidence: 50, sourceId: source.id },
          });
        }
        if (row.model) {
          const model = refs.modelMap.get(
            `${manufacturer.id}/${row.model.toLowerCase()}`,
          );
          if (!model) throw new Error(`Unknown vehicle model: ${row.model}`);
          await tx.oemPartFitment.create({
            data: {
              oemPartId: part.id,
              manufacturerId: manufacturer.id,
              vehicleModelId: model.id,
              yearFrom: row.year_from ? Number(row.year_from) : undefined,
              yearTo: row.year_to ? Number(row.year_to) : undefined,
              confidence: 50,
              sourceId: source.id,
            },
          });
        }
        if (row.external_part_number && row.brand) {
          const brand = refs.brandMap.get(row.brand.toLowerCase())!;
          const normalizedExternalPartNumber = normalizeOemNumber(
            row.external_part_number,
          );
          const fingerprint = `${part.id}||${brand.id}|${normalizedExternalPartNumber}|AFTERMARKET_ANALOG`;
          await tx.oemCrossReference.upsert({
            where: { fingerprint },
            create: {
              fromOemPartId: part.id,
              partBrandId: brand.id,
              externalPartNumber: row.external_part_number,
              normalizedExternalPartNumber,
              relationType: 'AFTERMARKET_ANALOG',
              confidence: 50,
              sourceId: source.id,
              fingerprint,
            },
            update: { confidence: 50, sourceId: source.id },
          });
        }
      }
    });
    await prisma.oemImportBatch.update({
      where: { id: batch.id },
      data: {
        status: OemImportBatchStatus.COMPLETED,
        validRows: rows.length,
        createdRows,
        updatedRows,
        completedAt: new Date(),
        reportJson: { createdRows, updatedRows },
      },
    });
  } catch (error) {
    await prisma.oemImportBatch.update({
      where: { id: batch.id },
      data: {
        status: OemImportBatchStatus.FAILED,
        errorRows: rows.length,
        completedAt: new Date(),
        reportJson: {
          error: error instanceof Error ? error.message : String(error),
        },
      },
    });
    throw error;
  }
}

async function main() {
  const file = option('file');
  const content = file ? readFileSync(resolve(file)) : null;
  const rows = content
    ? parseOemCsv(content.toString('utf8'))
    : EMBEDDED_OEM_DATA;
  const checksum = createHash('sha256')
    .update(content ?? JSON.stringify(rows))
    .digest('hex');
  const errors = validateRows(rows);
  const report = {
    mode: process.argv.includes('--apply') ? 'apply' : 'plan',
    file: file ?? null,
    checksum,
    oemRecords: rows.length,
    aliases: 0,
    categoryMappings: rows.filter((row) => row.category).length,
    brandMappings: rows.filter((row) => row.brand).length,
    fitments: rows.filter((row) => row.model || row.generation).length,
    crossReferences: rows.filter((row) => row.external_part_number).length,
    sources:
      BUILTIN_OEM_SOURCE_COUNT +
      new Set(rows.map((row) => row.source_url).filter(Boolean)).size,
    duplicates: errors.filter((item) =>
      item.errors.some((error) => error.includes('duplicate')),
    ).length,
    validationErrors: errors,
  };
  console.log(JSON.stringify(report, null, 2));
  if (errors.length) throw new Error('OEM input failed validation');
  if (!process.argv.includes('--apply')) {
    console.log('Dry run complete. No database records were changed.');
    return;
  }
  if (!rows.length) {
    console.log('No production OEM rows prepared; apply is a no-op.');
    return;
  }
  const prisma = new PrismaClient();
  try {
    await applyRows(prisma, rows, file ? basename(file) : 'embedded', checksum);
    console.log('OEM import applied transactionally.');
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
