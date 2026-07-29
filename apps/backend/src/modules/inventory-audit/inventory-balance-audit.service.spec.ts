import { InventoryBalanceAuditService } from './inventory-balance-audit.service';
function setup(
  quantity: number,
  changes: number[],
  reservedQuantity = 0,
  activeReserved = 0,
) {
  const prisma = {
    shopInventoryItem: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'item',
          shopId: 'shop',
          warehouseId: 'warehouse',
          quantity,
          reservedQuantity,
          partCatalogItem: { name: 'Фара' },
          warehouse: { name: 'Основной' },
          movements: changes.map((change) => ({ change })),
        },
      ]),
      count: jest.fn().mockResolvedValue(0),
    },
    customerOrderItem: {
      groupBy: jest
        .fn()
        .mockResolvedValue(
          activeReserved
            ? [{ inventoryItemId: 'item', _sum: { quantity: activeReserved } }]
            : [],
        ),
    },
    customerOrder: { count: jest.fn().mockResolvedValue(0) },
    inventoryMovement: { count: jest.fn().mockResolvedValue(0) },
    $queryRaw: jest.fn().mockResolvedValue([{ count: 0n }]),
  };
  return { service: new InventoryBalanceAuditService(prisma as never), prisma };
}
describe('InventoryBalanceAuditService', () => {
  it('reports a matching movement balance', async () => {
    const { service } = setup(5, [8, -3]);
    const result = await service.audit({ page: 1, limit: 20 });
    expect(result.summary.matched).toBe(1);
    expect(result.rows[0].status).toBe('OK');
  });
  it('detects a movement mismatch', async () => {
    const { service } = setup(5, [2]);
    const result = await service.audit({ page: 1, limit: 20 });
    expect(result.summary.mismatched).toBe(1);
    expect(result.rows[0].difference).toBe(3);
  });
  it('detects a reservation mismatch', async () => {
    const { service } = setup(5, [5], 2, 1);
    const result = await service.audit({ page: 1, limit: 20 });
    expect(result.reservationSummary.reservationMismatches).toBe(1);
    expect(result.rows[0].reservationDifference).toBe(1);
  });
  it('accepts matching reservations', async () => {
    const { service } = setup(5, [5], 2, 2);
    const result = await service.audit({ page: 1, limit: 20 });
    expect(result.reservationSummary.reservationMismatches).toBe(0);
  });
  it('is read-only', async () => {
    const { service, prisma } = setup(1, [1]);
    await service.audit({ page: 1, limit: 20 });
    expect(Object.keys(prisma.shopInventoryItem)).not.toContain('update');
  });
});
