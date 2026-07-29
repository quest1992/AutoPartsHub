import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL_TEST;
if (!databaseUrl) throw new Error('DATABASE_URL_TEST is required');
const databaseName = new URL(databaseUrl).pathname.replace(/^\/+/, '').split('/')[0];
if (!/test/i.test(databaseName)) {
  throw new Error('DATABASE_URL_TEST database name must contain "test"');
}

const env = { ...process.env, DATABASE_URL: databaseUrl };
const prismaCli = require.resolve('prisma/build/index.js');

function prisma(args: string[]) {
  const result = spawnSync(process.execPath, [prismaCli, ...args], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    throw new Error(`Prisma ${args.join(' ')} failed with ${result.status}`);
  }
}

async function main() {
  const client = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const rows = await client.$queryRawUnsafe<
    Array<{ migration_name: string; finished_at: Date | null; rolled_back_at: Date | null }>
  >(
    `SELECT migration_name, finished_at, rolled_back_at
     FROM "_prisma_migrations"
     WHERE migration_name IN ($1, $2)`,
    '20260728165224_add_customer_orders_and_reservations',
    '20260728210000_add_shop_warehouses',
  );
  await client.$disconnect();

  const warehouse = rows.find(
    (row) => row.migration_name === '20260728210000_add_shop_warehouses',
  );
  if (!warehouse?.finished_at) {
    prisma([
      'db',
      'execute',
      '--file',
      resolve(
        'prisma/migrations/20260728210000_add_shop_warehouses/migration.sql',
      ),
      '--schema',
      'prisma/schema.prisma',
    ]);
    prisma([
      'migrate',
      'resolve',
      '--applied',
      '20260728210000_add_shop_warehouses',
      '--config',
      'prisma.config.ts',
    ]);
  }

  const failedCustomerOrder = rows.find(
    (row) =>
      row.migration_name ===
        '20260728165224_add_customer_orders_and_reservations' &&
      !row.finished_at &&
      !row.rolled_back_at,
  );
  if (failedCustomerOrder) {
    prisma([
      'migrate',
      'resolve',
      '--rolled-back',
      failedCustomerOrder.migration_name,
      '--config',
      'prisma.config.ts',
    ]);
  }

  prisma(['migrate', 'deploy', '--config', 'prisma.config.ts']);
  prisma(['migrate', 'status', '--config', 'prisma.config.ts']);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
