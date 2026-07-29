import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const applied = await prisma.$queryRaw<
    Array<{ migration_name: string; checksum: string }>
  >`
    SELECT migration_name, checksum
    FROM "_prisma_migrations"
    WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
    ORDER BY migration_name
  `;
  const mismatches: string[] = [];
  for (const migration of applied) {
    const sqlPath = resolve(
      process.cwd(),
      'prisma',
      'migrations',
      migration.migration_name,
      'migration.sql',
    );
    let sql: Buffer;
    try {
      sql = readFileSync(sqlPath);
    } catch {
      mismatches.push(`${migration.migration_name}: local SQL is missing`);
      continue;
    }
    const checksum = createHash('sha256').update(sql).digest('hex');
    if (checksum !== migration.checksum) {
      mismatches.push(`${migration.migration_name}: checksum mismatch`);
    }
  }
  if (mismatches.length > 0) {
    throw new Error(mismatches.join('\n'));
  }
  process.stdout.write(
    `Verified ${applied.length} applied migration checksums against local SQL\n`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
