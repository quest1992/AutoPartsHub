import {
  isApplyMode,
  readMarketSnapshot,
  snapshotModelCount,
} from '../prisma/tajikistan-ev-market.shared';

describe('Tajikistan EV market production workflow', () => {
  it('uses dry-run unless --apply is explicit', () => {
    expect(isApplyMode([])).toBe(false);
    expect(isApplyMode(['--report-file'])).toBe(false);
    expect(isApplyMode(['--apply'])).toBe(true);
  });

  it('reads stable snapshot metadata and counts models', () => {
    const snapshot = readMarketSnapshot();

    expect(snapshot.sourceUrl).toContain('somon.tj');
    expect(snapshot.retrievedAt).toBe('2026-07-31T00:00:00+05:00');
    expect(snapshot.manufacturers.length).toBeGreaterThan(0);
    expect(snapshotModelCount(snapshot)).toBeGreaterThan(0);
  });
});
