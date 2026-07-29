import { ConflictException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ShopWarehousesService } from './shop-warehouses.service';
const actor = { id: 'user', role: UserRole.SHOP_ADMIN, shopId: 'shop-1' };
function setup() {
  const tx = {
    shopWarehouse: {
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue(null),
      updateMany: jest.fn(),
      create: jest.fn().mockResolvedValue({ id: 'w1', isDefault: true }),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn(),
    },
  };
  const prisma = {
    shopWarehouse: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: tx.shopWarehouse.count,
      update: tx.shopWarehouse.update,
      delete: tx.shopWarehouse.delete,
    },
    $transaction: jest.fn((fn: (arg: typeof tx) => unknown) => fn(tx)),
  };
  return { service: new ShopWarehousesService(prisma as never), prisma, tx };
}
describe('ShopWarehousesService', () => {
  it('makes the first warehouse default', async () => {
    const { service, tx } = setup();
    await service.create({ name: 'Первый' }, actor);
    expect(tx.shopWarehouse.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isDefault: true }),
      }),
    );
  });
  it('hides another shop warehouse', async () => {
    const { service, prisma } = setup();
    prisma.shopWarehouse.findUnique.mockResolvedValue({
      id: 'w',
      shopId: 'other',
      _count: { inventoryItems: 0 },
    });
    await expect(service.one('w', actor)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
  it('does not delete a warehouse containing inventory', async () => {
    const { service, prisma } = setup();
    prisma.shopWarehouse.findUnique.mockResolvedValue({
      id: 'w',
      shopId: 'shop-1',
      isActive: true,
      _count: { inventoryItems: 2 },
    });
    await expect(service.remove('w', actor)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
  it('does not deactivate the only active warehouse', async () => {
    const { service, prisma } = setup();
    prisma.shopWarehouse.findUnique.mockResolvedValue({
      id: 'w',
      shopId: 'shop-1',
      isActive: true,
      isDefault: false,
      _count: { inventoryItems: 0 },
    });
    prisma.shopWarehouse.count.mockResolvedValue(1);
    await expect(service.deactivate('w', actor)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
  it('clears the previous default in the same transaction', async () => {
    const { service, prisma, tx } = setup();
    prisma.shopWarehouse.findUnique.mockResolvedValue({
      id: 'w2',
      shopId: 'shop-1',
      _count: { inventoryItems: 0 },
    });
    await service.setDefault('w2', actor);
    expect(tx.shopWarehouse.updateMany).toHaveBeenCalledWith({
      where: { shopId: 'shop-1', isDefault: true },
      data: { isDefault: false },
    });
  });
});
