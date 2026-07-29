import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL_TEST;
if (!databaseUrl || !/test/i.test(new URL(databaseUrl).pathname)) {
  throw new Error('DATABASE_URL_TEST must point to a test database');
}

const prisma = new PrismaClient({
  datasources: { db: { url: databaseUrl } },
});

async function main() {
  await prisma.$executeRawUnsafe(
    'DROP SCHEMA IF EXISTS taxonomy_empty_verify CASCADE',
  );
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
