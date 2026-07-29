import 'dotenv/config';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

type MigrationRow = { migration_name: string; checksum: string };

const root = resolve(process.cwd(), '..', '..');
const output = resolve(root, 'docs', 'WORKTREE_RELEASE_AUDIT.md');

function git(...args: string[]) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
}

function classify(path: string) {
  const normalized = path.replaceAll('\\', '/');
  if (normalized === 'apps/backend/prisma/schema.prisma')
    return ['Shared Prisma schema', 'All backend persistence modules', 'mixed'];
  if (normalized === 'apps/backend/src/app.module.ts')
    return ['Shared Nest registration', 'All new backend modules', 'mixed'];
  if (normalized === 'apps/frontend/lib/api.ts')
    return ['Shared frontend API', 'Catalog, ERP, taxonomy, vehicles', 'mixed'];
  if (normalized === 'apps/frontend/components/protected-layout.tsx')
    return ['Shared frontend navigation', 'All new frontend routes', 'mixed'];
  if (
    normalized.includes('part-taxonomy') ||
    normalized.includes('taxonomy-studio')
  )
    return [
      'Taxonomy Studio',
      'Prisma taxonomy models and catalog foundation',
      'taxonomy',
    ];
  if (
    normalized.includes('catalog') ||
    normalized.includes('part-categories') ||
    normalized.includes('part-numbers') ||
    normalized.includes('marketplace-search') ||
    normalized.includes('vin')
  )
    return [
      'Canonical catalog and BMS',
      'CatalogSearchService and Prisma catalog models',
      'catalog',
    ];
  if (
    normalized.includes('warehouse') ||
    normalized.includes('inventory') ||
    normalized.includes('stocktake') ||
    normalized.includes('transfer') ||
    normalized.includes('customer-order') ||
    normalized.includes('customers') ||
    normalized.includes('payment') ||
    normalized.includes('payout') ||
    normalized.includes('settlement') ||
    normalized.includes('finance') ||
    normalized.includes('purchase') ||
    normalized.includes('sales')
  )
    return [
      'ERP, warehouse and finance',
      'Prisma ERP models and shared inventory utilities',
      'erp',
    ];
  if (normalized.includes('vehicle'))
    return [
      'Vehicle database',
      'Vehicle Prisma models and catalog fitments',
      'vehicle',
    ];
  if (
    normalized.includes('/scripts/verify-') ||
    normalized.includes('backup-database') ||
    normalized.includes('capture-production') ||
    normalized.includes('MIGRATION_REPAIR_AUDIT')
  )
    return [
      'Migration safety tooling',
      'Prisma migrations and database access',
      'repair',
    ];
  if (normalized.includes('/prisma/migrations/'))
    return [
      'Database migration',
      'Ordered Prisma migration chain',
      'migration',
    ];
  if (normalized.includes('/frontend/'))
    return [
      'Frontend shared feature',
      'Frontend API and protected layout',
      'frontend',
    ];
  return [
    'Shared/project infrastructure',
    'Project build and module graph',
    'shared',
  ];
}

function proposedCommit(group: string) {
  return {
    erp: '1 — ERP, warehouse, finance and vehicle foundation',
    vehicle: '1 — ERP, warehouse, finance and vehicle foundation',
    catalog: '2 — canonical catalog and BMS foundation',
    repair: '3 — migration repair and verification tooling',
    migration: 'determined by migration dependency table',
    taxonomy: '4/5 — Taxonomy Studio backend/frontend',
    frontend: '5 — accumulated frontend feature integration',
    mixed: 'split by staged patch or merge dependent commits',
    shared: 'commit owning the dependent change',
  }[group];
}

