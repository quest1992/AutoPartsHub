import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const MARKET_TITLE = 'TAJIKISTAN EV MARKET';
export const SOURCE_LICENSE =
  'Reference-only marketplace taxonomy; no listing content redistributed';
export const IMPORT_PURPOSE =
  'Market coverage reference for vehicle manufacturers, models and aliases';
export const SNAPSHOT_FILE = join(
  __dirname,
  'data',
  'tajikistan-ev-market',
  'somon-2026-07-31.json',
);

export type MarketSnapshot = {
  sourceUrl: string;
  retrievedAt: string;
  purpose: string;
  manufacturers: Array<{
    manufacturer: string;
    sourceUrl: string;
    listingCount: number;
    models: string[];
  }>;
};

export type MarketSummary = {
  manufacturers: number;
  modelsFound: number;
  existing: number;
  added: number;
  aliases: number;
  skipped: number;
  manualReview: number;
  durationMs: number;
  mode: 'plan' | 'apply';
};

export function isApplyMode(args = process.argv.slice(2)) {
  return args.includes('--apply');
}

export function readMarketSnapshot(): MarketSnapshot {
  return JSON.parse(
    readFileSync(SNAPSHOT_FILE, 'utf8').replace(/^\uFEFF/, ''),
  ) as MarketSnapshot;
}

export function snapshotModelCount(snapshot: MarketSnapshot) {
  return snapshot.manufacturers.reduce(
    (total, manufacturer) => total + manufacturer.models.length,
    0,
  );
}

export function printSnapshotMetadata(snapshot: MarketSnapshot) {
  console.log(`Snapshot file: ${SNAPSHOT_FILE}`);
  console.log(`Retrieved date: ${snapshot.retrievedAt}`);
  console.log(`Manufacturer count: ${snapshot.manufacturers.length}`);
  console.log(`Model count: ${snapshotModelCount(snapshot)}`);
}

export function printLicenseNotice(snapshot: MarketSnapshot) {
  console.log('');
  console.log('IMPORT LICENSE CHECK');
  console.log(`Source: ${snapshot.sourceUrl}`);
  console.log(`License: ${SOURCE_LICENSE}`);
  console.log(`Purpose: ${IMPORT_PURPOSE}`);
  console.log('Imported data: manufacturers, models and aliases only.');
  console.log(
    'Excluded data: listings, prices, photos, phone numbers and seller descriptions.',
  );
}

export function printMarketSummary(summary: MarketSummary) {
  const separator = '='.repeat(36);
  console.log('');
  console.log(separator);
  console.log(MARKET_TITLE);
  console.log(separator);
  console.log(`Manufacturers: ${summary.manufacturers}`);
  console.log(`Models found: ${summary.modelsFound}`);
  console.log(`Existing: ${summary.existing}`);
  console.log(`Added: ${summary.added}`);
  console.log(`Aliases: ${summary.aliases}`);
  console.log(`Skipped: ${summary.skipped}`);
  console.log(`Manual review: ${summary.manualReview}`);
  console.log(`Duration: ${summary.durationMs} ms`);
  console.log(`Mode: ${summary.mode}`);
  console.log(separator);
}
