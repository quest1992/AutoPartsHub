import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import * as XLSX from 'xlsx';
import { AppModule } from '../src/app.module';
import { createPartCatalogItem } from './helpers/create-part-catalog-item';

type ColumnMapping = {
  categoryColumn: string;
  nameColumn: string;
  priceColumn: string;
  quantityColumn: string;
  partNumberColumn?: string;
  storageLocationColumn?: string;
};

describe('Inventory import confirm (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let adminToken: string;
  let otherShopToken: string;
  let shopId: string;
  let otherShopId: string;
  let categoryId: string;
  let manualPartId: string;
  let existingItemId: string;
  let adminId: string;
  let otherUserId: string;

  const prefix = `e2e-import-${Date.now()}`;
  const categoryName = `${prefix}-category`;
  const standardMapping: ColumnMapping = {
    categoryColumn: 'Category',
    nameColumn: 'Name',
    priceColumn: 'Price',
    quantityColumn: 'Quantity',
    storageLocationColumn: 'Location',
  };

  const workbook = (rows: Array<Array<string | number>>) => {
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      book,
      XLSX.utils.aoa_to_sheet(rows),
      'Inventory',
    );
    return XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
  };

  const upload = (
    endpoint: 'preview' | 'confirm',
    token: string,
    targetShopId: string,
    file: Buffer,
    mapping: ColumnMapping,
  ) => {
    let call = request(app.getHttpServer())
      .post(`/inventory-import/${endpoint}`)
      .set('Authorization', `Bearer ${token}`)
      .field('shopId', targetShopId)
      .field('nameColumn', mapping.nameColumn)
      .field('priceColumn', mapping.priceColumn)
      .field('quantityColumn', mapping.quantityColumn);

    if (mapping.partNumberColumn) {
      call = call.field('partNumberColumn', mapping.partNumberColumn);
    }
    if (mapping.storageLocationColumn) {
      call = call.field(
        'storageLocationColumn',
        mapping.storageLocationColumn,
      );
    }

    return call.attach('file', file, 'inventory.xlsx');
  };

  beforeAll(async () => {
    prisma = new PrismaClient();
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    const [shop, otherShop, category] = await Promise.all([
      prisma.shop.create({ data: { name: `${prefix}-shop`, isActive: true } }),
      prisma.shop.create({
        data: { name: `${prefix}-other-shop`, isActive: true },
      }),
      prisma.partCategory.create({
        data: {
          name: categoryName,
          slug: categoryName,
          isActive: true,
        },
      }),
    ]);
    shopId = shop.id;
    otherShopId = otherShop.id;
    categoryId = category.id;

    const [exactPart, manualPart] = await Promise.all([
      createPartCatalogItem(prisma, {
        data: {
          internalCode: `${prefix}-exact`,
          name: 'Exact part',
          slug: `${prefix}-exact`,
          categoryId,
          isActive: true,
        },
      }),
      createPartCatalogItem(prisma, {
        data: {
          internalCode: `${prefix}-manual`,
          name: 'Manual part',
          slug: `${prefix}-manual`,
          categoryId,
          isActive: true,
        },
      }),
    ]);
    manualPartId = manualPart.id;
    existingItemId = (
      await prisma.shopInventoryItem.create({
        data: {
          shopId,
          partCatalogItemId: exactPart.id,
          price: 10,
          quantity: 7,
          location: 'Old location',
        },
      })
    ).id;

    const [admin, otherUser] = await Promise.all([
      prisma.user.create({
        data: {
          firstName: 'ImportAdmin',
          phone: `+994${String(Date.now()).slice(-9)}`,
          passwordHash: await bcrypt.hash('E2Epass123!', 12),
          role: UserRole.SUPER_ADMIN,
          isActive: true,
        },
      }),
      prisma.user.create({
        data: {
          firstName: 'ImportOtherShop',
          phone: `+995${String(Date.now()).slice(-9)}`,
          passwordHash: await bcrypt.hash('E2Epass123!', 12),
          role: UserRole.SHOP_OWNER,
          shopId: otherShopId,
          isActive: true,
        },
      }),
    ]);
    adminId = admin.id;
    otherUserId = otherUser.id;

    const [adminLogin, otherLogin] = await Promise.all([
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ phone: admin.phone, password: 'E2Epass123!' }),
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ phone: otherUser.phone, password: 'E2Epass123!' }),
    ]);
    adminToken = (adminLogin.body as { accessToken: string }).accessToken;
    otherShopToken = (otherLogin.body as { accessToken: string }).accessToken;
  });

  afterAll(async () => {
    const shopIds = [shopId, otherShopId].filter(Boolean);
    const userIds = [adminId, otherUserId].filter(Boolean);

    await prisma.inventoryMovement.deleteMany({
      where: { shopId: { in: shopIds } },
    });
    await prisma.inventoryImportJob.deleteMany({
      where: { shopId: { in: shopIds } },
    });
    await prisma.shopInventoryItem.deleteMany({
      where: { shopId: { in: shopIds } },
    });
    await prisma.partCatalogItem.deleteMany({
      where: { internalCode: { startsWith: prefix } },
    });
    await prisma.partCategory.deleteMany({ where: { id: categoryId } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.shop.deleteMany({ where: { id: { in: shopIds } } });
    await app.close();
    await prisma.$disconnect();
  });

  it('creates a new inventory item and INITIAL_BALANCE on an exact catalog match', async () => {
    await createPartCatalogItem(prisma, {
      data: {
        internalCode: `${prefix}-created`,
        name: 'Created part',
        slug: `${prefix}-created`,
        categoryId,
        isActive: true,
      },
    });
    const file = workbook([
      ['Category', 'Name', 'Price', 'Quantity', 'Location'],
      [categoryName, 'Created part', 120, 3, 'Row A'],
    ]);

    await upload(
      'preview',
      adminToken,
      shopId,
      file,
      standardMapping,
    ).expect(201);
    const confirmed = await upload(
      'confirm',
      adminToken,
      shopId,
      file,
      standardMapping,
    ).expect(201);

    expect((confirmed.body as { imported: number }).imported).toBe(1);
    const item = await prisma.shopInventoryItem.findFirstOrThrow({
      where: {
        shopId,
        partCatalogItem: { internalCode: `${prefix}-created` },
      },
    });
    expect(item.quantity).toBe(3);
    expect(
      await prisma.inventoryMovement.count({
        where: { inventoryItemId: item.id, type: 'INITIAL_BALANCE' },
      }),
    ).toBe(1);
  });

  it('creates an inventory item with explicitly mapped columns', async () => {
    const mapping: ColumnMapping = {
      categoryColumn: 'Category',
      nameColumn: 'Product label',
      priceColumn: 'Retail cost',
      quantityColumn: 'Stock count',
    };
    const file = workbook([
      ['Category', 'Product label', 'Retail cost', 'Stock count'],
      [categoryName, 'Manual part', 55, 2],
    ]);

    await upload('preview', adminToken, shopId, file, mapping).expect(201);
    const confirmed = await upload(
      'confirm',
      adminToken,
      shopId,
      file,
      mapping,
    ).expect(201);

    expect((confirmed.body as { imported: number }).imported).toBe(1);
    expect(
      await prisma.shopInventoryItem.count({
        where: { shopId, partCatalogItemId: manualPartId },
      }),
    ).toBe(1);
  });

  it('updates only price and location when quantity is unchanged', async () => {
    const file = workbook([
      ['Category', 'Name', 'Price', 'Quantity', 'Location'],
      [categoryName, 'Exact part', 99, 7, 'New location'],
    ]);

    const confirmed = await upload(
      'confirm',
      adminToken,
      shopId,
      file,
      standardMapping,
    ).expect(201);

    expect((confirmed.body as { updated: number }).updated).toBe(1);
    const item = await prisma.shopInventoryItem.findUniqueOrThrow({
      where: { id: existingItemId },
    });
    expect(item.price.toString()).toBe('99');
    expect(item.location).toBe('New location');
    expect(item.quantity).toBe(7);
    expect(
      await prisma.inventoryMovement.count({
        where: { inventoryItemId: existingItemId },
      }),
    ).toBe(0);
  });

  it('skips rows reported as invalid by preview', async () => {
    const file = workbook([
      ['Category', 'Name', 'Price', 'Quantity'],
      [categoryName, '', 25, 1],
    ]);
    const mapping = {
      ...standardMapping,
      storageLocationColumn: undefined,
    };

    const preview = await upload(
      'preview',
      adminToken,
      shopId,
      file,
      mapping,
    ).expect(201);
    expect(
      (preview.body as { summary: { invalidRows: number } }).summary
        .invalidRows,
    ).toBe(1);

    const confirmed = await upload(
      'confirm',
      adminToken,
      shopId,
      file,
      mapping,
    ).expect(201);
    const body = confirmed.body as { imported: number; skipped: number };
    expect(body.imported).toBe(0);
    expect(body.skipped).toBe(1);
  });

  it('reports the remaining batch rows as failed after a database error', async () => {
    await Promise.all([
      createPartCatalogItem(prisma, {
        data: {
          internalCode: `${prefix}-partial-good`,
          name: 'Partial good',
          slug: `${prefix}-partial-good`,
          categoryId,
          isActive: true,
        },
      }),
      createPartCatalogItem(prisma, {
        data: {
          internalCode: `${prefix}-partial-failing`,
          name: 'Partial failing',
          slug: `${prefix}-partial-failing`,
          categoryId,
          isActive: true,
        },
      }),
    ]);
    const file = workbook([
      ['Category', 'Name', 'Price', 'Quantity'],
      [categoryName, 'Partial failing', '99999999999999999999999999999999', 1],
      [categoryName, 'Partial good', 44, 2],
    ]);
    const mapping = {
      ...standardMapping,
      storageLocationColumn: undefined,
    };

    const confirmed = await upload(
      'confirm',
      adminToken,
      shopId,
      file,
      mapping,
    ).expect(201);
    const body = confirmed.body as {
      imported: number;
      failed: number;
      errors: Array<{ rowNumber: number; message: string }>;
    };
    expect(body.errors).toHaveLength(2);
    expect(body).toMatchObject({ imported: 0, failed: 2 });
    expect(
      await prisma.shopInventoryItem.count({
        where: {
          shopId,
          partCatalogItem: { internalCode: `${prefix}-partial-good` },
        },
      }),
    ).toBe(0);
  });

  it('forbids another shop and handles repeated confirmation without duplicates', async () => {
    const file = workbook([
      ['Category', 'Name', 'Price', 'Quantity'],
      [categoryName, 'Exact part', 10, 7],
    ]);
    const mapping = {
      ...standardMapping,
      storageLocationColumn: undefined,
    };

    await upload(
      'confirm',
      otherShopToken,
      shopId,
      file,
      mapping,
    ).expect(403);

    const first = await upload(
      'confirm',
      adminToken,
      shopId,
      file,
      mapping,
    ).expect(201);
    const repeated = await upload(
      'confirm',
      adminToken,
      shopId,
      file,
      mapping,
    ).expect(201);

    expect((first.body as { updated: number }).updated).toBe(1);
    expect((repeated.body as { updated: number }).updated).toBe(1);
    expect(
      await prisma.shopInventoryItem.count({
        where: { id: existingItemId },
      }),
    ).toBe(1);
  });
});
