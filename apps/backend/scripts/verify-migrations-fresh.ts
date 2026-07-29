import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const sourceUrl = process.env.DATABASE_URL_TEST;
if (!sourceUrl) throw new Error('DATABASE_URL_TEST is required');

const source = new URL(sourceUrl);
if (!/test/i.test(source.pathname)) {
  throw new Error('DATABASE_URL_TEST database name must contain "test"');
}

const databaseName = `autostock_migration_verify_test_${randomBytes(4).toString('hex')}`;
const maintenanceUrl = new URL(source);
maintenanceUrl.pathname = '/postgres';
maintenanceUrl.searchParams.delete('schema');
const freshUrl = new URL(source);
freshUrl.pathname = `/${databaseName}`;
freshUrl.searchParams.delete('schema');

function run(
  command: string,
  args: string[],
  options: { databaseUrl?: string; allowExitCodeTwo?: boolean } = {},
) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      ...process.env,
      ...(options.databaseUrl ? { DATABASE_URL: options.databaseUrl } : {}),
    },
    shell: false,
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  const allowed =
    result.status === 0 ||
    (options.allowExitCodeTwo === true && result.status === 2);
  if (!allowed) {
    throw new Error(
      `${command} ${args.join(' ')} failed with exit code ${result.status}`,
    );
  }
  return result.status ?? 1;
}

const prismaCli = require.resolve('prisma/build/index.js');
const prisma = (args: string[], allowExitCodeTwo = false) =>
  run(process.execPath, [prismaCli, ...args], {
    databaseUrl: freshUrl.toString(),
    allowExitCodeTwo,
  });

try {
  run('createdb', [
    `--maintenance-db=${maintenanceUrl.toString()}`,
    databaseName,
  ]);
  prisma(['migrate', 'deploy', '--config', 'prisma.config.ts']);
  prisma(['migrate', 'status', '--config', 'prisma.config.ts']);
  prisma(['validate', '--config', 'prisma.config.ts']);
  prisma(['generate', '--config', 'prisma.config.ts']);
  const driftExit = prisma(
    [
      'migrate',
      'diff',
      '--from-url',
      freshUrl.toString(),
      '--to-schema-datamodel',
      'prisma/schema.prisma',
      '--exit-code',
    ],
    true,
  );
  if (driftExit === 2) {
    throw new Error('Fresh migration schema differs from schema.prisma');
  }
  process.stdout.write(
    `Fresh migration verification passed for temporary test database ${databaseName}\n`,
  );
} finally {
  run('dropdb', [
    '--if-exists',
    `--maintenance-db=${maintenanceUrl.toString()}`,
    databaseName,
  ]);
}
