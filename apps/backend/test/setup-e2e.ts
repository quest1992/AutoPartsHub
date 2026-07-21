import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL_TEST;

if (!databaseUrl) {
  throw new Error(
    'DATABASE_URL_TEST is required for E2E tests. DATABASE_URL is never used.',
  );
}

if (!/test/i.test(databaseUrl)) {
  throw new Error(
    'DATABASE_URL_TEST must point to a database whose name contains "test".',
  );
}

process.env.DATABASE_URL = databaseUrl;
