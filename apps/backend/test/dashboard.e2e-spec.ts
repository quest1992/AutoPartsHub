import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  PrismaClient,
  PurchaseStatus,
  SaleStatus,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { createPartCatalogItem } from './helpers/create-part-catalog-item';
import { createShopInventoryItem } from './helpers/create-shop-inventory-item';

describe('Dashboard (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let adminToken: string;
  let ownerToken: string;
  let shopId: string;
  let otherShopId: string;
  let categoryId: string;
  let adminId: string;
  let ownerId: string;
  const prefix = `e2e-dashboard-${Date.now()}`;
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
      prisma.shop.create({ data: { name: `${prefix}-other`, isActive: true } }),
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
    const [admin, owner] = await Promise.all([
      prisma.user.create({
        data: {
          firstName: 'DashboardAdmin',
          phone: `+991${String(Date.now()).slice(-9)}`,
          passwordHash: await bcrypt.hash('E2Epass123!', 12),
          role: UserRole.SUPER_ADMIN,
          isActive: true,
        },
      }),
      prisma.user.create({
        data: {
          firstName: 'DashboardOwner',
          phone: `+990${String(Date.now()).slice(-9)}`,
          passwordHash: await bcrypt.hash('E2Epass123!', 12),
          role: UserRole.SHOP_OWNER,
          shopId,
          isActive: true,
        },
      }),
    ]);
    adminId = admin.id;
    ownerId = owner.id;
    const [partA, partB, partC, otherPart] = await Promise.all(
      ['a', 'b', 'c', 'other'].map((suffix) =>
        createPartCatalogItem(prisma, {
          data: {
            internalCode: `${prefix}-${suffix}`,
            name: `${prefix}-${suffix}`,
            slug: `${prefix}-${suffix}`,
            categoryId,
            isActive: true,
          },
        }),
      ),
    );
    const [itemA, , itemC] = await Promise.all([
      createShopInventoryItem(prisma, {
        shopId,
        partCatalogItemId: partA.id,
        price: 100,
        quantity: 3,
        isActive: true,
      }),
      createShopInventoryItem(prisma, {
        shopId,
        partCatalogItemId: partB.id,
        price: 200,
        quantity: 0,
        isActive: true,
      }),
      createShopInventoryItem(prisma, {
        shopId,
        partCatalogItemId: partC.id,
        price: 50,
        quantity: 10,
        isActive: true,
      }),
      createShopInventoryItem(prisma, {
        shopId: otherShopId,
        partCatalogItemId: otherPart.id,
        price: 300,
        quantity: 8,
        isActive: true,
      }),
    ]);
    const sale = await prisma.sale.create({
      data: {
        number: `${prefix}-sale`,
        shopId,
        userId: owner.id,
        status: SaleStatus.COMPLETED,
        currency: 'TJS',
        subtotal: 200,
        discount: 0,
        totalAmount: 200,
      },
    });
    await prisma.saleItem.create({
      data: {
        saleId: sale.id,
        inventoryItemId: itemA.id,
        partCatalogItemId: partA.id,
        itemName: partA.name,
        quantity: 2,
        unitPrice: 100,
        lineTotal: 200,
      },
    });
    await prisma.sale.create({
      data: {
        number: `${prefix}-cancelled-sale`,
        shopId,
        userId: owner.id,
        status: SaleStatus.CANCELLED,
        currency: 'TJS',
        subtotal: 999,
        discount: 0,
        totalAmount: 999,
      },
    });
    const purchase = await prisma.purchase.create({
      data: {
        number: `${prefix}-purchase`,
        shopId,
        userId: owner.id,
        status: PurchaseStatus.COMPLETED,
        currency: 'TJS',
        subtotal: 40,
        discount: 0,
        totalAmount: 40,
      },
    });
    await prisma.purchaseItem.create({
      data: {
        purchaseId: purchase.id,
        inventoryItemId: itemC.id,
        partCatalogItemId: partC.id,
        itemName: partC.name,
        quantity: 2,
        purchasePrice: 20,
        lineTotal: 40,
      },
    });
    await prisma.purchase.create({
      data: {
        number: `${prefix}-cancelled-purchase`,
        shopId,
        userId: owner.id,
        status: PurchaseStatus.CANCELLED,
        currency: 'TJS',
        subtotal: 888,
        discount: 0,
        totalAmount: 888,
      },
    });
    const logins = await Promise.all([
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ phone: admin.phone, password: 'E2Epass123!' }),
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ phone: owner.phone, password: 'E2Epass123!' }),
    ]);
    adminToken = (logins[0].body as { accessToken: string }).accessToken;
    ownerToken = (logins[1].body as { accessToken: string }).accessToken;
  });
  afterAll(async () => {
    const shopIds = [shopId, otherShopId].filter(Boolean);
    const userIds = [adminId, ownerId].filter(Boolean);
    await prisma.saleItem.deleteMany({
      where: { sale: { number: { startsWith: prefix } } },
    });
    await prisma.purchaseItem.deleteMany({
      where: { purchase: { number: { startsWith: prefix } } },
    });
    await prisma.sale.deleteMany({ where: { number: { startsWith: prefix } } });
    await prisma.purchase.deleteMany({
      where: { number: { startsWith: prefix } },
    });
    await prisma.shopInventoryItem.deleteMany({
      where: { shopId: { in: shopIds } },
    });
    await prisma.partCatalogItem.deleteMany({
      where: { internalCode: { startsWith: prefix } },
    });
    await prisma.partCategory.delete({ where: { id: categoryId } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.shop.deleteMany({
      where: { id: { in: shopIds } },
    });
    await app.close();
    await prisma.$disconnect();
  });
  it('limits a shop user to its own completed documents and inventory', async () => {
    const response = await request(app.getHttpServer())
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    const body = response.body as {
      sales: { count: number; revenue: string; itemsSold: number };
      purchases: { count: number; total: string };
      inventory: {
        activeItems: number;
        totalQuantity: number;
        lowStockItems: number;
        outOfStockItems: number;
      };
    };
    expect(body.sales).toEqual({ count: 1, revenue: '200', itemsSold: 2 });
    expect(body.purchases).toEqual({
      count: 1,
      total: '40',
      itemsPurchased: 2,
    });
    expect(body.inventory).toEqual({
      activeItems: 3,
      totalQuantity: 13,
      lowStockItems: 1,
      outOfStockItems: 1,
      byWarehouse: [
        {
          warehouseId: expect.any(String),
          name: 'Основной склад',
          quantity: 13,
          value: '800',
        },
      ],
    });
  });
  it('lets SUPER_ADMIN aggregate all shops or select one shop', async () => {
    const all = await request(app.getHttpServer())
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(
      (all.body as { inventory: { activeItems: number } }).inventory
        .activeItems,
    ).toBeGreaterThanOrEqual(4);
    const filtered = await request(app.getHttpServer())
      .get(`/dashboard/summary?shopId=${shopId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(
      (filtered.body as { inventory: { activeItems: number } }).inventory
        .activeItems,
    ).toBe(3);
  });
  it('rejects a foreign shop filter for a shop user', async () => {
    await request(app.getHttpServer())
      .get(`/dashboard/summary?shopId=${otherShopId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(403);
  });
});
