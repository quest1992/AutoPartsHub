import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Part numbers (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let token: string;
  let catalogItemId: string;
  let categoryId: string;
  let userId: string;
  let manufacturerId: string;
  let numberId: string;
  const prefix = `e2e-part-number-${Date.now()}`;

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
    const part = await prisma.partCatalogItem.create({
      data: {
        internalCode: `${prefix}-AUT`,
        name: `${prefix} filter`,
        normalizedName: `${prefix} filter`,
        searchTokens: `${prefix} filter`,
        slug: `${prefix}-filter`,
        categoryId,
      },
    });
    catalogItemId = part.id;
    manufacturerId = (
      await prisma.partNumberManufacturer.findUniqueOrThrow({
        where: { normalizedName: 'TOYOTA' },
      })
    ).id;
    const admin = await prisma.user.create({
      data: {
        firstName: 'Part Number E2E Admin',
        phone: `+992${String(Date.now()).slice(-9)}`,
        passwordHash: await bcrypt.hash('E2Epass123!', 12),
        role: UserRole.SUPER_ADMIN,
        isActive: true,
      },
    });
    userId = admin.id;
    token = (
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ phone: admin.phone, password: 'E2Epass123!' })
        .expect(201)
    ).body.accessToken;
  });

  afterAll(async () => {
    await prisma.partNumber.deleteMany({
      where: { partCatalogItemId: catalogItemId },
    });
    await prisma.partCatalogItem.delete({ where: { id: catalogItemId } });
    await prisma.partCategory.delete({ where: { id: categoryId } });
    await prisma.user.delete({ where: { id: userId } });
    await app.close();
    await prisma.$disconnect();
  });

  it('creates and normalizes an OEM number', async () => {
    const response = await request(app.getHttpServer())
      .post('/part-numbers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        catalogItemId,
        manufacturerId,
        number: '90915-YZZE1',
        type: 'OEM',
        isPrimary: true,
      })
      .expect(201);

    numberId = response.body.id;
    expect(response.body.normalizedNumber).toBe('90915YZZE1');
  });

  it('searches independently of separators and case', async () => {
    const response = await request(app.getHttpServer())
      .get('/part-numbers/search')
      .query({ search: '90915 yzze1' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: numberId })]),
    );
  });

  it('rejects the same normalized number for one manufacturer', async () => {
    await request(app.getHttpServer())
      .post('/part-numbers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        catalogItemId,
        manufacturerId,
        number: '90915.YZZE1',
        type: 'CROSS',
      })
      .expect(409);
  });

  it('updates and deletes a number', async () => {
    await request(app.getHttpServer())
      .patch(`/part-numbers/${numberId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ number: '90915_ABCD', type: 'CROSS' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.normalizedNumber).toBe('90915ABCD');
        expect(body.type).toBe('CROSS');
      });

    await request(app.getHttpServer())
      .delete(`/part-numbers/${numberId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });
});
