import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { PermissionsGuard } from '../src/common/permissions/permissions.guard';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { PartNumbersController } from '../src/modules/part-numbers/part-numbers.controller';
import { PartNumbersService } from '../src/modules/part-numbers/part-numbers.service';

describe('Legacy PartNumber response (e2e)', () => {
  let app: INestApplication;
  const service = {
    findAll: jest.fn().mockResolvedValue({
      data: [
        {
          id: 'legacy-number',
          catalogItemId: 'catalog-item',
          manufacturer: null,
          number: '90915-YZZE1',
          normalizedNumber: '90915YZZE1',
          type: 'OEM',
          isPrimary: true,
        },
      ],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    }),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [PartNumbersController],
      providers: [{ provide: PartNumbersService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => app.close());

  it('serializes a legacy manufacturer=null record without an API failure', async () => {
    const response = await request(app.getHttpServer())
      .get('/part-numbers?catalogItemId=catalog-item')
      .expect(200);
    expect(response.body.data[0].manufacturer).toBeNull();
  });
});
