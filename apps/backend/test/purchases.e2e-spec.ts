import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { createPartCatalogItem } from './helpers/create-part-catalog-item';
import { createShopInventoryItem } from './helpers/create-shop-inventory-item';

describe('Purchases (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let token: string;
  let shopId: string;
  let itemId: string;
  let adminId: string;
  let purchaseId: string;
  let catalogItemId: string;
  let viewerToken: string;
  let sellerToken: string;
  let otherToken: string;
  let otherShopId: string;
  const userIds: string[] = [];
  const prefix = `e2e-purchases-${Date.now()}`;
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
    const shop = await prisma.shop.create({ data: { name: `${prefix}-shop` } });
    shopId = shop.id;
    const admin = await prisma.user.create({
      data: {
        firstName: 'E2E Purchases',
        phone: `+992${String(Date.now()).slice(-9)}`,
        passwordHash: await bcrypt.hash('E2Epass123!', 12),
        role: UserRole.SUPER_ADMIN,
      },
    });
    adminId = admin.id;
    const category = await prisma.partCategory.create({
      data: { name: `${prefix}-cat`, slug: `${prefix}-cat` },
    });
    const part = await createPartCatalogItem(prisma, {
      data: {
        internalCode: `${prefix}-part`,
        name: `${prefix}-part`,
        slug: `${prefix}-part`,
        categoryId: category.id,
      },
    });
    catalogItemId = (
      await createPartCatalogItem(prisma, {
        data: {
          internalCode: `${prefix}-catalog-only`,
          name: `${prefix}-catalog-only`,
          slug: `${prefix}-catalog-only`,
          categoryId: category.id,
        },
      })
    ).id;
    itemId = (
      await createShopInventoryItem(prisma, {
        shopId,
        partCatalogItemId: part.id,
        price: 100,
        quantity: 2,
      })
    ).id;
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone: admin.phone, password: 'E2Epass123!' })
      .expect(201);
    token = login.body.accessToken;
    otherShopId = (
      await prisma.shop.create({ data: { name: `${prefix}-other-shop` } })
    ).id;
    for (const [role, targetShop] of [
      [UserRole.VIEWER, shopId],
      [UserRole.SELLER, shopId],
      [UserRole.VIEWER, otherShopId],
    ] as const) {
      const user = await prisma.user.create({
        data: {
          firstName: role,
          phone: `+992${String(Date.now() + userIds.length + 20).slice(-9)}`,
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
  });
  afterAll(async () => {
    const shopIds = [shopId, otherShopId].filter(Boolean);
    await prisma.inventoryMovement.deleteMany({ where: { shopId } });
    await prisma.purchaseItem.deleteMany({ where: { purchase: { shopId } } });
    await prisma.purchase.deleteMany({ where: { shopId } });
    await prisma.shopInventoryItem.deleteMany({ where: { shopId } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.shop.deleteMany({
      where: { id: { in: shopIds } },
    });
    await prisma.partCatalogItem.deleteMany({
      where: { internalCode: { startsWith: prefix } },
    });
    await prisma.partCategory.deleteMany({ where: { slug: `${prefix}-cat` } });
    await prisma.user.delete({ where: { id: adminId } });
    await app.close();
    await prisma.$disconnect();
  });
  it('rejects anonymous access', () =>
    request(app.getHttpServer()).get('/purchases').expect(401));
  it('creates, reads and cancels a purchase', async () => {
    const created = await request(app.getHttpServer())
      .post('/purchases')
      .set('Authorization', `Bearer ${token}`)
      .send({
        shopId,
        invoiceNumber: 'INV-E2E',
        supplierName: 'E2E Supplier',
        supplierPhone: '+992900000003',
        notes: 'E2E purchase',
        purchasedAt: '2026-07-19T10:00:00.000Z',
        items: [
          {
            inventoryItemId: itemId,
            quantity: 5,
            purchasePrice: 80,
            salePrice: 120,
          },
        ],
      })
      .expect(201);
    purchaseId = created.body.id;
    const purchase = await prisma.purchase.findUniqueOrThrow({
      where: { id: purchaseId },
      include: { items: true },
    });
    expect(purchase.invoiceNumber).toBe('INV-E2E');
    expect(purchase.items[0].salePrice?.toString()).toBe('120');
    expect(
      (
        await prisma.shopInventoryItem.findUniqueOrThrow({
          where: { id: itemId },
        })
      ).quantity,
    ).toBe(7);
    expect(
      await prisma.inventoryMovement.count({
        where: { inventoryItemId: itemId, type: 'PURCHASE' },
      }),
    ).toBe(1);
    await request(app.getHttpServer())
      .get('/purchases')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/purchases/${purchaseId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    await request(app.getHttpServer())
      .get(`/purchases/${purchaseId}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404);
    await request(app.getHttpServer())
      .post(`/purchases/${purchaseId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'E2E cancel' })
      .expect(201);
    expect(
      (
        await prisma.shopInventoryItem.findUniqueOrThrow({
          where: { id: itemId },
        })
      ).quantity,
    ).toBe(2);
    await request(app.getHttpServer())
      .post(`/purchases/${purchaseId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'again' })
      .expect(409);
  });

  it('creates one inventory item for repeated catalog purchases', async () => {
    const ids: string[] = [];
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await request(app.getHttpServer())
        .post('/purchases')
        .set('Authorization', `Bearer ${token}`)
        .send({
          shopId,
          currency: 'TJS',
          items: [
            { catalogItemId, quantity: 2, purchasePrice: 50, salePrice: 75 },
          ],
        })
        .expect(201);
      ids.push(response.body.id);
    }
    expect(
      await prisma.shopInventoryItem.count({
        where: { shopId, partCatalogItemId: catalogItemId },
      }),
    ).toBe(1);
    for (const id of ids.reverse()) {
      await request(app.getHttpServer())
        .post(`/purchases/${id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'cleanup' })
        .expect(201);
    }
  });

  it('rejects purchase creation for viewer and seller', async () => {
    const payload = {
      items: [{ inventoryItemId: itemId, quantity: 1, purchasePrice: 1 }],
    };
    await request(app.getHttpServer())
      .post('/purchases')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send(payload)
      .expect(403);
    await request(app.getHttpServer())
      .post('/purchases')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send(payload)
      .expect(403);
  });
});
