import { NotFoundException } from '@nestjs/common';
import { ShopsService } from './shops.service';

describe('ShopsService', () => {
  const shop = { id: 'shop-id', name: 'Shop', isActive: true };
  const prisma = {
    shop: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  };
  const service = new ShopsService(prisma as never);
  beforeEach(() => jest.clearAllMocks());
  it('lists only active shops by default', async () => {
    prisma.shop.findMany.mockResolvedValue([]);
    await service.findAll();
    expect(prisma.shop.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  });
  it('lists active and inactive shops when requested', async () => {
    prisma.shop.findMany.mockResolvedValue([]);
    await service.findAll(true);
    expect(prisma.shop.findMany).toHaveBeenCalledWith({
      where: undefined,
      orderBy: { createdAt: 'desc' },
    });
  });
  it('returns shop or throws 404', async () => {
    prisma.shop.findUnique.mockResolvedValue(shop);
    await expect(service.findOne(shop.id)).resolves.toBe(shop);
    prisma.shop.findUnique.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
  it('updates an existing shop', async () => {
    prisma.shop.findUnique.mockResolvedValue(shop);
    prisma.shop.update.mockResolvedValue({ ...shop, name: 'New' });
    await expect(
      service.update(shop.id, { name: 'New' }),
    ).resolves.toMatchObject({ name: 'New' });
  });
  it('deactivates idempotently without deleting related data', async () => {
    prisma.shop.findUnique.mockResolvedValue(shop);
    prisma.shop.update.mockResolvedValue({ ...shop, isActive: false });
    await expect(service.deactivate(shop.id)).resolves.toMatchObject({
      isActive: false,
    });
    expect(prisma.shop.update).toHaveBeenCalledWith({
      where: { id: shop.id },
      data: { isActive: false },
    });
    prisma.shop.findUnique.mockResolvedValue({ ...shop, isActive: false });
    await expect(service.deactivate(shop.id)).resolves.toMatchObject({
      isActive: false,
    });
    expect(prisma.shop.update).toHaveBeenCalledTimes(1);
  });
});
