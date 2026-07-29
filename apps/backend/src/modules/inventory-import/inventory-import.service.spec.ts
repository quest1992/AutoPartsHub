import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  InventoryImportStatus,
  PartPosition,
  PartSide,
  UserRole,
} from '@prisma/client';
import { InventoryImportService } from './inventory-import.service';

const actor = { id: 'user-1', role: UserRole.SHOP_ADMIN, shopId: 'shop-1' };
const previewRow = {
  rowNumber: 2,
  source: { name: 'Радиатор охлаждения', quantity: 5, salePrice: 850 },
  normalized: {
    name: 'Радиатор охлаждения',
    normalizedName: 'радиатор охлаждения',
    side: PartSide.NONE,
    position: PartPosition.NONE,
  },
  match: {
    status: 'EXACT' as const,
    catalogItemId: 'catalog-1',
    catalogItemName: 'Радиатор охлаждения',
  },
  validation: { status: 'VALID' as const, errors: [], warnings: [] },
};

function setup(sessionOverrides: Record<string, unknown> = {}) {
  const session = {
    id: 'session-1',
    shopId: 'shop-1',
    userId: 'user-1',
    status: InventoryImportStatus.PREVIEW,
    expiresAt: new Date(Date.now() + 60_000),
    previewData: [previewRow],
    ...sessionOverrides,
  };
  const tx = {
    partCatalogItem: {
      findFirst: jest.fn().mockResolvedValue({ id: 'catalog-1' }),
    },
    shopInventoryItem: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 'inventory-1' }),
      update: jest.fn(),
    },
    inventoryMovement: { create: jest.fn() },
  };
  const prisma = {
    shopWarehouse: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'warehouse-1',
          name: 'Основной склад',
          code: 'MAIN',
          isDefault: true,
        },
      ]),
    },
    inventoryImportSession: {
      create: jest.fn().mockResolvedValue({ id: 'session-1' }),
      findUnique: jest.fn().mockResolvedValue(session),
      update: jest.fn().mockResolvedValue({}),
    },
    $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  };
  const parser = {
    parse: jest
      .fn()
      .mockReturnValue([{ ...previewRow, errors: [], warnings: [] }]),
    createTemplate: jest.fn().mockReturnValue(Buffer.from('xlsx')),
  };
  const matcher = { match: jest.fn().mockResolvedValue(previewRow.match) };
  const warehouses = {
    resolve: jest
      .fn()
      .mockResolvedValue({ id: 'warehouse-1', name: 'Основной склад' }),
  };
  return {
    service: new InventoryImportService(
      prisma as never,
      parser as never,
      matcher as never,
      warehouses as never,
    ),
    prisma,
    parser,
    matcher,
    tx,
  };
}

describe('InventoryImportService', () => {
  it('creates a 24-hour preview session', async () => {
    const { service, prisma } = setup();
    const result = await service.preview(
      { buffer: Buffer.from('xlsx'), originalname: 'stock.xlsx' },
      actor,
    );
    expect(result.importSessionId).toBe('session-1');
    expect(prisma.inventoryImportSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: InventoryImportStatus.PREVIEW,
          totalRows: 1,
        }),
      }),
    );
  });

  it('does not allow another user to access a session', async () => {
    const { service } = setup({ userId: 'another-user' });
    await expect(
      service.confirm('session-1', { mode: 'ADD_QUANTITY', rows: [] }, actor),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('does not import a selected row without catalogItemId', async () => {
    const { service, tx } = setup();
    const result = await service.confirm(
      'session-1',
      {
        mode: 'ADD_QUANTITY',
        rows: [{ rowNumber: 2, include: true, quantity: 5, salePrice: 850 }],
      },
      actor,
    );
    expect(result.summary.skipped).toBe(1);
    expect(tx.shopInventoryItem.create).not.toHaveBeenCalled();
  });

  it('creates only a selected row with a catalog item', async () => {
    const { service, tx } = setup();
    const result = await service.confirm(
      'session-1',
      {
        mode: 'ADD_QUANTITY',
        rows: [
          {
            rowNumber: 2,
            include: true,
            catalogItemId: 'catalog-1',
            quantity: 5,
            salePrice: 850,
          },
        ],
      },
      actor,
    );
    expect(result.summary.imported).toBe(1);
    expect(tx.shopInventoryItem.create).toHaveBeenCalled();
  });

  it('rejects repeated confirmation', async () => {
    const { service } = setup({ status: InventoryImportStatus.COMPLETED });
    await expect(
      service.confirm('session-1', { mode: 'ADD_QUANTITY', rows: [] }, actor),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects an expired session', async () => {
    const { service } = setup({ expiresAt: new Date(Date.now() - 1) });
    await expect(
      service.confirm('session-1', { mode: 'ADD_QUANTITY', rows: [] }, actor),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
