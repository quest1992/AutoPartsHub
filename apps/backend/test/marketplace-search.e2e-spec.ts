import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { PermissionsGuard } from '../src/common/permissions/permissions.guard';
import { JwtAuthGuard } from '../src/modules/auth/guards/jwt-auth.guard';
import { MarketplaceSearchController } from '../src/modules/marketplace-search/marketplace-search.controller';
import { MarketplaceSearchService } from '../src/modules/marketplace-search/marketplace-search.service';

describe('Marketplace Search API (e2e)', () => {
  let app: INestApplication;
  const service = {
    search: jest.fn().mockResolvedValue({
      queryType: 'NAME',
      vehicle: null,
      items: [{ inventoryItemId: 'offer', name: 'Масляный фильтр' }],
      pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
    }),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [MarketplaceSearchController],
      providers: [{ provide: MarketplaceSearchService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();
  });

  afterAll(async () => app.close());

  it('GET /marketplace-search returns offers and pagination', async () => {
    const response = await request(app.getHttpServer())
      .get('/marketplace-search?q=масляный+фильтр&page=1&limit=12')
      .expect(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.pagination.total).toBe(1);
  });
});
