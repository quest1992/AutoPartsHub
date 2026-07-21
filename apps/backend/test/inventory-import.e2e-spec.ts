import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Inventory import commit (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let adminToken: string;
  let otherShopToken: string;
  let shopId: string;
  let otherShopId: string;
  let categoryId: string;
  let exactPartId: string;
  let manualPartId: string;
  let existingItemId: string;
  let adminId: string;
  let otherUserId: string;
  const prefix = `e2e-import-${Date.now()}`;

  const preview = async (csv: string) => {
    const response = await request(app.getHttpServer())
      .post('/inventory-import/preview')
      .set('Authorization', `Bearer ${adminToken}`)
      .field('shopId', shopId)
      .attach('file', Buffer.from(csv), 'import.csv')
      .expect(201);
    return response.body as {
      previewToken: string;
      rows: Array<{ rowNumber: number }>;
    };
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
          name: `${prefix}-category`,
          slug: `${prefix}-category`,
          isActive: true,
        },
      }),
    ]);
    shopId = shop.id;
    otherShopId = otherShop.id;
    categoryId = category.id;
    const [admin, otherUser] = await Promise.all([
      prisma.user.create({
        data: {
          firstName: 'Import',
          phone: `+992${String(Date.now()).slice(-9)}`,
          passwordHash: await bcrypt.hash('E2Epass123!', 12),
          role: UserRole.SUPER_ADMIN,
          isActive: true,
        },
      }),
      prisma.user.create({
        data: {
          firstName: 'Other',
          phone: `+993${String(Date.now()).slice(-9)}`,
          passwordHash: await bcrypt.hash('E2Epass123!', 12),
          role: UserRole.SHOP_OWNER,
          shopId: otherShop.id,
          isActive: true,
        },
      }),
    ]);
    const [exactPart, manualPart] = await Promise.all([
      prisma.partCatalogItem.create({
        data: {
          internalCode: `${prefix}-exact`,
          name: 'Exact part',
          slug: `${prefix}-exact`,
          categoryId,
          isActive: true,
        },
      }),
      prisma.partCatalogItem.create({
        data: {
          internalCode: `${prefix}-manual`,
          name: 'Manual part',
          slug: `${prefix}-manual`,
          categoryId,
          isActive: true,
        },
      }),
    ]);
    adminId = admin.id;
    otherUserId = otherUser.id;
    exactPartId = exactPart.id;
    manualPartId = manualPart.id;
    const existing = await prisma.shopInventoryItem.create({
      data: {
        shopId,
        partCatalogItemId: exactPartId,
        price: 10,
        quantity: 7,
        location: 'Старое место',
        isActive: true,
      },
    });
    existingItemId = existing.id;
    const [adminLogin, otherLogin] = await Promise.all([
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ phone: admin.phone, password: 'E2Epass123!' }),
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ phone: otherUser.phone, password: 'E2Epass123!' }),
    ]);
    const adminBody = adminLogin.body as { accessToken: string };
    const otherBody = otherLogin.body as { accessToken: string };
    adminToken = adminBody.accessToken;
    otherShopToken = otherBody.accessToken;
  });

  afterAll(async () => {
    await prisma.inventoryMovement.deleteMany({
      where: { shopId: { in: [shopId, otherShopId] } },
    });
    await prisma.shopInventoryItem.deleteMany({
      where: { shopId: { in: [shopId, otherShopId] } },
    });
    await prisma.partCatalogItem.deleteMany({
      where: { internalCode: { startsWith: prefix } },
    });
    await prisma.partCategory.deleteMany({ where: { id: categoryId } });
    await prisma.user.deleteMany({
      where: { id: { in: [adminId, otherUserId] } },
    });
    await prisma.shop.deleteMany({
      where: { id: { in: [shopId, otherShopId] } },
    });
    await app.close();
    await prisma.$disconnect();
  });

  it('creates a new item and INITIAL_BALANCE from an exact catalog match', async () => {
    const code = `${prefix}-created`;
    await prisma.partCatalogItem.create({
      data: {
        internalCode: code,
        name: 'Created part',
        slug: `${prefix}-created`,
        categoryId,
        isActive: true,
      },
    });
    const checked = await preview(
      `Внутренний код,Наименование,Цена,Количество,Место хранения\n${code},Created part,120,3,Ряд A`,
    );
    const committed = await request(app.getHttpServer())
      .post('/inventory-import/commit')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        previewToken: checked.previewToken,
        mode: 'CREATE_ONLY',
        manualMappings: [],
      })
      .expect(201);
    expect((committed.body as { created: number }).created).toBe(1);
    const item = await prisma.shopInventoryItem.findFirstOrThrow({
      where: { shopId, partCatalogItem: { internalCode: code } },
    });
    expect(item.quantity).toBe(3);
    expect(
      await prisma.inventoryMovement.count({
        where: { inventoryItemId: item.id, type: 'INITIAL_BALANCE' },
      }),
    ).toBe(1);
  });

  it('creates an item from a manual catalog mapping', async () => {
    const checked = await preview(
      `Внутренний код,Наименование,Цена,Количество\nUNKNOWN-MANUAL,Unknown,55,2`,
    );
    const rowNumber = checked.rows[0].rowNumber;
    await request(app.getHttpServer())
      .post('/inventory-import/commit')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        previewToken: checked.previewToken,
        mode: 'CREATE_ONLY',
        manualMappings: [{ rowNumber, partCatalogItemId: manualPartId }],
      })
      .expect(201);
    expect(
      await prisma.shopInventoryItem.count({
        where: { shopId, partCatalogItemId: manualPartId },
      }),
    ).toBe(1);
  });

  it('updates only price and location of an existing item', async () => {
    const checked = await preview(
      `Внутренний код,Наименование,Цена,Количество,Место хранения\n${prefix}-exact,Exact part,99,500,Новое место`,
    );
    await request(app.getHttpServer())
      .post('/inventory-import/commit')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        previewToken: checked.previewToken,
        mode: 'UPDATE_PRICE_AND_LOCATION',
        manualMappings: [],
      })
      .expect(201);
    const item = await prisma.shopInventoryItem.findUniqueOrThrow({
      where: { id: existingItemId },
    });
    expect(item.price.toString()).toBe('99');
    expect(item.location).toBe('Новое место');
    expect(item.quantity).toBe(7);
    expect(
      await prisma.inventoryMovement.count({
        where: { inventoryItemId: existingItemId },
      }),
    ).toBe(0);
  });

  it('skips rows with Preview errors without creating inventory', async () => {
    const checked = await preview(
      `Внутренний код,Наименование,Цена,Количество\n${prefix}-error,,25,1`,
    );
    const committed = await request(app.getHttpServer())
      .post('/inventory-import/commit')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        previewToken: checked.previewToken,
        mode: 'CREATE_ONLY',
        manualMappings: [],
      })
      .expect(201);
    const body = committed.body as { created: number; skipped: number };
    expect(body.created).toBe(0);
    expect(body.skipped).toBe(1);
    expect(
      await prisma.shopInventoryItem.count({
        where: { shopId, sku: `${prefix}-error` },
      }),
    ).toBe(0);
  });

  it('continues importing valid rows when one row fails during commit', async () => {
    const goodCode = `${prefix}-partial-good`;
    const failingCode = `${prefix}-partial-failing`;
    await Promise.all([
      prisma.partCatalogItem.create({
        data: {
          internalCode: goodCode,
          name: 'Partial good',
          slug: goodCode,
          categoryId,
          isActive: true,
        },
      }),
      prisma.partCatalogItem.create({
        data: {
          internalCode: failingCode,
          name: 'Partial failing',
          slug: failingCode,
          categoryId,
          isActive: true,
        },
      }),
    ]);
    const checked = await preview(
      `Внутренний код,Наименование,Цена,Количество\n${failingCode},Partial failing,99999999999999999999999999999999,1\n${goodCode},Partial good,44,2`,
    );
    const committed = await request(app.getHttpServer())
      .post('/inventory-import/commit')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        previewToken: checked.previewToken,
        mode: 'CREATE_ONLY',
        manualMappings: [],
      })
      .expect(201);
    const body = committed.body as { created: number; failed: number };
    expect(body.created).toBe(1);
    expect(body.failed).toBe(1);
    expect(
      await prisma.shopInventoryItem.count({
        where: { shopId, partCatalogItem: { internalCode: goodCode } },
      }),
    ).toBe(1);
  });

  it('prevents cross-shop use and repeated commit', async () => {
    const checked = await preview(
      `Внутренний код,Наименование,Цена,Количество\n${prefix}-exact,Exact part,10,1`,
    );
    await request(app.getHttpServer())
      .post('/inventory-import/commit')
      .set('Authorization', `Bearer ${otherShopToken}`)
      .send({
        previewToken: checked.previewToken,
        mode: 'SKIP_EXISTING',
        manualMappings: [],
      })
      .expect(403);
    await request(app.getHttpServer())
      .post('/inventory-import/commit')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        previewToken: checked.previewToken,
        mode: 'SKIP_EXISTING',
        manualMappings: [],
      })
      .expect(201);
    await request(app.getHttpServer())
      .post('/inventory-import/commit')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        previewToken: checked.previewToken,
        mode: 'SKIP_EXISTING',
        manualMappings: [],
      })
      .expect(409);
  });
});
