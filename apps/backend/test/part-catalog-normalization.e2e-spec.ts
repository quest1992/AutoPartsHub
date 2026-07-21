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

  it('rejects unauthenticated candidate requests', () =>
    request(app.getHttpServer())
      .get('/part-catalog/candidates')
      .query({ q: 'колодки' })
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

  it('returns exact and same-token candidates, excluding inactive items', async () => {
    const exact = await request(app.getHttpServer())
      .get('/part-catalog/candidates')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ q: 'Колодки-тормозные', categoryId, limit: 10 })
      .expect(200);
    expect(exact.body.items[0]).toMatchObject({
      id: firstPartId,
      matchType: 'EXACT_NORMALIZED_NAME',
    });

    const sameTokens = await request(app.getHttpServer())
      .get('/part-catalog/candidates')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ q: 'Тормозные колодки', categoryId, limit: 10 })
      .expect(200);
    expect(
      sameTokens.body.items.some(
        (item: { id: string; matchType: string }) =>
          item.id === firstPartId && item.matchType === 'SAME_TOKENS',
      ),
    ).toBe(true);

    await prisma.partCatalogItem.update({
      where: { id: firstPartId },
      data: { isActive: false },
    });
    const withoutInactive = await request(app.getHttpServer())
      .get('/part-catalog/candidates')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ q: 'Колодки тормозные', categoryId })
      .expect(200);
    expect(
      withoutInactive.body.items.some(
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
      .get('/part-catalog')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ categoryId, side: PartSide.LEFT, position: PartPosition.FRONT })
      .expect(200);
    expect(list.body.data.some((item: { id: string }) => item.id === firstPartId)).toBe(true);
  });
});
