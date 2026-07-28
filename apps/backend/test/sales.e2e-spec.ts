import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { createPartCatalogItem } from './helpers/create-part-catalog-item';

describe('Sales (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let token: string;
  let shopId: string;
  let inventoryItemId: string;
  let saleId: string;
  let createdAdminId: string;
  let sellerToken: string;
  let viewerToken: string;
  let otherToken: string;
  let otherShopId: string;
  const userIds: string[] = [];
  const prefix = `e2e-sales-${Date.now()}`;

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
    const shop = await prisma.shop.create({
      data: { name: `${prefix}-shop`, isActive: true },
    });
    shopId = shop.id;
    const admin = await prisma.user.create({
      data: {
        firstName: 'E2E',
        phone: `+992${String(Date.now()).slice(-9)}`,
        passwordHash: await bcrypt.hash('E2Epass123!', 12),
        role: UserRole.SUPER_ADMIN,
        isActive: true,
      },
    });
    createdAdminId = admin.id;
    const otherShop = await prisma.shop.create({
      data: { name: `${prefix}-other-shop` },
    });
    otherShopId = otherShop.id;
    for (const [role, targetShop] of [
      [UserRole.SELLER, shopId],
      [UserRole.VIEWER, shopId],
      [UserRole.VIEWER, otherShopId],
    ] as const) {
      const user = await prisma.user.create({
        data: {
          firstName: role,
          phone: `+992${String(Date.now() + userIds.length + 10).slice(-9)}`,
          passwordHash: await bcrypt.hash('E2Epass123!', 12),
          role,
          shopId: targetShop,
        },
      });
      userIds.push(user.id);
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ phone: user.phone, password: 'E2Epass123!' })
        .expect(201);
      if (role === UserRole.SELLER) sellerToken = response.body.accessToken;
      else if (targetShop === shopId) viewerToken = response.body.accessToken;
      else otherToken = response.body.accessToken;
    }
    const manufacturer = await prisma.manufacturer.create({
      data: {
        name: `${prefix}-manufacturer`,
        slug: `${prefix}-manufacturer`,
        isActive: true,
      },
    });
    const model = await prisma.vehicleModel.create({
      data: {
        name: `${prefix}-model`,
        slug: `${prefix}-model`,
        manufacturerId: manufacturer.id,
        isActive: true,
      },
    });
    await prisma.vehicleGeneration.create({
      data: {
        name: `${prefix}-generation`,
        slug: `${prefix}-generation`,
        vehicleModelId: model.id,
        isActive: true,
      },
    });
    const category = await prisma.partCategory.create({
      data: {
        name: `${prefix}-category`,
        slug: `${prefix}-category`,
        isActive: true,
      },
    });
    const part = await createPartCatalogItem(prisma, {
      data: {
        internalCode: `${prefix}-part`,
        name: `${prefix}-part`,
        slug: `${prefix}-part`,
        categoryId: category.id,
        isActive: true,
      },
    });
    const inventory = await prisma.shopInventoryItem.create({
      data: {
        shopId,
        partCatalogItemId: part.id,
        price: 100,
        currency: 'TJS',
        quantity: 2,
        isActive: true,
      },
    });
    inventoryItemId = inventory.id;
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone: admin.phone, password: 'E2Epass123!' })
      .expect(201);
    token = login.body.accessToken;
  });

  afterAll(async () => {
    const shopIds = [shopId, otherShopId].filter(Boolean);
    await prisma.inventoryMovement.deleteMany({ where: { shopId } });
    await prisma.saleItem.deleteMany({ where: { sale: { shopId } } });
    await prisma.sale.deleteMany({ where: { shopId } });
    await prisma.shopInventoryItem.deleteMany({ where: { shopId } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.shop.deleteMany({
      where: { id: { in: shopIds } },
    });
    await prisma.partCatalogItem.deleteMany({
      where: { internalCode: `${prefix}-part` },
    });
    await prisma.partCategory.deleteMany({
      where: { slug: `${prefix}-category` },
    });
    await prisma.vehicleGeneration.deleteMany({
      where: { slug: `${prefix}-generation` },
    });
    await prisma.vehicleModel.deleteMany({
      where: { slug: `${prefix}-model` },
    });
    await prisma.manufacturer.deleteMany({
      where: { slug: `${prefix}-manufacturer` },
    });
    await prisma.user.delete({ where: { id: createdAdminId } });
    await app.close();
    await prisma.$disconnect();
  });

  it('authenticates admin and rejects anonymous sales', async () => {
    await request(app.getHttpServer()).get('/sales').expect(401);
  });

  it('creates, reads and cancels a sale with movements', async () => {
    const create = await request(app.getHttpServer())
      .post('/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({
        shopId,
        customerName: 'E2E customer',
        customerPhone: '+992900000002',
        notes: 'E2E note',
        discount: 0,
        items: [{ inventoryItemId, quantity: 1 }],
      })
      .expect(201);
    saleId = create.body.id;
    expect(create.body.status).toBe('COMPLETED');
    const sale = await prisma.sale.findUniqueOrThrow({
      where: { id: saleId },
      include: { items: true },
    });
    expect(sale.customerName).toBe('E2E customer');
    expect(sale.customerPhone).toBe('+992900000002');
    expect(sale.notes).toBe('E2E note');
    expect(sale.items).toHaveLength(1);
    expect(
      (
        await prisma.shopInventoryItem.findUniqueOrThrow({
          where: { id: inventoryItemId },
        })
      ).quantity,
    ).toBe(1);
    expect(
      await prisma.inventoryMovement.count({
        where: { inventoryItemId, type: 'SALE' },
      }),
    ).toBe(1);
    await request(app.getHttpServer())
      .get('/sales')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const detail = await request(app.getHttpServer())
      .get(`/sales/${saleId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(detail.body.user.passwordHash).toBeUndefined();
    expect(detail.body.cancelledBy?.passwordHash).toBeUndefined();
    await request(app.getHttpServer())
      .get(`/sales/${saleId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);
    await request(app.getHttpServer())
      .post(`/sales/${saleId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'E2E cancellation' })
      .expect(201);
    expect(
      (
        await prisma.shopInventoryItem.findUniqueOrThrow({
          where: { id: inventoryItemId },
        })
      ).quantity,
    ).toBe(2);
    expect(
      await prisma.inventoryMovement.count({
        where: { inventoryItemId, type: 'SALE_CANCEL' },
      }),
    ).toBe(1);
    await request(app.getHttpServer())
      .post(`/sales/${saleId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'again' })
      .expect(409);
  });

  it('rejects overselling without changing stock', async () => {
    await request(app.getHttpServer())
      .post('/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({ shopId, items: [{ inventoryItemId, quantity: 3 }] })
      .expect(409);
    expect(
      (
        await prisma.shopInventoryItem.findUniqueOrThrow({
          where: { id: inventoryItemId },
        })
      ).quantity,
    ).toBe(2);
  });

  it('allows only one of two concurrent sales', async () => {
    const responses = await Promise.all([
      request(app.getHttpServer())
        .post('/sales')
        .set('Authorization', `Bearer ${token}`)
        .send({ shopId, items: [{ inventoryItemId, quantity: 2 }] }),
      request(app.getHttpServer())
        .post('/sales')
        .set('Authorization', `Bearer ${token}`)
        .send({ shopId, items: [{ inventoryItemId, quantity: 2 }] }),
    ]);
    expect(responses.map((response) => response.status).sort()).toEqual([
      201, 409,
    ]);
    expect(
      (
        await prisma.shopInventoryItem.findUniqueOrThrow({
          where: { id: inventoryItemId },
        })
      ).quantity,
    ).toBe(0);
    const successful = responses.find((response) => response.status === 201)!;
    await request(app.getHttpServer())
      .post(`/sales/${successful.body.id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'cleanup' })
      .expect(201);
  });

  it('enforces viewer and seller permissions', async () => {
    await request(app.getHttpServer())
      .post('/sales')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ items: [{ inventoryItemId, quantity: 1 }] })
      .expect(403);
    const created = await request(app.getHttpServer())
      .post('/sales')
      .set('Authorization', `Bearer ${token}`)
      .send({ shopId, items: [{ inventoryItemId, quantity: 1 }] })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/sales/${created.body.id}/cancel`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ reason: 'not allowed' })
      .expect(403);
    await request(app.getHttpServer())
      .post(`/sales/${created.body.id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'cleanup' })
      .expect(201);
  });
});
