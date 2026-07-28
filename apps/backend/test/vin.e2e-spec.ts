import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { PermissionsGuard } from '../src/common/permissions/permissions.guard';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { VinController } from '../src/modules/vin/vin.controller';
import { VinService } from '../src/modules/vin/vin.service';

describe('VIN API (e2e)', () => {
  let app: INestApplication;
  const service = {
    decode: jest.fn().mockResolvedValue({
      vehicle: { vin: '4T1G11AK0MU001001', manufacturer: 'Toyota', model: 'Camry' },
      cacheHit: false,
      matchStatus: 'FOUND',
      matchedIds: { brandId: 'brand', modelId: 'model', generationId: 'generation', engineId: 'engine' },
      catalogItems: [{ id: 'part', name: 'Oil filter' }],
    }),
    findCache: jest.fn(),
    findCacheOne: jest.fn(),
    removeCache: jest.fn(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [VinController],
      providers: [{ provide: VinService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard).useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => app.close());

  it('POST /vin/decode returns decoded vehicle, match and catalog items', async () => {
    const response = await request(app.getHttpServer())
      .post('/vin/decode')
      .send({ vin: '4T1G11AK0MU001001' })
      .expect(201);
    expect(response.body.matchStatus).toBe('FOUND');
    expect(response.body.catalogItems).toHaveLength(1);
  });

  it('POST /vin/decode rejects an invalid VIN', async () => {
    await request(app.getHttpServer())
      .post('/vin/decode')
      .send({ vin: 'INVALID' })
      .expect(400);
  });
});