async function migrationMap(url: string | undefined) {
  if (!url) return new Map<string, MigrationRow>();
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const rows = await prisma.$queryRaw<MigrationRow[]>`
      SELECT migration_name, checksum
      FROM "_prisma_migrations"
      WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
    `;
    return new Map(rows.map((row) => [row.migration_name, row]));
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const status = git('status', '--porcelain=v1', '-uall')
    .split(/\r?\n/)
    .filter(Boolean);
  const production = await migrationMap(process.env.DATABASE_URL);
  const test = await migrationMap(process.env.DATABASE_URL_TEST);
  const mismatches: string[] = [];

  const fileRows = status.map((line) => {
    const state = line.slice(0, 2);
    const path = line.slice(3).replace(/^"|"$/g, '');
    const [module, dependencies, group] = classify(path);
    const prod =
      path.includes('/prisma/migrations/') && production.has(path.split('/')[4])
        ? 'yes'
        : group === 'taxonomy' || group === 'erp' || group === 'catalog'
          ? 'schema/code may already be required'
          : 'no/directly unknown';
    const separable = group === 'mixed' ? 'no — hunk split required' : 'yes';
    const risk =
      group === 'mixed'
        ? 'high: cross-module shared file'
        : path.includes('/prisma/migrations/')
          ? 'high: immutable production history'
          : 'medium';
    return `| \`${path}\` | \`${state}\` | ${module} | Release implementation/test/tooling | ${dependencies} | ${prod} | ${proposedCommit(group)} | ${separable} | ${risk} |`;
  });

  const migrationPaths = git(
    'ls-files',
    '--others',
    '--exclude-standard',
    'apps/backend/prisma/migrations/*/migration.sql',
  )
    .split(/\r?\n/)
    .filter(Boolean);
  const migrationRows = migrationPaths.map((path) => {
    const name = basename(dirname(path));
    const sql = readFileSync(resolve(root, path));
    const checksum = createHash('sha256').update(sql).digest('hex');
    const prod = production.get(name);
    const testRow = test.get(name);
    if (prod && prod.checksum !== checksum)
      mismatches.push(`${name}: production checksum mismatch`);
    if (testRow && testRow.checksum !== checksum)
      mismatches.push(`${name}: test checksum mismatch`);
    const [, dependencies, group] = classify(path);
    const purpose = name.replace(/^\d+_/, '').replaceAll('_', ' ');
    return `| \`${name}\` | ${purpose} | ${prod ? 'yes, checksum matches' : 'no'} | ${testRow ? 'yes, checksum matches' : 'no'} | ${dependencies} | \`schema.prisma\` | ${proposedCommit(group)} |`;
  });

  if (mismatches.length) throw new Error(mismatches.join('\n'));

  const body = `# Worktree Release Audit

Generated at ${new Date().toISOString()} from branch \`${git('branch', '--show-current')}\`,
base \`${git('rev-parse', 'origin/master')}\`.

## Summary

- Changed/untracked files: ${status.length}
- Untracked migration SQL files: ${migrationPaths.length}
- Applied production migrations checked: ${production.size}
- Applied test migrations checked: ${test.size}
- Migration checksum mismatches: 0

## File inventory

| File | Git | Module | Purpose | Dependencies | Production already uses | Proposed commit | Auto-separable | Risk |
|---|---|---|---|---|---|---|---|---|
${fileRows.join('\n')}

## Migration inventory

| Migration | Purpose | Production record | Test record | Dependencies | Schema | Proposed commit |
|---|---|---|---|---|---|---|
${migrationRows.join('\n')}

## Mixed files

- \`apps/backend/prisma/schema.prisma\`: ERP, finance, warehouse, catalog, vehicle and Taxonomy Studio models/enums.
- \`apps/backend/src/app.module.ts\`: registrations for all accumulated backend modules.
- \`apps/frontend/lib/api.ts\`: API contracts for catalog, inventory, ERP, vehicles and Taxonomy Studio.
- \`apps/frontend/components/protected-layout.tsx\`: navigation for multiple accumulated features.

These files require index-only patch staging or consolidation of dependent commits.
`;
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, body, 'utf8');
  process.stdout.write(`${output}\n`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
