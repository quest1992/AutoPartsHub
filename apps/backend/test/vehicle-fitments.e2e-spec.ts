import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { PermissionsGuard } from '../src/common/permissions/permissions.guard';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { VehicleFitmentsController } from '../src/modules/vehicle-fitments/vehicle-fitments.controller';
import { VehicleFitmentsService } from '../src/modules/vehicle-fitments/vehicle-fitments.service';

describe('Vehicle fitments API (e2e)', () => {
  let app: INestApplication;
  const service = {
    search: jest.fn().mockResolvedValue({
      data: [{ id: 'fitment-1', engine: { code: '2AR-FE' } }],
      meta: { page: 1, limit: 50, total: 1, totalPages: 1 },
    }),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [VehicleFitmentsController],
      providers: [{ provide: VehicleFitmentsService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard).useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => app.close());

  it('GET /vehicle-fitments/search searches the hierarchy', async () => {
    const response = await request(app.getHttpServer())
      .get('/vehicle-fitments/search?search=Toyota')
      .expect(200);
    expect(response.body.data).toHaveLength(1);
    expect(service.search).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'Toyota' }),
    );
  });
});
