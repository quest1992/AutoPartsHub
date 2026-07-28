import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Shops permissions and lifecycle (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;
  let token: string;
  let shopId: string;
  let inactiveId: string;
  let employeeToken: string;
  const shopIds: string[] = [];
  const userIds: string[] = [];
  const prefix = `e2e-shops-${Date.now()}`;
  beforeAll(async () => {
    const url = process.env.DATABASE_URL_TEST;
    if (!url) throw new Error('DATABASE_URL_TEST is required for E2E tests');
    const db = new URL(url).pathname.replace(/^\/+/, '').split('/')[0];
    if (!/test/i.test(db))
      throw new Error(
        `Unsafe E2E database: ${db}. Database name must contain test.`,
      );
    process.env.DATABASE_URL = url;
    prisma = new PrismaClient();
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
    const hash = await bcrypt.hash('Password1', 12);
    const admin = await prisma.user.create({
      data: {
        firstName: 'super',
        phone: `+995${Date.now()}`,
        passwordHash: hash,
        role: UserRole.SUPER_ADMIN,
      },
    });
    userIds.push(admin.id);
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ phone: admin.phone, password: 'Password1' })
      .expect(201);
    token = login.body.accessToken;
    const inactive = await prisma.shop.create({
      data: { name: `${prefix}-inactive`, isActive: false },
    });
    shopIds.push(inactive.id);
    inactiveId = inactive.id;
  });
  afterAll(async () => {
    if (userIds.length)
      await prisma.user.deleteMany({
        where: { id: { in: [...new Set(userIds)] } },
      });
    if (shopIds.length)
      await prisma.shop.deleteMany({
        where: { id: { in: [...new Set(shopIds)] } },
      });
    await app.close();
    await prisma.$disconnect();
  });
  it('requires JWT and keeps inactive shops out of default list', async () => {
    await request(app.getHttpServer()).get('/shops').expect(401);
    const list = await request(app.getHttpServer())
      .get('/shops')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(list.body.map((shop: { id: string }) => shop.id)).not.toContain(
      inactiveId,
    );
    const all = await request(app.getHttpServer())
      .get('/shops?includeInactive=true')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(all.body.map((shop: { id: string }) => shop.id)).toContain(
      inactiveId,
    );
  });
  it('creates, reads, updates and idempotently deactivates a shop', async () => {
    const created = await request(app.getHttpServer())
      .post('/shops')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `${prefix}-active`, city: 'Khujand' })
      .expect(201);
    shopId = created.body.id;
    shopIds.push(shopId);
    await request(app.getHttpServer())
      .get(`/shops/${shopId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    await request(app.getHttpServer())
      .patch(`/shops/${shopId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ city: 'Dushanbe' })
      .expect(200);
    const first = await request(app.getHttpServer())
      .post(`/shops/${shopId}/deactivate`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
    expect(first.body.isActive).toBe(false);
    const second = await request(app.getHttpServer())
      .post(`/shops/${shopId}/deactivate`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
    expect(second.body.isActive).toBe(false);
  });
  it('returns 404 for unknown shop ids', async () => {
    const id = '00000000-0000-4000-8000-000000000000';
    await request(app.getHttpServer())
      .get(`/shops/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
    await request(app.getHttpServer())
      .patch(`/shops/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Unknown' })
      .expect(404);
    await request(app.getHttpServer())
      .post(`/shops/${id}/deactivate`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });
});
