import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as XLSX from 'xlsx';
import { InventoryImportService } from './inventory-import.service';

const actor = {
  id: 'user-1',
  role: UserRole.SHOP_ADMIN,
  shopId: 'shop-1',
};

function buildWorkbook(rows: string[][]) {
  const worksheet = XLSX.utils.aoa_to_sheet([
    ['Артикул', 'Наименование', 'Цена', 'Остаток'],
    ...rows,
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Лист1');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

function createService(overrides: {
  match?: jest.Mock;
  inventoryFindFirst?: jest.Mock;
  inventoryFindMany?: jest.Mock;
  inventoryCreate?: jest.Mock;
  inventoryUpdate?: jest.Mock;
  movementCreate?: jest.Mock;
  jobCreate?: jest.Mock;
  jobUpdate?: jest.Mock;
  partCatalogFindUnique?: jest.Mock;
  transaction?: jest.Mock;
} = {}) {
  const tx = {
    shopInventoryItem: {
      findFirst: jest
        .fn()
        .mockImplementation(overrides.inventoryFindFirst ?? (async () => null)),
      findMany: jest
        .fn()
        .mockImplementation(overrides.inventoryFindMany ?? (async () => [])),
      create: jest
        .fn()
        .mockImplementation(
          overrides.inventoryCreate ??
            (async () => ({ id: 'inv-1', quantity: 5 })),
        ),
      update: jest
        .fn()
        .mockImplementation(overrides.inventoryUpdate ?? (async () => ({}))),
    },
    inventoryMovement: {
      create: jest
        .fn()
        .mockImplementation(overrides.movementCreate ?? (async () => ({}))),
    },
    partCatalogItem: {
      findUnique: jest
        .fn()
        .mockImplementation(
          overrides.partCatalogFindUnique ??
            (async () => ({ isActive: true, category: { isActive: true } })),
        ),
    },
  };

  const prisma = {
    inventoryImportJob: {
      create: jest
        .fn()
        .mockImplementation(
          overrides.jobCreate ??
            (async () => ({ id: 'job-1', shopId: 'shop-1' })),
        ),
      update: jest
        .fn()
        .mockImplementation(overrides.jobUpdate ?? (async () => ({}))),
    },
    $transaction: jest
      .fn()
      .mockImplementation(
        overrides.transaction ??
          (async (callback: (client: typeof tx) => Promise<void>) =>
            callback(tx)),
      ),
  };

  const matchingService = {
    match:
      overrides.match ??
      jest.fn().mockResolvedValue({
        matched: true,
        partCatalogItemId: 'catalog-1',
        method: 'OEM_EXACT',
        confidence: 1,
        requiresReview: false,
      }),
  };

  return {
    service: new InventoryImportService(prisma as never, matchingService as never),
    prisma,
    tx,
    matchingService,
  };
}

describe('InventoryImportService', () => {
  it('preview does not write to database', async () => {
    const { service, prisma } = createService();
    const buffer = buildWorkbook([
      ['04465-YZZR7', 'Колодки', '420', '8'],
    ]);

    await service.preview(
      { buffer, originalname: 'price.xlsx' },
      actor,
    );

    expect(prisma.inventoryImportJob.create).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('shop user cannot import for another shop', async () => {
    const { service } = createService();
    const buffer = buildWorkbook([
      ['04465-YZZR7', 'Колодки', '420', '8'],
    ]);

    await expect(
      service.confirm(
        { buffer, originalname: 'price.xlsx' },
        actor,
        'other-shop',
        {
          nameColumn: 'Наименование',
          priceColumn: 'Цена',
          quantityColumn: 'Остаток',
          partNumberColumn: 'Артикул',
        },
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('repeated import updates inventory instead of creating duplicates', async () => {
    const existing = {
      id: 'inv-existing',
      shopId: 'shop-1',
      quantity: 3,
      oemNumber: '04465-YZZR7',
      sku: null,
    };
    const { service, tx } = createService({
      inventoryFindFirst: jest.fn().mockResolvedValue(existing),
    });
    const buffer = buildWorkbook([
      ['04465-YZZR7', 'Колодки', '500', '10'],
      ['BAD', '', '-1', 'x'],
    ]);

    const result = await service.confirm(
      { buffer, originalname: 'price.xlsx' },
      actor,
      'shop-1',
      {
        nameColumn: 'Наименование',
        priceColumn: 'Цена',
        quantityColumn: 'Остаток',
        partNumberColumn: 'Артикул',
      },
    );

    expect(result.updated).toBe(1);
    expect(result.skipped).toBe(1);
    expect(tx.shopInventoryItem.create).not.toHaveBeenCalled();
    expect(tx.shopInventoryItem.update).toHaveBeenCalled();
  });

  it('invalid rows do not stop the whole import', async () => {
    const { service } = createService();
    const buffer = buildWorkbook([
      ['04465-YZZR7', '', '420', '8'],
      ['04465-YZZR7', 'Колодки', '420', '8'],
    ]);

    const result = await service.confirm(
      { buffer, originalname: 'price.xlsx' },
      actor,
      'shop-1',
      {
        nameColumn: 'Наименование',
        priceColumn: 'Цена',
        quantityColumn: 'Остаток',
        partNumberColumn: 'Артикул',
      },
    );

    expect(result.imported + result.updated + result.skipped).toBeGreaterThan(0);
    expect(result.skipped).toBeGreaterThanOrEqual(1);
  });

  it('requires mapping columns on confirm', async () => {
    const { service } = createService();
    const buffer = buildWorkbook([
      ['04465-YZZR7', 'Колодки', '420', '8'],
    ]);

    await expect(
      service.confirm(
        { buffer, originalname: 'price.xlsx' },
        actor,
        'shop-1',
        {
          nameColumn: '',
          priceColumn: 'Цена',
          quantityColumn: 'Остаток',
        },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
