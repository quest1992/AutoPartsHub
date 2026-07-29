import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PartPosition, PartSide, PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Part catalog normalization (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let adminToken: string;
  const createdUserIds: string[] = [];
  const createdCategoryIds: string[] = [];
  const createdPartIds: string[] = [];
  const prefix = `e2e-catalog-normalization-${Date.now()}`;
  let categoryId: string;
  let firstPartId: string;

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

    const category = await prisma.partCategory.create({
      data: { name: `${prefix} category`, slug: `${prefix}-category` },
    });
    categoryId = category.id;
    createdCategoryIds.push(category.id);

    const admin = await prisma.user.create({
      data: {
        firstName: 'Catalog E2E Admin',
        phone: `+992${String(Date.now()).slice(-9)}`,
        passwordHash: await bcrypt.hash('E2Epass123!', 12),
        role: UserRole.SUPER_ADMIN,
        isActive: true,
      },
    });
    createdUserIds.push(admin.id);
    adminToken = (
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ phone: admin.phone, password: 'E2Epass123!' })
        .expect(201)
    ).body.accessToken;
  });

  afterAll(async () => {
    if (createdPartIds.length) {
      await prisma.partCompatibility.deleteMany({
        where: { partCatalogItemId: { in: [...new Set(createdPartIds)] } },
      });
      await prisma.partCatalogItem.deleteMany({
        where: { id: { in: [...new Set(createdPartIds)] } },
      });
    }
    if (createdCategoryIds.length) {
      await prisma.partCategory.deleteMany({
        where: { id: { in: [...new Set(createdCategoryIds)] } },
      });
    }
    if (createdUserIds.length) {
      await prisma.user.deleteMany({
        where: { id: { in: [...new Set(createdUserIds)] } },
      });
    }
    await app.close();
    await prisma.$disconnect();
  });

  it('rejects unauthenticated catalog search requests', () =>
    request(app.getHttpServer())
      .get('/part-catalog/search')
      .query({ search: 'колодки' })
      .expect(401));

  it('stores normalization, rejects exact technical duplicates, and permits another side', async () => {
    const created = await request(app.getHttpServer())
      .post('/part-catalog')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Колодки   тормозные',
        slug: `${prefix}-brake-pads`,
        categoryId,
        side: PartSide.LEFT,
        position: PartPosition.FRONT,
      })
      .expect(201);
    firstPartId = created.body.id;
    createdPartIds.push(created.body.id);
    expect(created.body.normalizedName).toBe('колодки тормозные');
    expect(created.body.searchTokens).toBe('колодки тормозные');

    await request(app.getHttpServer())
      .post('/part-catalog')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Колодки—тормозные',
        slug: `${prefix}-duplicate`,
        categoryId,
        side: PartSide.LEFT,
        position: PartPosition.FRONT,
      })
      .expect(409);

    const anotherSide = await request(app.getHttpServer())
      .post('/part-catalog')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Колодки-тормозные',
        slug: `${prefix}-right`,
        categoryId,
        side: PartSide.RIGHT,
        position: PartPosition.FRONT,
      })
      .expect(201);
    createdPartIds.push(anotherSide.body.id);
  });

  it('returns exact and same-token searches, excluding inactive items', async () => {
    const exact = await request(app.getHttpServer())
      .get('/part-catalog/search')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ search: 'Колодки-тормозные', categoryId, limit: 10 })
      .expect(200);
    expect(
      exact.body.data.some((item: { id: string }) => item.id === firstPartId),
    ).toBe(true);

    const sameTokens = await request(app.getHttpServer())
      .get('/part-catalog/search')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ search: 'Тормозные колодки', categoryId, limit: 10 })
      .expect(200);
    expect(
      sameTokens.body.data.some(
        (item: { id: string }) => item.id === firstPartId,
      ),
    ).toBe(true);

    await prisma.partCatalogItem.update({
      where: { id: firstPartId },
      data: { isActive: false },
    });
    const withoutInactive = await request(app.getHttpServer())
      .get('/part-catalog/search')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ search: 'Колодки тормозные', categoryId, isActive: true })
      .expect(200);
    expect(
      withoutInactive.body.data.some(
        (item: { id: string }) => item.id === firstPartId,
      ),
    ).toBe(false);
  });

  it('recalculates normalization on update and retains normal catalog filters', async () => {
    await request(app.getHttpServer())
      .patch(`/part-catalog/${firstPartId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Фильтр   масляный' })
      .expect(200);
    const updated = await prisma.partCatalogItem.findUniqueOrThrow({
      where: { id: firstPartId },
      select: { normalizedName: true, searchTokens: true },
    });
    expect(updated).toEqual({
      normalizedName: 'фильтр масляный',
      searchTokens: 'масляный фильтр',
    });

    const list = await request(app.getHttpServer())
      .get('/part-catalog/search')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ categoryId, side: PartSide.LEFT, position: PartPosition.FRONT })
      .expect(200);
    expect(
      list.body.data.some((item: { id: string }) => item.id === firstPartId),
    ).toBe(true);
  });

  it('finds a catalog item by an approved alias through the search endpoint', async () => {
    await request(app.getHttpServer())
      .post(`/part-catalog/${firstPartId}/aliases`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ alias: `${prefix} brake pad`, isApproved: true })
      .expect(201);

    const result = await request(app.getHttpServer())
      .get('/part-catalog/search')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ search: `${prefix} BRAKE PAD` })
      .expect(200);

    expect(
      result.body.data.some((item: { id: string }) => item.id === firstPartId),
    ).toBe(true);
  });

  it.each([
    'Главные платы BMS',
    'Главные платы',
    'платы',
    'BMS',
    'главные платы bms',
    '  Главные    платы   BMS  ',
  ])('finds the same BMS catalog item for "%s"', async (search) => {
    let bmsPart = await prisma.partCatalogItem.findFirst({
      where: { slug: `${prefix}-main-bms-board` },
    });
    if (!bmsPart) {
      bmsPart = await prisma.partCatalogItem.create({
        data: {
          internalCode: `E2E-BMS-${Date.now()}`,
          name: 'Главные платы BMS',
          normalizedName: 'главные платы bms',
          searchTokens: 'bms главные платы',
          slug: `${prefix}-main-bms-board`,
          categoryId,
        },
      });
      createdPartIds.push(bmsPart.id);
    }

    const result = await request(app.getHttpServer())
      .get('/part-catalog/search')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ search, isActive: true, limit: 10 })
      .expect(200);

    expect(
      result.body.data.some((item: { id: string }) => item.id === bmsPart.id),
    ).toBe(true);
  });

  it.each([
    ['Блоки управления батареей BMS', 'battery-control-bms'],
    ['Система управления батареей', 'battery-management-system'],
  ])(
    'finds a catalog item at the requested catalog level: %s',
    async (name, suffix) => {
      const part = await prisma.partCatalogItem.create({
        data: {
          internalCode: `E2E-${suffix}-${Date.now()}`,
          name,
          normalizedName: name.toLocaleLowerCase('ru-RU'),
          searchTokens: name
            .toLocaleLowerCase('ru-RU')
            .split(/\s+/)
            .sort()
            .join(' '),
          slug: `${prefix}-${suffix}`,
          categoryId,
        },
      });
      createdPartIds.push(part.id);

      const result = await request(app.getHttpServer())
        .get('/part-catalog/search')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ search: name, isActive: true, limit: 10 })
        .expect(200);

      expect(result.body.data.map((item: { id: string }) => item.id)).toContain(
        part.id,
      );
    },
  );
});
