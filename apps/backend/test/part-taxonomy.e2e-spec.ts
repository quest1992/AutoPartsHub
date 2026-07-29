import { INestApplication, ValidationPipe } from '@nestjs/common';
import {
  PartCategoryClassification,
  PartTaxonomyDecisionStatus,
  PrismaClient,
  UserRole,
} from '@prisma/client';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { AppModule } from '../src/app.module';

type HttpApp = Parameters<typeof request>[0];

describe('Part Taxonomy Studio (e2e)', () => {
  let app: INestApplication;
  let http: HttpApp;
  let prisma: PrismaClient;
  let adminToken: string;
  let shopToken: string;
  let adminId: string;
  let shopUserId: string;
  let shopId: string;
  const prefix = `e2e-taxonomy-${Date.now()}`;
  const categoryIds: string[] = [];
  const itemIds: string[] = [];
  const decisionIds: string[] = [];

  async function category(
    suffix: string,
    parentId: string | null = null,
    needsReview = true,
  ) {
    const row = await prisma.partCategory.create({
      data: {
        name: `${prefix}-${suffix}`,
        slug: `${prefix}-${suffix}`.toLowerCase(),
        parentId,
        needsReview,
      },
    });
    categoryIds.push(row.id);
    return row;
  }

  async function createDecision(data: Record<string, unknown>) {
    const response = await request(http)
      .post('/admin/part-taxonomy/decisions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(data)
      .expect(201);
    decisionIds.push(response.body.id as string);
    return response.body as { id: string; status: PartTaxonomyDecisionStatus };
  }

  async function action(
    decisionId: string,
    name: 'validate' | 'ready' | 'approve' | 'preview' | 'apply',
    expected = 201,
  ) {
    return request(http)
      .post(`/admin/part-taxonomy/decisions/${decisionId}/${name}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(expected);
  }

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
    http = app.getHttpServer() as HttpApp;

    const shop = await prisma.shop.create({
      data: { name: `${prefix}-shop` },
    });
    shopId = shop.id;
    const passwordHash = await bcrypt.hash('E2Epass123!', 12);
    const [admin, shopUser] = await Promise.all([
      prisma.user.create({
        data: {
          firstName: 'Taxonomy Admin',
          phone: `+993${String(Date.now()).slice(-9)}`,
          passwordHash,
          role: UserRole.SUPER_ADMIN,
        },
      }),
      prisma.user.create({
        data: {
          firstName: 'Taxonomy Shop',
          phone: `+992${String(Date.now()).slice(-9)}`,
          passwordHash,
          role: UserRole.SHOP_ADMIN,
          shopId,
        },
      }),
    ]);
    adminId = admin.id;
    shopUserId = shopUser.id;
    const [adminLogin, shopLogin] = await Promise.all([
      request(http).post('/auth/login').send({
        phone: admin.phone,
        password: 'E2Epass123!',
      }),
      request(http).post('/auth/login').send({
        phone: shopUser.phone,
        password: 'E2Epass123!',
      }),
    ]);
    adminToken = adminLogin.body.accessToken as string;
    shopToken = shopLogin.body.accessToken as string;
  });

  afterAll(async () => {
    await prisma.partTaxonomyAuditEvent.deleteMany({
      where: { userId: adminId },
    });
    await prisma.partTaxonomyDecision.deleteMany({
      where: { id: { in: decisionIds } },
    });
    await prisma.partAlias.deleteMany({
      where: { partCatalogItemId: { in: itemIds } },
    });
    await prisma.partCategoryCatalogItemMapping.deleteMany({
      where: { sourceCategoryId: { in: categoryIds } },
    });
    await prisma.partCatalogItem.deleteMany({
      where: { id: { in: itemIds } },
    });
    for (const id of [...categoryIds].reverse()) {
      await prisma.partCategory.deleteMany({ where: { id } });
    }
    await prisma.user.deleteMany({
      where: { id: { in: [adminId, shopUserId] } },
    });
    await prisma.shop.deleteMany({ where: { id: shopId } });
    await app.close();
    await prisma.$disconnect();
  });

  it('enforces authentication, role, UUID and unknown-field validation', async () => {
    await request(http).get('/admin/part-taxonomy/categories').expect(401);
    await request(http)
      .get('/admin/part-taxonomy/categories')
      .set('Authorization', `Bearer ${shopToken}`)
      .expect(403);
    await request(http)
      .get('/admin/part-taxonomy/categories/not-a-uuid')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(400);
    await request(http)
      .post('/admin/part-taxonomy/decisions')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        sourceCategoryId: 'not-a-uuid',
        classification: 'CATEGORY',
        unknown: true,
      })
      .expect(400);
  });

  it('applies CREATE_NEW workflow, aliases, mapping and audit', async () => {
    const root = await category('suspension-root', null, false);
    const target = await category('bearings-target', root.id, false);
    const source = await category('wheel-bearings-legacy', root.id);

    const decision = await createDecision({
      sourceCategoryId: source.id,
      classification: PartCategoryClassification.CATALOG_ITEM,
      targetCategoryId: target.id,
      canonicalName: `${prefix} Ступичный подшипник`,
      duplicateStrategy: 'CREATE_NEW',
      aliases: [
        `${prefix} Ступичные подшипники`,
        `${prefix} Подшипник ступицы`,
      ],
    });
    expect(decision.status).toBe('DRAFT');
    expect((await action(decision.id, 'validate')).body.valid).toBe(true);
    expect((await action(decision.id, 'ready')).body.status).toBe('READY');
    expect((await action(decision.id, 'approve')).body.status).toBe(
      'APPROVED',
    );

    const beforePreview = await prisma.partCatalogItem.count({
      where: { name: { startsWith: prefix } },
    });
    const preview = await action(decision.id, 'preview');
    expect(preview.body.unchanged).toEqual(
      expect.arrayContaining([
        'ShopInventoryItem',
        'InventoryMovement',
        'SaleItem',
        'PurchaseItem',
        'CustomerOrderItem',
      ]),
    );
    expect(
      await prisma.partCatalogItem.count({
        where: { name: { startsWith: prefix } },
      }),
    ).toBe(beforePreview);

    await action(decision.id, 'apply');
    const applied = await prisma.partTaxonomyDecision.findUniqueOrThrow({
      where: { id: decision.id },
    });
    expect(applied.status).toBe('APPLIED');
    expect(applied.appliedAt).not.toBeNull();
    expect(applied.appliedById).toBe(adminId);

    const items = await prisma.partCatalogItem.findMany({
      where: {
        categoryId: target.id,
        normalizedName: { contains: 'ступичный подшипник' },
      },
      include: { aliases: true },
    });
    expect(items).toHaveLength(1);
    itemIds.push(items[0].id);
    expect(items[0].aliases.map((alias) => alias.normalizedAlias)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('ступичные подшипники'),
        expect.stringContaining('подшипник ступицы'),
        expect.stringContaining('wheel bearings legacy'),
      ]),
    );
    expect(
      await prisma.partCategoryCatalogItemMapping.count({
        where: {
          sourceCategoryId: source.id,
          targetCatalogItemId: items[0].id,
        },
      }),
    ).toBe(1);
    expect(
      await prisma.partCategory.findUniqueOrThrow({ where: { id: source.id } }),
    ).toMatchObject({ isActive: false, needsReview: false });
    expect(
      await prisma.partTaxonomyAuditEvent.count({
        where: { entityId: decision.id },
      }),
    ).toBeGreaterThanOrEqual(5);

    await action(decision.id, 'apply', 409);
    expect(
      await prisma.partCatalogItem.count({
        where: { id: items[0].id },
      }),
    ).toBe(1);
    expect(
      await prisma.partCategoryCatalogItemMapping.count({
        where: { sourceCategoryId: source.id },
      }),
    ).toBe(1);

    const second = await createDecision({
      sourceCategoryId: source.id,
      classification: 'CATALOG_ITEM',
      targetCategoryId: target.id,
      canonicalName: `${prefix} duplicate blocked`,
      duplicateStrategy: 'CREATE_NEW',
    });
    expect((await action(second.id, 'validate')).body.valid).toBe(false);
    await action(second.id, 'ready', 400);
  });

  it('uses an existing item without changing its existing relations', async () => {
    const root = await category('steering-root', null, false);
    const target = await category('steering-target', root.id, false);
    const source = await category('steering-racks-legacy', root.id);
    const item = await prisma.partCatalogItem.create({
      data: {
        internalCode: `E2E-${Date.now()}`,
        name: `${prefix} Рулевая рейка`,
        normalizedName: `${prefix} рулевая рейка`,
        searchTokens: `${prefix} рейка рулевая`,
        slug: `${prefix}-steering-rack`,
        categoryId: target.id,
      },
    });
    itemIds.push(item.id);
    const itemBefore = await prisma.partCatalogItem.findUniqueOrThrow({
      where: { id: item.id },
    });
    const countBefore = await prisma.partCatalogItem.count({
      where: { name: { startsWith: prefix } },
    });
    const decision = await createDecision({
      sourceCategoryId: source.id,
      classification: 'CATALOG_ITEM',
      targetCategoryId: target.id,
      targetCatalogItemId: item.id,
      canonicalName: item.name,
      duplicateStrategy: 'USE_EXISTING',
    });
    await action(decision.id, 'ready');
    await action(decision.id, 'approve');
    await action(decision.id, 'apply');
    expect(
      await prisma.partCatalogItem.count({
        where: { name: { startsWith: prefix } },
      }),
    ).toBe(countBefore);
    expect(
      await prisma.partCatalogItem.findUniqueOrThrow({ where: { id: item.id } }),
    ).toMatchObject({
      id: itemBefore.id,
      categoryId: itemBefore.categoryId,
      replacedById: itemBefore.replacedById,
    });
    expect(
      await prisma.partAlias.count({
        where: {
          partCatalogItemId: item.id,
          normalizedAlias: { contains: 'steering racks legacy' },
        },
      }),
    ).toBe(1);
  });

  it('applies CATEGORY and INVALID, while REVIEW remains read-only', async () => {
    const root = await category('classification-root', null, false);
    const structural = await category('structural-source', root.id);
    const invalid = await category('invalid-source', root.id);
    const review = await category('review-source', root.id);
    const originalParent = structural.parentId;

    const categoryDecision = await createDecision({
      sourceCategoryId: structural.id,
      classification: 'CATEGORY',
      notes: 'confirmed structure',
    });
    await action(categoryDecision.id, 'ready');
    await action(categoryDecision.id, 'approve');
    await action(categoryDecision.id, 'apply');
    expect(
      await prisma.partCategory.findUniqueOrThrow({
        where: { id: structural.id },
      }),
    ).toMatchObject({
      isActive: true,
      needsReview: false,
      parentId: originalParent,
    });

    const invalidDecision = await createDecision({
      sourceCategoryId: invalid.id,
      classification: 'INVALID',
      reviewReason: 'Служебная тестовая строка',
    });
    await action(invalidDecision.id, 'ready');
    await action(invalidDecision.id, 'approve');
    await action(invalidDecision.id, 'apply');
    expect(
      await prisma.partCategory.findUniqueOrThrow({ where: { id: invalid.id } }),
    ).toMatchObject({ isActive: false, needsReview: false });

    const reviewDecision = await createDecision({
      sourceCategoryId: review.id,
      classification: 'REVIEW',
      reviewReason: 'Нужно ручное исследование',
    });
    await action(reviewDecision.id, 'preview');
    await action(reviewDecision.id, 'ready', 400);
    await action(reviewDecision.id, 'apply', 409);
    expect(
      await prisma.partTaxonomyDecision.findUniqueOrThrow({
        where: { id: reviewDecision.id },
      }),
    ).toMatchObject({
      status: 'DRAFT',
      reviewReason: 'Нужно ручное исследование',
    });
  });

  it('rolls back the whole batch after an in-transaction conflict', async () => {
    const root = await category('rollback-root', null, false);
    const target = await category('rollback-target', root.id, false);
    const structural = await category('rollback-structural', root.id);
    const source = await category('rollback-item-source', root.id);
    const conflictingItem = await prisma.partCatalogItem.create({
      data: {
        internalCode: `E2E-CONFLICT-${Date.now()}`,
        name: `${prefix} existing conflict`,
        normalizedName: `${prefix} existing conflict`,
        searchTokens: `${prefix} conflict existing`,
        slug: `${prefix}-rollback-conflict`,
        categoryId: target.id,
      },
    });
    itemIds.push(conflictingItem.id);
    const structuralDecision = await createDecision({
      sourceCategoryId: structural.id,
      classification: 'CATEGORY',
    });
    const itemDecision = await createDecision({
      sourceCategoryId: source.id,
      classification: 'CATALOG_ITEM',
      targetCategoryId: target.id,
      canonicalName: `${prefix} conflicting new item`,
      canonicalSlug: conflictingItem.slug,
      duplicateStrategy: 'CREATE_NEW',
    });
    for (const decision of [structuralDecision, itemDecision]) {
      await action(decision.id, 'ready');
      await action(decision.id, 'approve');
    }
    const beforeItems = await prisma.partCatalogItem.count();
    await request(http)
      .post('/admin/part-taxonomy/batches/apply')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ decisionIds: [structuralDecision.id, itemDecision.id] })
      .expect(409);
    expect(await prisma.partCatalogItem.count()).toBe(beforeItems);
    expect(
      await prisma.partCategoryCatalogItemMapping.count({
        where: { sourceCategoryId: source.id },
      }),
    ).toBe(0);
    expect(
      await prisma.partCategory.findUniqueOrThrow({
        where: { id: structural.id },
      }),
    ).toMatchObject({ needsReview: true, isActive: true });
    const statuses = await prisma.partTaxonomyDecision.findMany({
      where: { id: { in: [structuralDecision.id, itemDecision.id] } },
      select: { status: true },
    });
    expect(statuses.every((row) => row.status === 'FAILED')).toBe(true);
    expect(
      await prisma.partTaxonomyAuditEvent.count({
        where: {
          entityId: { in: [structuralDecision.id, itemDecision.id] },
          action: 'APPLY',
        },
      }),
    ).toBe(0);
  });

  it('enforces batch limits and decision statuses', async () => {
    await request(http)
      .post('/admin/part-taxonomy/batches/apply')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        decisionIds: Array.from(
          { length: 51 },
          (_, index) => `${String(index).padStart(8, '0')}-0000-4000-8000-000000000000`,
        ),
      })
      .expect(400);
    const source = await category('draft-batch-source');
    const draft = await createDecision({
      sourceCategoryId: source.id,
      classification: 'CATEGORY',
    });
    await request(http)
      .post('/admin/part-taxonomy/batches/apply')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ decisionIds: [draft.id] })
      .expect(409);
  });

  it('preserves inventory, movements and financial history byte-for-byte', async () => {
    const root = await category('invariant-root', null, false);
    const target = await category('invariant-target', root.id, false);
    const source = await category('invariant-source', root.id);
    const item = await prisma.partCatalogItem.create({
      data: {
        internalCode: `E2E-INV-${Date.now()}`,
        name: `${prefix} invariant item`,
        normalizedName: `${prefix} invariant item`,
        searchTokens: `${prefix} invariant item`,
        slug: `${prefix}-invariant-item`,
        categoryId: target.id,
      },
    });
    itemIds.push(item.id);
    const warehouse = await prisma.shopWarehouse.create({
      data: {
        shopId,
        name: `${prefix}-warehouse`,
        isDefault: true,
      },
    });
    const inventory = await prisma.shopInventoryItem.create({
      data: {
        shopId,
        warehouseId: warehouse.id,
        partCatalogItemId: item.id,
        inventoryKey: `${prefix}-inventory-key`,
        price: '125.50',
        quantity: 7,
        reservedQuantity: 2,
      },
    });
    const movement = await prisma.inventoryMovement.create({
      data: {
        shopId,
        warehouseId: warehouse.id,
        inventoryItemId: inventory.id,
        partCatalogItemId: item.id,
        type: 'INITIAL_BALANCE',
        change: 7,
        quantityBefore: 0,
        quantityAfter: 7,
      },
    });
    const purchase = await prisma.purchase.create({
      data: {
        number: `${prefix}-purchase`,
        shopId,
        userId: adminId,
        subtotal: '500.00',
        totalAmount: '500.00',
      },
    });
    const purchaseItem = await prisma.purchaseItem.create({
      data: {
        purchaseId: purchase.id,
        inventoryItemId: inventory.id,
        partCatalogItemId: item.id,
        itemName: item.name,
        quantity: 4,
        purchasePrice: '125.00',
        lineTotal: '500.00',
      },
    });
    const order = await prisma.customerOrder.create({
      data: {
        number: `${prefix}-order`,
        customerNameSnapshot: 'Taxonomy Customer',
        deliveryType: 'PICKUP',
        subtotal: '250.00',
        total: '250.00',
        createdById: adminId,
      },
    });
    const orderItem = await prisma.customerOrderItem.create({
      data: {
        orderId: order.id,
        inventoryItemId: inventory.id,
        shopId,
        warehouseId: warehouse.id,
        catalogItemId: item.id,
        quantity: 2,
        unitPrice: '125.00',
        total: '250.00',
        shopUnitPrice: '100.00',
        clientUnitPrice: '125.00',
        grossAmount: '250.00',
        clientAmount: '250.00',
        shopAmount: '200.00',
        platformRevenue: '50.00',
        catalogItemName: item.name,
        shopName: `${prefix}-shop`,
        warehouseName: warehouse.name,
      },
    });
    const sale = await prisma.sale.create({
      data: {
        number: `${prefix}-sale`,
        shopId,
        userId: adminId,
        customerOrderId: order.id,
        subtotal: '250.00',
        totalAmount: '250.00',
      },
    });
    const saleItem = await prisma.saleItem.create({
      data: {
        saleId: sale.id,
        inventoryItemId: inventory.id,
        partCatalogItemId: item.id,
        itemName: item.name,
        quantity: 2,
        unitPrice: '125.00',
        lineTotal: '250.00',
      },
    });
    const payment = await prisma.customerOrderPayment.create({
      data: {
        orderId: order.id,
        amount: '100.00',
        method: 'CASH',
        receivedById: adminId,
        receivedAt: new Date(),
      },
    });
    const payable = await prisma.shopPayable.create({
      data: {
        shopId,
        customerOrderId: order.id,
        saleId: sale.id,
        grossShopAmount: '200.00',
        payableAmount: '200.00',
      },
    });
    const payout = await prisma.shopPayout.create({
      data: {
        number: `${prefix}-payout`,
        shopId,
        amount: '50.00',
        method: 'CASH',
        createdById: adminId,
      },
    });
    const allocation = await prisma.shopPayoutAllocation.create({
      data: {
        payoutId: payout.id,
        payableId: payable.id,
        amount: '50.00',
      },
    });
    const snapshot = {
      inventory: await prisma.shopInventoryItem.findUniqueOrThrow({
        where: { id: inventory.id },
      }),
      movement: await prisma.inventoryMovement.findUniqueOrThrow({
        where: { id: movement.id },
      }),
      purchase: await prisma.purchase.findUniqueOrThrow({
        where: { id: purchase.id },
      }),
      purchaseItem: await prisma.purchaseItem.findUniqueOrThrow({
        where: { id: purchaseItem.id },
      }),
      order: await prisma.customerOrder.findUniqueOrThrow({
        where: { id: order.id },
      }),
      orderItem: await prisma.customerOrderItem.findUniqueOrThrow({
        where: { id: orderItem.id },
      }),
      sale: await prisma.sale.findUniqueOrThrow({ where: { id: sale.id } }),
      saleItem: await prisma.saleItem.findUniqueOrThrow({
        where: { id: saleItem.id },
      }),
      payment: await prisma.customerOrderPayment.findUniqueOrThrow({
        where: { id: payment.id },
      }),
      payable: await prisma.shopPayable.findUniqueOrThrow({
        where: { id: payable.id },
      }),
      payout: await prisma.shopPayout.findUniqueOrThrow({
        where: { id: payout.id },
      }),
      allocation: await prisma.shopPayoutAllocation.findUniqueOrThrow({
        where: { id: allocation.id },
      }),
    };
    const decision = await createDecision({
      sourceCategoryId: source.id,
      classification: 'CATALOG_ITEM',
      targetCategoryId: target.id,
      targetCatalogItemId: item.id,
      canonicalName: item.name,
      duplicateStrategy: 'USE_EXISTING',
    });
    await action(decision.id, 'ready');
    await action(decision.id, 'approve');
    await action(decision.id, 'apply');

    for (const [model, before] of Object.entries(snapshot)) {
      const delegate = {
        inventory: prisma.shopInventoryItem,
        movement: prisma.inventoryMovement,
        purchase: prisma.purchase,
        purchaseItem: prisma.purchaseItem,
        order: prisma.customerOrder,
        orderItem: prisma.customerOrderItem,
        sale: prisma.sale,
        saleItem: prisma.saleItem,
        payment: prisma.customerOrderPayment,
        payable: prisma.shopPayable,
        payout: prisma.shopPayout,
        allocation: prisma.shopPayoutAllocation,
      }[model] as { findUniqueOrThrow(args: { where: { id: string } }): Promise<unknown> };
      expect(await delegate.findUniqueOrThrow({ where: { id: before.id } })).toEqual(
        before,
      );
    }

    await prisma.shopPayoutAllocation.delete({ where: { id: allocation.id } });
    await prisma.shopPayout.delete({ where: { id: payout.id } });
    await prisma.shopPayable.delete({ where: { id: payable.id } });
    await prisma.customerOrderPayment.delete({ where: { id: payment.id } });
    await prisma.saleItem.delete({ where: { id: saleItem.id } });
    await prisma.sale.delete({ where: { id: sale.id } });
    await prisma.customerOrderItem.delete({ where: { id: orderItem.id } });
    await prisma.customerOrder.delete({ where: { id: order.id } });
    await prisma.purchaseItem.delete({ where: { id: purchaseItem.id } });
    await prisma.purchase.delete({ where: { id: purchase.id } });
    await prisma.inventoryMovement.delete({ where: { id: movement.id } });
    await prisma.shopInventoryItem.delete({ where: { id: inventory.id } });
    await prisma.shopWarehouse.delete({ where: { id: warehouse.id } });
  });

  it('enforces redirect cycle safety and taxonomy apply creates no redirect', async () => {
    const root = await category('redirect-root', null, false);
    const target = await category('redirect-target', root.id, false);
    const source = await category('redirect-source', root.id);
    const created = [];
    for (const suffix of ['a', 'b', 'c']) {
      const item = await prisma.partCatalogItem.create({
        data: {
          internalCode: `E2E-REDIRECT-${suffix}-${Date.now()}`,
          name: `${prefix} redirect ${suffix}`,
          normalizedName: `${prefix} redirect ${suffix}`,
          searchTokens: `${prefix} redirect ${suffix}`,
          slug: `${prefix}-redirect-${suffix}`,
          categoryId: target.id,
        },
      });
      created.push(item);
      itemIds.push(item.id);
    }
    await expect(
      prisma.partCatalogItem.update({
        where: { id: created[0].id },
        data: { replacedById: created[0].id },
      }),
    ).rejects.toThrow();
    await prisma.partCatalogItem.update({
      where: { id: created[0].id },
      data: { replacedById: created[1].id },
    });
    await expect(
      prisma.partCatalogItem.update({
        where: { id: created[1].id },
        data: { replacedById: created[0].id },
      }),
    ).rejects.toThrow();
    await prisma.partCatalogItem.update({
      where: { id: created[1].id },
      data: { replacedById: created[2].id },
    });
    await expect(
      prisma.partCatalogItem.update({
        where: { id: created[2].id },
        data: { replacedById: created[0].id },
      }),
    ).rejects.toThrow();

    const decision = await createDecision({
      sourceCategoryId: source.id,
      classification: 'CATALOG_ITEM',
      targetCategoryId: target.id,
      targetCatalogItemId: created[2].id,
      canonicalName: created[2].name,
      duplicateStrategy: 'USE_EXISTING',
    });
    await action(decision.id, 'ready');
    await action(decision.id, 'approve');
    await action(decision.id, 'apply');
    expect(
      await prisma.partCatalogItem.findUniqueOrThrow({
        where: { id: created[2].id },
      }),
    ).toMatchObject({ replacedById: null });
    await prisma.partCatalogItem.update({
      where: { id: created[0].id },
      data: { replacedById: null },
    });
    await prisma.partCatalogItem.update({
      where: { id: created[1].id },
      data: { replacedById: null },
    });
  });

  it('protects CSV import and formula-like exported cells', async () => {
    const source = await category('csv-source');
    const decision = await createDecision({
      sourceCategoryId: source.id,
      classification: 'CATEGORY',
      notes: '=HYPERLINK("https://invalid.example")',
    });
    const exported = await request(http)
      .get('/admin/part-taxonomy/decisions/export.csv')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(exported.text).toContain('sourceCategoryId');
    expect(exported.text).toContain(`"'=HYPERLINK`);

    const header =
      'sourceCategoryId,classification,targetCategoryId,duplicateStrategy,status';
    const duplicateCsv = [
      header,
      `${source.id},CATEGORY,,,DRAFT`,
      `${source.id},CATEGORY,,,DRAFT`,
    ].join('\n');
    const preview = await request(http)
      .post('/admin/part-taxonomy/imports/csv/preview')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ csv: duplicateCsv })
      .expect(201);
    expect(preview.body.valid).toBe(false);
    expect(JSON.stringify(preview.body)).toContain('Дублирующийся');

    const invalidCsv = [
      header,
      `00000000-0000-4000-8000-000000000000,WRONG,,BAD,APPROVED`,
    ].join('\n');
    const invalidPreview = await request(http)
      .post('/admin/part-taxonomy/imports/csv/preview')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ csv: invalidCsv })
      .expect(201);
    expect(invalidPreview.body.valid).toBe(false);
    expect(JSON.stringify(invalidPreview.body)).toEqual(
      expect.stringContaining('только DRAFT'),
    );

    const countBefore = await prisma.partTaxonomyDecision.count();
    await request(http)
      .post('/admin/part-taxonomy/imports/csv')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ csv: invalidCsv })
      .expect(400);
    expect(await prisma.partTaxonomyDecision.count()).toBe(countBefore);
    expect(
      await prisma.partTaxonomyDecision.findUniqueOrThrow({
        where: { id: decision.id },
      }),
    ).toMatchObject({ status: 'DRAFT' });
  });
});
