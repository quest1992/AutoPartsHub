import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Vehicle Database (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let adminToken: string;
  let shopToken: string;
  let adminId: string;
  let shopUserId: string;
  let shopId: string;
  let manufacturerId: string;
  let modelId: string;
  let generationId: string;
  let engineId: string;
  let bodyTypeId: string;
  let modificationId: string;
  const prefix = `e2e-vehicle-${Date.now()}`;

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
    const passwordHash = await bcrypt.hash('E2Epass123!', 12);
    const [admin, shopUser] = await Promise.all([
      prisma.user.create({
        data: {
          firstName: 'Vehicle Admin',
          phone: `+987${String(Date.now()).slice(-9)}`,
          passwordHash,
          role: UserRole.SUPER_ADMIN,
        },
      }),
      prisma.user.create({
        data: {
          firstName: 'Vehicle Shop',
          phone: `+986${String(Date.now()).slice(-9)}`,
          passwordHash,
          role: UserRole.SHOP_ADMIN,
          shopId,
        },
      }),
    ]);
    adminId = admin.id;
    shopUserId = shopUser.id;
    const [adminLogin, shopLogin] = await Promise.all([
      request(app.getHttpServer()).post('/auth/login').send({
        phone: admin.phone,
        password: 'E2Epass123!',
      }),
      request(app.getHttpServer()).post('/auth/login').send({
        phone: shopUser.phone,
        password: 'E2Epass123!',
      }),
    ]);
    adminToken = adminLogin.body.accessToken;
    shopToken = shopLogin.body.accessToken;

    const manufacturer = await prisma.manufacturer.create({
      data: { name: `${prefix}-manufacturer`, slug: `${prefix}-manufacturer` },
    });
    manufacturerId = manufacturer.id;
    const model = await prisma.vehicleModel.create({
      data: {
        manufacturerId,
        name: `${prefix}-model`,
        slug: `${prefix}-model`,
      },
    });
    modelId = model.id;
    const generation = await prisma.vehicleGeneration.create({
      data: {
        vehicleModelId: modelId,
        name: `${prefix}-generation`,
        slug: `${prefix}-generation`,
        startYear: 2020,
        endYear: 2025,
      },
    });
    generationId = generation.id;
    const fuelType = await prisma.fuelType.findFirstOrThrow({
      where: { isActive: true },
    });
    const engine = await prisma.engine.create({
      data: {
        generationId,
        manufacturerId,
        fuelTypeId: fuelType.id,
        code: `${prefix}-ENGINE`,
        name: `${prefix} engine`,
        fuel: fuelType.name,
      },
    });
    engineId = engine.id;
  });

  afterAll(async () => {
    if (modificationId) {
      await prisma.vehicleModification.deleteMany({
        where: { id: modificationId },
      });
    }
    await prisma.vehicleDataChangeField.deleteMany({
      where: {
        change: {
          entityId: { in: [bodyTypeId, modificationId].filter(Boolean) },
        },
      },
    });
    await prisma.vehicleDataChange.deleteMany({
      where: { entityId: { in: [bodyTypeId, modificationId].filter(Boolean) } },
    });
    await prisma.engine.deleteMany({ where: { id: engineId } });
    await prisma.vehicleGeneration.deleteMany({ where: { id: generationId } });
    await prisma.vehicleModel.deleteMany({ where: { id: modelId } });
    await prisma.manufacturer.deleteMany({ where: { id: manufacturerId } });
    if (bodyTypeId)
      await prisma.bodyType.deleteMany({ where: { id: bodyTypeId } });
    await prisma.user.deleteMany({
      where: { id: { in: [adminId, shopUserId] } },
    });
    await prisma.shop.deleteMany({ where: { id: shopId } });
    await app.close();
    await prisma.$disconnect();
  });

  it('allows catalog viewing but restricts registry writes to SUPER_ADMIN', async () => {
    await request(app.getHttpServer())
      .get('/vehicle-database/body-types')
      .expect(401);
    await request(app.getHttpServer())
      .get('/vehicle-database/body-types?limit=2')
      .set('Authorization', `Bearer ${shopToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .post('/vehicle-database/body-types')
      .set('Authorization', `Bearer ${shopToken}`)
      .send({ name: `${prefix}-body`, slug: `${prefix}-body` })
      .expect(403);
  });

  it('creates, searches, paginates and rejects duplicate registry entries', async () => {
    const created = await request(app.getHttpServer())
      .post('/vehicle-database/body-types')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `${prefix} Body`, slug: `${prefix}-body` })
      .expect(201);
    bodyTypeId = created.body.id;

    await request(app.getHttpServer())
      .post('/vehicle-database/body-types')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: `${prefix} Body`, slug: `${prefix}-body-duplicate` })
      .expect(409);

    const list = await request(app.getHttpServer())
      .get(`/vehicle-database/body-types?search=${prefix}&page=1&limit=1`)
      .set('Authorization', `Bearer ${shopToken}`)
      .expect(200);
    expect(list.body.meta).toMatchObject({ page: 1, limit: 1, total: 1 });
    expect(list.body.data[0].id).toBe(bodyTypeId);
  });

  it('audits PATCH, soft delete and restore', async () => {
    await request(app.getHttpServer())
      .patch(`/vehicle-database/body-types/${bodyTypeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'Changed by E2E' })
      .expect(200);
    const history = await request(app.getHttpServer())
      .get(`/vehicle-database/body-types/${bodyTypeId}/history`)
      .set('Authorization', `Bearer ${shopToken}`)
      .expect(200);
    const update = history.body.find(
      (item: { action: string }) => item.action === 'UPDATE',
    );
    expect(update.changedBy.id).toBe(adminId);
    expect(update.entityType).toBe('body-types');
    expect(update.entityId).toBe(bodyTypeId);
    expect(update.fields).toEqual([
      expect.objectContaining({
        fieldName: 'description',
        oldValue: null,
        newValue: 'Changed by E2E',
      }),
    ]);

    await request(app.getHttpServer())
      .delete(`/vehicle-database/body-types/${bodyTypeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const active = await request(app.getHttpServer())
      .get(`/vehicle-database/body-types?search=${prefix}`)
      .set('Authorization', `Bearer ${shopToken}`)
      .expect(200);
    expect(active.body.data).toHaveLength(0);
    const inactive = await request(app.getHttpServer())
      .get(`/vehicle-database/body-types?search=${prefix}&isActive=false`)
      .set('Authorization', `Bearer ${shopToken}`)
      .expect(200);
    expect(inactive.body.data).toHaveLength(1);
    await request(app.getHttpServer())
      .post(`/vehicle-database/body-types/${bodyTypeId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
  });

  it('validates relations and manages a vehicle modification', async () => {
    const references = await Promise.all([
      prisma.transmissionType.findFirstOrThrow({ where: { isActive: true } }),
      prisma.driveType.findFirstOrThrow({ where: { isActive: true } }),
      prisma.fuelType.findFirstOrThrow({
        where: { engines: { some: { id: engineId } } },
      }),
      prisma.steeringPosition.findFirstOrThrow({ where: { isActive: true } }),
      prisma.marketRegion.findFirstOrThrow({ where: { isActive: true } }),
    ]);
    const [transmission, drive, fuel, steering, market] = references;
    const payload = {
      generationId,
      bodyTypeId,
      engineId,
      transmissionTypeId: transmission.id,
      driveTypeId: drive.id,
      fuelTypeId: fuel.id,
      steeringPositionId: steering.id,
      marketRegionId: market.id,
      productionFrom: 2021,
      productionTo: 2024,
      powerHP: 150,
    };
    for (const field of [
      'generationId',
      'engineId',
      'transmissionTypeId',
      'driveTypeId',
    ] as const) {
      await request(app.getHttpServer())
        .post('/vehicle-database/modifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...payload,
          [field]: '00000000-0000-4000-8000-000000000000',
        })
        .expect(400);
    }
    const created = await request(app.getHttpServer())
      .post('/vehicle-database/modifications')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(payload)
      .expect(201);
    modificationId = created.body.id;

    const list = await request(app.getHttpServer())
      .get(
        `/vehicle-database/modifications?modelId=${modelId}&engineId=${engineId}&year=2022`,
      )
      .set('Authorization', `Bearer ${shopToken}`)
      .expect(200);
    expect(list.body.data.map((item: { id: string }) => item.id)).toContain(
      modificationId,
    );

    await request(app.getHttpServer())
      .patch(`/vehicle-database/modifications/${modificationId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ remarks: 'Updated modification' })
      .expect(200);
    await request(app.getHttpServer())
      .delete(`/vehicle-database/modifications/${modificationId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    await request(app.getHttpServer())
      .post(`/vehicle-database/modifications/${modificationId}/restore`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
    const history = await request(app.getHttpServer())
      .get(`/vehicle-database/modifications/${modificationId}/history`)
      .set('Authorization', `Bearer ${shopToken}`)
      .expect(200);
    expect(
      history.body.some((item: { action: string }) => item.action === 'UPDATE'),
    ).toBe(true);
  });
});
