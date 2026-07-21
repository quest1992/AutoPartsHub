import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Inventory search (e2e)', () => {
  let app: INestApplication,
    prisma: PrismaClient,
    adminToken: string,
    shopToken: string;
  let adminId: string, shopUserId: string, shopA: string, shopB: string;
  const prefix = `e2e-search-${Date.now()}`;
  beforeAll(async () => {
    prisma = new PrismaClient();
    const m = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = m.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    shopA = (
      await prisma.shop.create({
        data: { name: `${prefix}-A`, isActive: true },
      })
    ).id;
    shopB = (
      await prisma.shop.create({
        data: { name: `${prefix}-B`, isActive: true },
      })
    ).id;
    const admin = await prisma.user.create({
      data: {
        firstName: 'E2E Search Admin',
        phone: `+992${String(Date.now()).slice(-9)}`,
        passwordHash: await bcrypt.hash('E2Epass123!', 12),
        role: UserRole.SUPER_ADMIN,
        isActive: true,
      },
    });
    adminId = admin.id;
    const user = await prisma.user.create({
      data: {
        firstName: 'E2E Search Shop',
        phone: `+993${String(Date.now()).slice(-9)}`,
        passwordHash: await bcrypt.hash('E2Epass123!', 12),
        role: UserRole.SHOP_OWNER,
        shopId: shopA,
        isActive: true,
      },
    });
    shopUserId = user.id;
    const cat = await prisma.partCategory.create({
      data: { name: `${prefix}-cat`, slug: `${prefix}-cat` },
    });
    const part = await prisma.partCatalogItem.create({
      data: {
        internalCode: `${prefix}-CODE`,
        name: `Turbo Filter ${prefix}`,
        slug: `turbo-filter-${prefix}`,
        categoryId: cat.id,
      },
    });
    await prisma.shopInventoryItem.createMany({
      data: [
        {
          shopId: shopA,
          partCatalogItemId: part.id,
          brand: 'A',
          oemNumber: `OEM-${prefix}`,
          price: 100,
          quantity: 5,
        },
        {
          shopId: shopA,
          partCatalogItemId: part.id,
          brand: 'ZERO',
          price: 50,
          quantity: 0,
        },
        {
          shopId: shopB,
          partCatalogItemId: part.id,
          brand: 'B',
          price: 200,
          quantity: 3,
        },
        {
          shopId: shopB,
          partCatalogItemId: part.id,
          brand: 'OFF',
          price: 300,
          quantity: 2,
          isActive: false,
        },
      ],
    });
    const login = async (phone: string) =>
      (
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ phone, password: 'E2Epass123!' })
          .expect(201)
      ).body.accessToken;
    adminToken = await login(admin.phone);
    shopToken = await login(user.phone);
  });
  afterAll(async () => {
    await prisma.inventoryMovement.deleteMany({
      where: { shopId: { in: [shopA, shopB] } },
    });
    await prisma.shopInventoryItem.deleteMany({
      where: { shopId: { in: [shopA, shopB] } },
    });
    await prisma.shop.deleteMany({ where: { id: { in: [shopA, shopB] } } });
    await prisma.partCatalogItem.deleteMany({
      where: { internalCode: `${prefix}-CODE` },
    });
    await prisma.partCategory.deleteMany({ where: { slug: `${prefix}-cat` } });
    await prisma.user.deleteMany({
      where: { id: { in: [adminId, shopUserId] } },
    });
    await app.close();
    await prisma.$disconnect();
  });
  it('rejects anonymous access', () =>
    request(app.getHttpServer()).get('/inventory-search').expect(401));
  it('searches globally, filters and paginates', async () => {
    const api = request(app.getHttpServer())
      .get('/inventory-search')
      .set('Authorization', `Bearer ${adminToken}`);
    const all = await api
      .query({
        q: 'tUrBo',
        inStockOnly: true,
        sortBy: 'price',
        sortOrder: 'asc',
        page: 1,
        limit: 1,
      })
      .expect(200);
    expect(all.body.items).toHaveLength(1);
    expect(all.body.items[0].price).toBe('100.00');
    expect(all.body.pagination).toMatchObject({
      page: 1,
      limit: 1,
      total: 2,
      totalPages: 2,
    });
    const code = await request(app.getHttpServer())
      .get('/inventory-search')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({
        q: `${prefix}-CODE`,
        minPrice: 150,
        maxPrice: 250,
        sortBy: 'quantity',
        sortOrder: 'desc',
      })
      .expect(200);
    expect(code.body.items).toHaveLength(1);
    expect(code.body.items[0].shop.id).toBe(shopB);
    expect(code.body.items[0].availableQuantity).toBe(3);
  });
  it('enforces shop isolation', async () => {
    const own = await request(app.getHttpServer())
      .get('/inventory-search')
      .set('Authorization', `Bearer ${shopToken}`)
      .query({ inStockOnly: false })
      .expect(200);
    expect(
      own.body.items.every(
        (x: { shop: { id: string } }) => x.shop.id === shopA,
      ),
    ).toBe(true);
    await request(app.getHttpServer())
      .get('/inventory-search')
      .set('Authorization', `Bearer ${shopToken}`)
      .query({ shopId: shopB })
      .expect(403);
  });
});
