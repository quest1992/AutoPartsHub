import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PartNumberType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PartCatalogService } from './part-catalog.service';

describe('PartCatalogService part numbers and aliases', () => {
  function createService() {
    const findPartCatalogItem = jest.fn().mockResolvedValue({ id: 'part-id' });
    const findPartNumber = jest.fn();
    const deletePartNumber = jest.fn();
    const createPartAlias = jest.fn();
    const findPartAlias = jest.fn();
    const deletePartAlias = jest.fn();
    const runTransaction = jest.fn();
    const transactionClient = {
      partNumberManufacturer: {
        upsert: jest.fn().mockResolvedValue({ id: 'manufacturer-id' }),
      },
      partNumber: {
        updateMany: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: 'number-id' }),
      },
    };
    const prisma = {
      partCatalogItem: {
        findUnique: findPartCatalogItem,
        findFirst: jest.fn().mockResolvedValue(null),
      },
      partNumber: {
        findMany: jest.fn(),
        findFirst: findPartNumber,
        delete: deletePartNumber,
      },
      partAlias: {
        create: createPartAlias,
        findMany: jest.fn(),
        findFirst: findPartAlias,
        delete: deletePartAlias,
      },
      $transaction: runTransaction.mockImplementation(
        (callback: (client: typeof transactionClient) => Promise<unknown>) =>
          callback(transactionClient),
      ),
    } as unknown as PrismaService;

    return {
      prisma,
      transactionClient,
      service: new PartCatalogService(prisma),
      mocks: {
        createPartAlias,
        deletePartAlias,
        deletePartNumber,
        findPartAlias,
        findPartCatalogItem,
        findPartNumber,
        runTransaction,
      },
    };
  }

  it('normalizes and creates a part number', async () => {
    const { service, transactionClient } = createService();
    const expectedData = {
      rawNumber: '04465-0k240',
      normalizedNumber: '044650K240',
      brand: 'Toyota',
      isPrimary: false,
    };

    await service.addPartNumber('part-id', {
      rawNumber: ' 04465-0k240 ',
      type: PartNumberType.OEM,
      brand: ' Toyota ',
    });

    expect(transactionClient.partNumber.create).toHaveBeenCalledWith(
      expect.objectContaining({
        // Jest matcher accepts an intentionally partial Prisma create payload.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining(expectedData),
      }),
    );
  });

  it('rejects an empty normalized part number', async () => {
    const { service } = createService();

    await expect(
      service.addPartNumber('part-id', {
        rawNumber: '---',
        type: PartNumberType.OEM,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a missing part catalog item for a number', async () => {
    const { service, mocks } = createService();
    mocks.findPartCatalogItem.mockResolvedValue(null);

    await expect(
      service.addPartNumber('missing-id', {
        rawNumber: '04465-0K240',
        type: PartNumberType.OEM,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns a conflict for a duplicate number', async () => {
    const { service, mocks } = createService();
    mocks.runTransaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.addPartNumber('part-id', {
        rawNumber: '04465-0K240',
        type: PartNumberType.OEM,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('clears the previous primary number of the same type in one transaction', async () => {
    const { service, transactionClient } = createService();

    await service.addPartNumber('part-id', {
      rawNumber: '04465-0K240',
      type: PartNumberType.OEM,
      isPrimary: true,
    });

    expect(transactionClient.partNumber.updateMany).toHaveBeenCalledWith({
      where: {
        partCatalogItemId: 'part-id',
        type: PartNumberType.OEM,
        isPrimary: true,
      },
      data: { isPrimary: false },
    });
  });

  it('deletes only a number belonging to the requested part', async () => {
    const { service, mocks } = createService();
    mocks.findPartNumber.mockResolvedValue({ id: 'number-id' });

    await service.deletePartNumber('part-id', 'number-id');

    expect(mocks.findPartNumber).toHaveBeenCalledWith({
      where: { id: 'number-id', partCatalogItemId: 'part-id' },
      select: { id: true },
    });
  });

  it('does not delete a number belonging to another part', async () => {
    const { service, mocks } = createService();
    mocks.findPartNumber.mockResolvedValue(null);

    await expect(
      service.deletePartNumber('part-id', 'foreign-number-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.deletePartNumber).not.toHaveBeenCalled();
  });

  it('normalizes and creates an alias', async () => {
    const { service, mocks } = createService();
    const expectedData = {
      alias: 'Колодки — тормозные',
      normalizedAlias: 'колодки тормозные',
      source: 'Каталог поставщика',
      isApproved: true,
    };
    mocks.createPartAlias.mockResolvedValue({ id: 'alias-id' });

    await service.addPartAlias('part-id', {
      alias: ' Колодки — тормозные ',
      source: ' Каталог поставщика ',
    });

    expect(mocks.createPartAlias).toHaveBeenCalledWith(
      expect.objectContaining({
        // Jest matcher accepts an intentionally partial Prisma create payload.
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.objectContaining(expectedData),
      }),
    );
  });

  it('rejects an empty normalized alias', async () => {
    const { service } = createService();

    await expect(
      service.addPartAlias('part-id', { alias: '   ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a missing part catalog item for an alias', async () => {
    const { service, mocks } = createService();
    mocks.findPartCatalogItem.mockResolvedValue(null);

    await expect(
      service.addPartAlias('missing-id', { alias: 'Колодки' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns a conflict for a duplicate alias', async () => {
    const { service, mocks } = createService();
    mocks.createPartAlias.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.addPartAlias('part-id', { alias: 'Колодки' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deletes only an alias belonging to the requested part', async () => {
    const { service, mocks } = createService();
    mocks.findPartAlias.mockResolvedValue({ id: 'alias-id' });

    await service.deletePartAlias('part-id', 'alias-id');

    expect(mocks.findPartAlias).toHaveBeenCalledWith({
      where: { id: 'alias-id', partCatalogItemId: 'part-id' },
      select: { id: true },
    });
  });

  it('does not delete an alias belonging to another part', async () => {
    const { service, mocks } = createService();
    mocks.findPartAlias.mockResolvedValue(null);

    await expect(
      service.deletePartAlias('part-id', 'foreign-alias-id'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(mocks.deletePartAlias).not.toHaveBeenCalled();
  });
});
