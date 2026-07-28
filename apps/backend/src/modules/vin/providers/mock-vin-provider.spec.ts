import { NotFoundException } from '@nestjs/common';
import { MockVinProvider } from './mock-vin-provider';

describe('MockVinProvider (unit)', () => {
  const provider = new MockVinProvider();

  it('returns a normalized deterministic result for a valid fixture VIN', async () => {
    const first = await provider.decode('4t1g11ak0mu001001');
    const second = await provider.decode('4T1G11AK0MU001001');
    expect(first.vin).toBe('4T1G11AK0MU001001');
    expect(first.manufacturer).toBe('Toyota');
    expect(second).toMatchObject({
      vin: first.vin,
      manufacturer: first.manufacturer,
      model: first.model,
      engineCode: first.engineCode,
    });
  });

  it('rejects a valid-format VIN outside the mock dataset', async () => {
    await expect(provider.decode('1HGCM82633A999999')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('reports healthy mock infrastructure', async () => {
    await expect(provider.health()).resolves.toEqual({
      available: true,
      provider: 'MOCK',
    });
  });
});
