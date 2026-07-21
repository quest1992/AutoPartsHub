import { PrismaClient } from '@prisma/client';
import {
  getPartNameSearchTokens,
  normalizePartName,
} from '../src/common/utils/part-name-normalizer';

function ensureLocalDevelopmentDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required');

  const url = new URL(databaseUrl);
  const databaseName = url.pathname.replace(/^\/+/, '').split('/')[0];
  const isLocal = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);

  const isTestDatabase = /test/i.test(databaseName);

  if (
    !isLocal ||
    /prod/i.test(databaseName) ||
    (isTestDatabase && process.env.ALLOW_TEST_BACKFILL !== 'true')
  ) {
    throw new Error(
      'Backfill is allowed only for a local development database, or a test database with ALLOW_TEST_BACKFILL=true',
    );
  }

  return databaseName;
}

async function main() {
  const databaseName = ensureLocalDevelopmentDatabase();
  const prisma = new PrismaClient();

  try {
    const parts = await prisma.partCatalogItem.findMany({
      select: { id: true, name: true },
    });

    for (const part of parts) {
      await prisma.partCatalogItem.update({
        where: { id: part.id },
        data: {
          normalizedName: normalizePartName(part.name),
          searchTokens: getPartNameSearchTokens(part.name),
        },
      });
    }

    console.log(
      `Backfilled normalization for ${parts.length} PartCatalogItem record(s) in ${databaseName}.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main();
