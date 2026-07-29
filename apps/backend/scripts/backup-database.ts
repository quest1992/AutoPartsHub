import 'dotenv/config';
import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is not configured');

const url = new URL(databaseUrl);
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDirectory = resolve(process.cwd(), '..', '..', 'backups');
const backupPath = join(
  backupDirectory,
  `autostock-before-taxonomy-production-${timestamp}.dump`,
);
mkdirSync(backupDirectory, { recursive: true });

const result = spawnSync(
  'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe',
  [
    '--format=custom',
    '--no-owner',
    '--no-privileges',
    '--host',
    url.hostname,
    '--port',
    url.port || '5432',
    '--username',
    decodeURIComponent(url.username),
    '--file',
    backupPath,
    url.pathname.replace(/^\/+/, ''),
  ],
  {
    encoding: 'utf8',
    env: {
      ...process.env,
      PGPASSWORD: decodeURIComponent(url.password),
    },
  },
);

if (result.status !== 0) {
  throw new Error(result.stderr || `pg_dump exited with ${result.status}`);
}

console.log(backupPath);
